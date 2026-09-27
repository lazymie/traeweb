import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Mail, Phone, Edit3, Save, X, FileText, Heart, PawPrint, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import type { Pet, Adoption, User } from '../../shared/types';
import { get, del, post, asArray } from '@/utils/api';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import PetCard from '@/components/PetCard';
import EmptyState from '@/components/Empty';
import { PageLoading } from '@/components/Loading';
import {
  PET_STATUS_LABELS, ADOPTION_STATUS_LABELS, ROLE_LABELS, formatDateTime, relativeTime,
} from '@/utils/format';
import { cn } from '@/lib/utils';

type Tab = 'profile' | 'publish' | 'applications' | 'favorites';

const TABS: { v: Tab; label: string; icon: any }[] = [
  { v: 'profile', label: '个人资料', icon: Edit3 },
  { v: 'publish', label: '我的发布', icon: FileText },
  { v: 'applications', label: '我的申请', icon: Heart },
  { v: 'favorites', label: '我的收藏', icon: PawPrint },
];

export default function Profile() {
  const [params, setParams] = useSearchParams();
  const { user, updateProfile } = useAuthStore();
  const [tab, setTab] = useState<Tab>((params.get('tab') as Tab) || 'profile');
  const [myPets, setMyPets] = useState<Pet[]>([]);
  const [myApplications, setMyApplications] = useState<(Adoption & { pet?: Pet; applicant?: User })[]>([]);
  const [myFavorites, setMyFavorites] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);

  // 资料编辑
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nickname: '', email: '', phone: '', bio: '' });

  useEffect(() => {
    if (user) {
      setForm({
        nickname: user.nickname || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (tab !== 'profile') next.set('tab', tab);
    else next.delete('tab');
    setParams(next, { replace: true });
  }, [tab]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    if (tab === 'publish') {
      try {
        const list = await get<Pet[]>('/pets/mine');
        setMyPets(asArray(list));
      } catch (e: any) { toast.error(e.message); }
    } else if (tab === 'applications') {
      try {
        const list = await get<(Adoption & { pet?: Pet; applicant?: User })[]>('/adoptions');
        setMyApplications(asArray(list));
      } catch (e: any) { toast.error(e.message); }
    } else if (tab === 'favorites') {
      try {
        const list = await get<Pet[]>('/auth/me/favorites');
        setMyFavorites(asArray(list));
      } catch (e: any) { toast.error(e.message); }
    }
  }, [tab, user]);

  useEffect(() => {
    if (tab !== 'profile') fetchData();
  }, [fetchData]);

  if (!user) return <PageLoading />;

  const onSaveProfile = async () => {
    try {
      await updateProfile(form);
      toast.success('资料已更新');
      setEditing(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const onRemoveFavorite = async (petId: number) => {
    try {
      await del(`/pets/${petId}/favorite`);
      setMyFavorites(prev => prev.filter(p => p.id !== petId));
      toast.success('已取消收藏');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const onCancelApplication = async (id: number) => {
    if (!confirm('确定取消该申请吗？')) return;
    try {
      // 调用 PUT /api/adoptions/:id 取消
      // 后端要求 status 字段；这里直接调用，没有权限就报错
      // 由于普通用户没有权限调用这个接口，我们暂时跳过
      // 改：实际后端 PUT /api/adoptions/:id 检查 isOwner/isAdmin，普通用户无权
      // 简化：暂不实现取消
      toast.info('请联系发布者取消申请');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="container py-8 md:py-12">
      {/* 顶部资料卡 */}
      <div className="rounded-3xl overflow-hidden bg-cream-50 border border-warm-100 shadow-soft mb-8">
        <div className="h-32 bg-gradient-to-br from-coral-400 via-coral-500 to-amber-gold relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.3),transparent)]" />
        </div>
        <div className="px-6 pb-6 flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
          <div className="relative">
            {user.avatar ? (
              <img src={user.avatar} alt={user.nickname} className="h-20 w-20 rounded-full object-cover border-4 border-cream-50" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-warm-200 border-4 border-cream-50">
                <PawPrint size={28} className="text-ink-500" />
              </div>
            )}
            <span className={cn(
              'absolute -bottom-1 -right-1 badge border-2 border-cream-50',
              user.role === 'admin' ? 'bg-coral-400 text-cream-50' :
              user.role === 'org' ? 'bg-sage-500 text-cream-50' : 'bg-warm-200 text-ink-700'
            )}>
              {ROLE_LABELS[user.role]}
            </span>
          </div>
          <div className="flex-1 pt-3">
            <h1 className="font-serif text-2xl font-bold text-ink-900">{user.nickname}</h1>
            <p className="text-sm text-ink-500">@{user.username}</p>
            {user.bio && <p className="mt-2 text-sm text-ink-700">{user.bio}</p>}
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-ink-500">
              <span className="flex items-center gap-1"><Mail size={11} /> {user.email}</span>
              {user.phone && <span className="flex items-center gap-1"><Phone size={11} /> {user.phone}</span>}
              <span>注册于 {relativeTime(user.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-warm-100 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              tab === t.v
                ? 'border-coral-400 text-coral-500'
                : 'border-transparent text-ink-700 hover:text-ink-900'
            )}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      {tab === 'profile' && (
        <div className="card p-6 max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl font-semibold">基本资料</h2>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="btn-ghost">
                <Edit3 size={14} /> 编辑
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="btn-ghost"><X size={14} /> 取消</button>
                <button onClick={onSaveProfile} className="btn-primary"><Save size={14} /> 保存</button>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-ink-500 mb-2">昵称</label>
              <input
                type="text" value={form.nickname} disabled={!editing}
                onChange={e => setForm(s => ({ ...s, nickname: e.target.value }))}
                className="input-base disabled:opacity-70"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-ink-500 mb-2">邮箱</label>
              <input
                type="email" value={form.email} disabled={!editing}
                onChange={e => setForm(s => ({ ...s, email: e.target.value }))}
                className="input-base disabled:opacity-70"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-ink-500 mb-2">手机号</label>
              <input
                type="tel" value={form.phone} disabled={!editing}
                onChange={e => setForm(s => ({ ...s, phone: e.target.value }))}
                className="input-base disabled:opacity-70"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-ink-500 mb-2">个人简介</label>
              <textarea
                value={form.bio} disabled={!editing} rows={3}
                onChange={e => setForm(s => ({ ...s, bio: e.target.value }))}
                className="input-base resize-none disabled:opacity-70"
              />
            </div>
          </div>
        </div>
      )}

      {tab === 'publish' && (
        <div>
          <div className="mb-4 flex justify-end">
            <Link to="/publish" className="btn-primary">发布新信息</Link>
          </div>
          {myPets.length === 0 ? (
            <EmptyState
              icon={<FileText size={28} />}
              title="还没有发布"
              description="点击右上角按钮，发布您的第一个领养信息"
              action={<Link to="/publish" className="btn-primary">立即发布</Link>}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {myPets.map(p => (
                <div key={p.id} className="relative">
                  <PetCard pet={p} />
                  <span className={cn(
                    'absolute left-3 top-3 badge shadow-soft',
                    p.status === 'available' ? 'bg-sage-500 text-cream-50' :
                    p.status === 'pending' ? 'bg-amber-soft text-ink-900' :
                    p.status === 'rejected' ? 'bg-coral-400 text-cream-50' : 'bg-ink-500 text-cream-50'
                  )}>
                    {PET_STATUS_LABELS[p.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'applications' && (
        <div>
          {myApplications.length === 0 ? (
            <EmptyState
              icon={<Heart size={28} />}
              title="还没有提交申请"
              description="浏览领养中心，找到心仪的毛孩子提交申请"
              action={<Link to="/pets" className="btn-primary">去领养中心</Link>}
            />
          ) : (
            <div className="space-y-4">
              {myApplications.map(a => (
                <div key={a.id} className="card p-5 flex items-start gap-4">
                  {a.pet?.images?.[0] ? (
                    <img src={a.pet.images[0]} alt={a.pet.title} className="h-20 w-20 rounded-2xl object-cover flex-none" />
                  ) : (
                    <div className="h-20 w-20 rounded-2xl bg-warm-100 flex items-center justify-center">
                      <PawPrint size={20} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <Link to={`/pets/${a.petId}`} className="font-serif text-lg font-semibold hover:text-coral-400">
                        {a.pet?.title || '已删除'}
                      </Link>
                      <span className={cn(
                        'badge',
                        a.status === 'pending' ? 'bg-amber-soft text-ink-900' :
                        a.status === 'approved' ? 'bg-sage-500/15 text-sage-600' :
                        a.status === 'completed' ? 'bg-sage-500 text-cream-50' :
                        a.status === 'rejected' ? 'bg-coral-400/15 text-coral-500' : 'bg-warm-100 text-ink-700'
                      )}>
                        {ADOPTION_STATUS_LABELS[a.status]}
                      </span>
                    </div>
                    <p className="text-xs text-ink-500 mt-1">申请于 {formatDateTime(a.createdAt)}</p>
                    <p className="mt-2 text-sm text-ink-700 line-clamp-2">{a.reason}</p>
                    {a.reviewNote && (
                      <p className="mt-2 text-xs text-ink-500 italic">审核备注：{a.reviewNote}</p>
                    )}
                  </div>
                  <div className="flex-none">
                    {a.status === 'pending' && (
                      <span className="flex items-center gap-1 text-xs text-amber-gold">
                        <AlertCircle size={12} /> 等待审核
                      </span>
                    )}
                    {a.status === 'approved' && (
                      <span className="flex items-center gap-1 text-xs text-sage-600">
                        <CheckCircle2 size={12} /> 已通过
                      </span>
                    )}
                    {a.status === 'rejected' && (
                      <span className="flex items-center gap-1 text-xs text-coral-500">
                        <XCircle size={12} /> 已驳回
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'favorites' && (
        <div>
          {myFavorites.length === 0 ? (
            <EmptyState
              icon={<Heart size={28} />}
              title="还没有收藏"
              description="在宠物详情页点击收藏，方便日后查看"
              action={<Link to="/pets" className="btn-primary">去领养中心</Link>}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {myFavorites.map(p => (
                <PetCard
                  key={p.id} pet={p} favorited
                  onToggleFavorite={onRemoveFavorite}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
