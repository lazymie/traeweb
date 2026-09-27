import { useEffect, useState, useCallback } from 'react';
import { Check, X, Eye, ArrowDownUp, RefreshCw, Search } from 'lucide-react';
import type { Pet, PetStatus, User } from '../../../shared/types';
import { get, put } from '@/utils/api';
import { toast } from '@/store/toast';
import Modal from '@/components/Modal';
import { PageLoading } from '@/components/Loading';
import EmptyState from '@/components/Empty';
import ImageGallery from '@/components/ImageGallery';
import { CATEGORY_LABELS, PET_STATUS_LABELS, formatDateTime, formatAge, GENDER_LABELS } from '@/utils/format';
import { cn } from '@/lib/utils';

const STATUS_TABS: { v: PetStatus; label: string }[] = [
  { v: 'pending', label: '待审核' },
  { v: 'available', label: '已上架' },
  { v: 'adopted', label: '已领养' },
  { v: 'rejected', label: '已驳回' },
  { v: 'offline', label: '已下架' },
];

export default function AdminPets() {
  const [list, setList] = useState<(Pet & { publisher?: User })[]>([]);
  const [status, setStatus] = useState<PetStatus>('pending');
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<Pet | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await get<(Pet & { publisher?: User })[]>('/admin/pets', { status });
      setList(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const onReview = async (petId: number, action: 'approve' | 'reject', note: string) => {
    try {
      const newStatus = action === 'approve' ? 'available' : 'rejected';
      await put(`/admin/pets/${petId}/review`, { status: newStatus, reviewNote: note });
      toast.success(action === 'approve' ? '已审核通过' : '已驳回');
      setPreview(null);
      setReviewAction(null);
      setReviewNote('');
      fetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const onToggleStatus = async (petId: number, current: PetStatus) => {
    const newStatus: PetStatus = current === 'available' ? 'offline' : 'available';
    try {
      await put(`/admin/pets/${petId}/status`, { status: newStatus });
      toast.success(`已${newStatus === 'available' ? '上架' : '下架'}`);
      fetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink-900">宠物信息审核</h1>
          <p className="mt-1 text-sm text-ink-700">审核用户发布的宠物领养信息</p>
        </div>
        <button onClick={fetch} className="btn-ghost"><RefreshCw size={14} /> 刷新</button>
      </div>

      {/* 状态筛选 */}
      <div className="flex gap-1 border-b border-warm-100 overflow-x-auto">
        {STATUS_TABS.map(t => (
          <button
            key={t.v}
            onClick={() => setStatus(t.v)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              status === t.v ? 'border-coral-400 text-coral-500' : 'border-transparent text-ink-700 hover:text-ink-900'
            )}
          >
            {t.label}
            <span className="text-xs font-mono text-ink-500">
              {t.v === status ? list.length : ''}
            </span>
          </button>
        ))}
      </div>

      {loading ? <PageLoading /> : list.length === 0 ? (
        <EmptyState title={`暂无${STATUS_TABS.find(t => t.v === status)?.label}的宠物`} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-warm-100/60 text-xs font-mono uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-4 py-3 text-left">宠物</th>
                  <th className="px-4 py-3 text-left">种类</th>
                  <th className="px-4 py-3 text-left">发布者</th>
                  <th className="px-4 py-3 text-left">状态</th>
                  <th className="px-4 py-3 text-left">提交时间</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {list.map(p => (
                  <tr key={p.id} className="hover:bg-warm-100/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.title} className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-warm-100" />
                        )}
                        <div>
                          <p className="font-medium text-ink-900">{p.title}</p>
                          <p className="text-xs text-ink-500">{p.breed} · {formatAge(p.age, p.ageUnit)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-700">{CATEGORY_LABELS[p.category]}</td>
                    <td className="px-4 py-3 text-ink-700">{p.publisher?.nickname || '未知'}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'badge',
                        p.status === 'available' ? 'bg-sage-500/15 text-sage-600' :
                        p.status === 'pending' ? 'bg-amber-soft text-ink-900' :
                        p.status === 'rejected' ? 'bg-coral-400/15 text-coral-500' :
                        p.status === 'adopted' ? 'bg-amber-gold/15 text-amber-gold' : 'bg-warm-100 text-ink-700'
                      )}>
                        {PET_STATUS_LABELS[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-500 font-mono">{formatDateTime(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setPreview(p)}
                          className="btn-ghost px-2 py-1"
                          title="查看详情"
                        >
                          <Eye size={14} />
                        </button>
                        {p.status === 'pending' && (
                          <>
                            <button
                              onClick={() => { setPreview(p); setReviewAction('approve'); }}
                              className="btn-ghost px-2 py-1 text-sage-600"
                              title="通过"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => { setPreview(p); setReviewAction('reject'); }}
                              className="btn-ghost px-2 py-1 text-coral-500"
                              title="驳回"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                        {(p.status === 'available' || p.status === 'offline') && (
                          <button
                            onClick={() => onToggleStatus(p.id, p.status)}
                            className="btn-ghost px-2 py-1"
                            title={p.status === 'available' ? '下架' : '上架'}
                          >
                            <ArrowDownUp size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 详情预览弹层 */}
      <Modal
        open={!!preview}
        onClose={() => { setPreview(null); setReviewAction(null); setReviewNote(''); }}
        title={preview?.title}
        size="lg"
        footer={preview && reviewAction ? (
          <>
            <button onClick={() => { setReviewAction(null); setReviewNote(''); }} className="btn-ghost">取消</button>
            <button
              onClick={() => onReview(preview.id, reviewAction, reviewNote)}
              className={reviewAction === 'approve' ? 'btn-primary' : 'btn-danger'}
            >
              {reviewAction === 'approve' ? '通过审核' : '驳回'}
            </button>
          </>
        ) : undefined}
      >
        {preview && (
          <div className="space-y-4">
            {reviewAction && (
              <div className="rounded-2xl bg-amber-gold/10 border border-amber-gold/30 p-3">
                <p className="text-xs text-ink-700">
                  您正在 {reviewAction === 'approve' ? '通过' : '驳回'} 审核此宠物信息。
                  {reviewAction === 'reject' && '请填写驳回原因。'}
                </p>
                <textarea
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  rows={2}
                  placeholder={reviewAction === 'reject' ? '驳回原因（必填）' : '审核备注（选填）'}
                  className="input-base mt-2 resize-none"
                />
              </div>
            )}
            <ImageGallery images={preview.images} alt={preview.title} />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="种类" value={CATEGORY_LABELS[preview.category]} />
              <Info label="品种" value={preview.breed} />
              <Info label="年龄" value={formatAge(preview.age, preview.ageUnit)} />
              <Info label="性别" value={GENDER_LABELS[preview.gender]} />
              <Info label="所在地" value={preview.location} />
              <Info label="绝育" value={preview.sterilized ? '是' : '否'} />
              <Info label="健康状况" value={preview.health} />
              <Info label="免疫情况" value={preview.vaccination} />
            </div>
            <div>
              <p className="text-xs font-mono uppercase text-ink-500 mb-1">性格特点</p>
              <p className="text-sm text-ink-900">{preview.personality}</p>
            </div>
            <div>
              <p className="text-xs font-mono uppercase text-ink-500 mb-1">详细描述</p>
              <p className="text-sm text-ink-900 whitespace-pre-wrap">{preview.description}</p>
            </div>
            {preview.reviewNote && (
              <div className="rounded-2xl bg-warm-100 p-3 text-sm">
                <p className="text-xs font-mono uppercase text-ink-500 mb-1">上次审核备注</p>
                <p className="text-ink-700">{preview.reviewNote}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-mono uppercase text-ink-500">{label}</p>
      <p className="text-ink-900">{value || '—'}</p>
    </div>
  );
}
