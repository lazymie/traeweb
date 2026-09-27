import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Eye, Syringe, Stethoscope, ShieldCheck, PawPrint, ArrowLeft, Send, Calendar, User as UserIcon } from 'lucide-react';
import type { Pet, User, Comment } from '../../shared/types';
import { get, post, del } from '@/utils/api';
import ImageGallery from '@/components/ImageGallery';
import Modal from '@/components/Modal';
import { PageLoading } from '@/components/Loading';
import EmptyState from '@/components/Empty';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import {
  CATEGORY_LABELS, GENDER_LABELS, formatAge, formatDateTime, relativeTime, ROLE_LABELS,
} from '@/utils/format';
import PetCard from '@/components/PetCard';

interface PetDetail extends Pet {
  publisher?: User;
  comments?: (Comment & { user?: User })[];
  favorited?: boolean;
}

export default function PetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [pet, setPet] = useState<PetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [related, setRelated] = useState<Pet[]>([]);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<(Comment & { user?: User })[]>([]);

  const fetchPet = useCallback(async () => {
    setLoading(true);
    try {
      const data = await get<PetDetail>(`/pets/${id}`);
      setPet(data);
      setComments(data.comments || []);
      // 相关推荐
      const rel = await get<{ list: Pet[] }>('/pets', { category: data.category, pageSize: 4 });
      setRelated(rel.list.filter(p => p.id !== data.id).slice(0, 3));
    } catch (e: any) {
      toast.error(e.message || '加载失败');
      navigate('/pets');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchPet();
  }, [fetchPet]);

  const onToggleFavorite = async () => {
    if (!user) {
      toast.warning('请先登录');
      return;
    }
    if (!pet) return;
    const wasFav = pet.favorited;
    setPet({ ...pet, favorited: !wasFav, favoriteCount: pet.favoriteCount + (wasFav ? -1 : 1) });
    try {
      if (wasFav) {
        await del(`/pets/${pet.id}/favorite`);
      } else {
        await post(`/pets/${pet.id}/favorite`);
      }
    } catch (e: any) {
      setPet({ ...pet, favorited: wasFav, favoriteCount: pet.favoriteCount });
      toast.error(e.message);
    }
  };

  const onSubmitComment = async () => {
    if (!user) {
      toast.warning('请先登录');
      return;
    }
    if (!commentText.trim()) return;
    try {
      const c = await post<Comment & { user?: User }>(`/pets/${pet!.id}/comments`, { content: commentText.trim() });
      setComments(prev => [...prev, c]);
      setCommentText('');
      toast.success('留言已发布');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) return <PageLoading />;
  if (!pet) return null;

  const isOwner = user?.id === pet.publisherId;
  const canApply = pet.status === 'available' && !isOwner;

  return (
    <div className="container py-8 md:py-12">
      <Link to="/pets" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-coral-400 transition-colors mb-6">
        <ArrowLeft size={14} /> 返回列表
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        {/* 左：图片 + 信息 */}
        <div>
          <ImageGallery images={pet.images} alt={pet.title} />

          <div className="mt-8 grid gap-4">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="font-serif text-4xl font-bold text-ink-900">{pet.title}</h1>
              <span className="text-sm text-ink-500 font-mono">
                {formatAge(pet.age, pet.ageUnit)} · {GENDER_LABELS[pet.gender]}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-ink-700">
              <span className="badge bg-warm-100">{CATEGORY_LABELS[pet.category]}</span>
              {pet.breed && <span className="badge bg-warm-100">{pet.breed}</span>}
              {pet.location && (
                <span className="badge bg-warm-100 flex items-center gap-1">
                  <MapPin size={10} /> {pet.location}
                </span>
              )}
              {pet.sterilized && (
                <span className="badge bg-sage-500/15 text-sage-600 flex items-center gap-1">
                  <ShieldCheck size={10} /> 已绝育
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-ink-500 font-mono pt-1">
              <span className="flex items-center gap-1"><Eye size={12} /> {pet.viewCount} 次浏览</span>
              <span className="flex items-center gap-1"><Heart size={12} /> {pet.favoriteCount} 人收藏</span>
              <span className="flex items-center gap-1"><Calendar size={12} /> {formatDateTime(pet.createdAt)}</span>
            </div>

            {/* 信息卡 */}
            <div className="grid gap-4 sm:grid-cols-2 mt-2">
              <InfoCard icon={<Stethoscope size={16} />} title="健康状况" content={pet.health || '暂无信息'} />
              <InfoCard icon={<Syringe size={16} />} title="免疫情况" content={pet.vaccination || '暂无信息'} />
              <InfoCard icon={<PawPrint size={16} />} title="性格特点" content={pet.personality || '暂无信息'} />
              <InfoCard icon={<MapPin size={16} />} title="所在地" content={pet.location || '未填写'} />
            </div>

            {/* 描述 */}
            {pet.description && (
              <div className="rounded-3xl bg-cream-50 border border-warm-100 p-6 mt-2">
                <h3 className="font-serif text-lg font-semibold mb-3">它的故事</h3>
                <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">{pet.description}</p>
              </div>
            )}

            {/* 留言 */}
            <div className="mt-2">
              <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
                留言互动 <span className="text-xs font-mono text-ink-500">({comments.length})</span>
              </h3>

              {user ? (
                <div className="flex gap-3 mb-6">
                  {user.avatar && <img src={user.avatar} alt={user.nickname} className="h-9 w-9 rounded-full object-cover flex-none" />}
                  <div className="flex-1">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={`对 ${pet.title} 有什么想问的？`}
                      rows={3}
                      className="input-base resize-none"
                    />
                    <div className="mt-2 flex justify-end">
                      <button onClick={onSubmitComment} disabled={!commentText.trim()} className="btn-primary">
                        <Send size={14} /> 发布留言
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-warm-100 p-4 text-sm text-ink-700 mb-6">
                  <Link to="/login" className="text-coral-400 font-medium">登录</Link> 后可参与留言咨询
                </div>
              )}

              {comments.length === 0 ? (
                <EmptyState title="还没有留言" description="成为第一个留言的人" />
              ) : (
                <div className="space-y-4">
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-3">
                      {c.user?.avatar ? (
                        <img src={c.user.avatar} alt={c.user.nickname} className="h-9 w-9 rounded-full object-cover flex-none" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-warm-200 text-ink-500 flex-none">
                          <UserIcon size={14} />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-medium text-ink-900">{c.user?.nickname || '匿名'}</span>
                          {c.user?.role === 'org' && <span className="badge bg-sage-500/15 text-sage-600">机构</span>}
                          {c.user?.role === 'admin' && <span className="badge bg-coral-400/15 text-coral-500">管理员</span>}
                          <span className="text-xs text-ink-500">{relativeTime(c.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-sm text-ink-700 whitespace-pre-wrap">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右：黏性申请卡 */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <div className="card p-6">
              <p className="text-xs font-mono uppercase tracking-wider text-ink-500 mb-2">发布者</p>
              {pet.publisher ? (
                <div className="flex items-center gap-3">
                  {pet.publisher.avatar && (
                    <img src={pet.publisher.avatar} alt={pet.publisher.nickname} className="h-12 w-12 rounded-full object-cover" />
                  )}
                  <div>
                    <p className="font-medium text-ink-900">{pet.publisher.nickname}</p>
                    <p className="text-xs text-ink-500">{ROLE_LABELS[pet.publisher.role]}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink-500">未知</p>
              )}
              {pet.publisher?.bio && <p className="mt-3 text-xs text-ink-700 leading-relaxed">{pet.publisher.bio}</p>}

              <div className="my-5 border-t border-warm-100" />

              <p className="text-xs font-mono uppercase tracking-wider text-ink-500 mb-3">领养状态</p>
              <p className="font-serif text-2xl font-semibold text-coral-400">
                {pet.status === 'available' ? '可领养' : pet.status === 'adopted' ? '已领养' : '不可领养'}
              </p>

              {isOwner && (
                <p className="mt-2 text-xs text-ink-500">这是您发布的宠物，您将处理申请审核</p>
              )}

              <div className="mt-5 space-y-2">
                {canApply ? (
                  <button onClick={() => setApplyOpen(true)} className="btn-primary w-full">
                    <Heart size={16} /> 申请领养
                  </button>
                ) : isOwner ? (
                  <Link to="/profile?tab=publish" className="btn-outline w-full">管理我的发布</Link>
                ) : pet.status === 'adopted' ? (
                  <button disabled className="btn-outline w-full opacity-60 pointer-events-none">已被领养</button>
                ) : (
                  <button disabled className="btn-outline w-full opacity-60 pointer-events-none">暂不可申请</button>
                )}
                <button
                  onClick={onToggleFavorite}
                  className={`btn-outline w-full ${pet.favorited ? 'border-coral-400 text-coral-400' : ''}`}
                >
                  <Heart size={14} className={pet.favorited ? 'fill-coral-400' : ''} />
                  {pet.favorited ? '已收藏' : '收藏'}
                </button>
              </div>
            </div>

            <div className="rounded-3xl bg-amber-gold/10 border border-amber-gold/30 p-4 text-xs text-ink-700">
              <p className="font-medium mb-1">领养须知</p>
              <p>领养是长期承诺，请认真了解后再申请。平台提倡按时免疫、必要时绝育、定期回访。</p>
            </div>
          </div>
        </aside>
      </div>

      {/* 移动端申请按钮 */}
      {canApply && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-cream-50/95 backdrop-blur border-t border-warm-100 p-3 flex gap-2">
          <button onClick={onToggleFavorite} className="btn-outline flex-none">
            <Heart size={14} className={pet.favorited ? 'fill-coral-400 text-coral-400' : ''} />
          </button>
          <button onClick={() => setApplyOpen(true)} className="btn-primary flex-1">
            <Heart size={14} /> 申请领养
          </button>
        </div>
      )}

      {/* 申请弹层 */}
      <AdoptionApplyModal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        petId={pet.id}
        petTitle={pet.title}
      />

      {/* 相关推荐 */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-2xl font-bold mb-6">同类别毛孩子</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map(p => (
              <PetCard key={p.id} pet={p} publisher={(p as any).publisher} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function InfoCard({ icon, title, content }: { icon: React.ReactNode; title: string; content: string }) {
  return (
    <div className="rounded-2xl bg-cream-50 border border-warm-100 p-4">
      <div className="flex items-center gap-2 text-coral-400">
        {icon}
        <span className="text-xs font-mono uppercase tracking-wider text-ink-500">{title}</span>
      </div>
      <p className="mt-2 text-sm text-ink-900">{content}</p>
    </div>
  );
}

function AdoptionApplyModal({ open, onClose, petId, petTitle }: { open: boolean; onClose: () => void; petId: number; petTitle: string }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [experience, setExperience] = useState('');
  const [contact, setContact] = useState(user?.phone || '');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!reason.trim() || !contact.trim()) {
      toast.warning('请填写申请说明和联系方式');
      return;
    }
    setSubmitting(true);
    try {
      await post('/adoptions', { petId, reason, experience, contact });
      toast.success('申请已提交，等待审核');
      onClose();
      navigate('/profile?tab=applications');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`申请领养「${petTitle}」`}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">取消</button>
          <button onClick={onSubmit} disabled={submitting} className="btn-primary">
            {submitting ? '提交中...' : '提交申请'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-900 mb-2">
            申请说明 <span className="text-coral-400">*</span>
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="请说明您为什么想领养这只宠物，您的家庭情况..."
            className="input-base resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-900 mb-2">养宠经验</label>
          <textarea
            value={experience}
            onChange={e => setExperience(e.target.value)}
            rows={2}
            placeholder="您之前养过宠物吗？有什么经验？"
            className="input-base resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-900 mb-2">
            联系方式 <span className="text-coral-400">*</span>
          </label>
          <input
            type="text"
            value={contact}
            onChange={e => setContact(e.target.value)}
            placeholder="微信 / 电话 / 邮箱"
            className="input-base"
          />
        </div>
        <p className="text-xs text-ink-500 leading-relaxed">
          提交后发布者或管理员将审核您的申请。审核通过后会通过您提供的联系方式与您沟通。请确保信息真实有效。
        </p>
      </div>
    </Modal>
  );
}
