import { useEffect, useState, useCallback } from 'react';
import { Check, X, RefreshCw, MessageSquarePlus, HeartHandshake } from 'lucide-react';
import type { Adoption, AdoptionStatus, Pet, User } from '../../../shared/types';
import { get, put, post } from '@/utils/api';
import { toast } from '@/store/toast';
import Modal from '@/components/Modal';
import EmptyState from '@/components/Empty';
import { PageLoading } from '@/components/Loading';
import { ADOPTION_STATUS_LABELS, formatDateTime, relativeTime } from '@/utils/format';
import { cn } from '@/lib/utils';

const STATUS_TABS: { v: AdoptionStatus | 'all'; label: string }[] = [
  { v: 'all', label: '全部' },
  { v: 'pending', label: '审核中' },
  { v: 'approved', label: '已通过' },
  { v: 'completed', label: '已完成' },
  { v: 'rejected', label: '已驳回' },
  { v: 'cancelled', label: '已取消' },
];

export default function AdminAdoptions() {
  const [list, setList] = useState<(Adoption & { pet?: Pet; applicant?: User })[]>([]);
  const [status, setStatus] = useState<AdoptionStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Adoption & { pet?: Pet; applicant?: User } | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (status !== 'all') params.status = status;
      const data = await get<(Adoption & { pet?: Pet; applicant?: User })[]>('/admin/adoptions', params);
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

  const onUpdateStatus = async (id: number, newStatus: AdoptionStatus, note?: string) => {
    try {
      await put(`/adoptions/${id}`, { status: newStatus, reviewNote: note });
      toast.success('状态已更新');
      setDetail(null);
      setReviewNote('');
      fetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const onAddFollowup = async (id: number, content: string) => {
    try {
      await post(`/adoptions/${id}/followups`, { content });
      toast.success('回访记录已添加');
      setDetail(null);
      fetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink-900">领养申请管理</h1>
          <p className="mt-1 text-sm text-ink-700">审核领养申请并跟踪状态</p>
        </div>
        <button onClick={fetch} className="btn-ghost"><RefreshCw size={14} /> 刷新</button>
      </div>

      <div className="flex gap-1 border-b border-warm-100 overflow-x-auto">
        {STATUS_TABS.map(t => (
          <button
            key={t.v}
            onClick={() => setStatus(t.v)}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              status === t.v ? 'border-coral-400 text-coral-500' : 'border-transparent text-ink-700 hover:text-ink-900'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <PageLoading /> : list.length === 0 ? (
        <EmptyState title="暂无符合条件的申请" />
      ) : (
        <div className="space-y-3">
          {list.map(a => (
            <div key={a.id} className="card p-4 md:p-5">
              <div className="flex flex-wrap items-start gap-4">
                {/* 宠物图 */}
                {a.pet?.images?.[0] ? (
                  <img src={a.pet.images[0]} alt={a.pet.title} className="h-16 w-16 rounded-xl object-cover flex-none" />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-warm-100 flex items-center justify-center flex-none">
                    <HeartHandshake size={20} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-medium text-ink-900">
                        <span className="text-ink-500">申请人：</span>
                        {a.applicant?.nickname || '未知'} 
                        <span className="ml-1 text-xs text-ink-500">@{a.applicant?.username}</span>
                      </p>
                      <p className="text-sm text-ink-700 mt-0.5">
                        申请领养：<span className="text-coral-500">{a.pet?.title || '已删除'}</span>
                      </p>
                    </div>
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
                  <p className="mt-2 text-xs text-ink-500">申请于 {formatDateTime(a.createdAt)}</p>
                  <p className="mt-2 text-sm text-ink-700 line-clamp-2">{a.reason}</p>
                  {a.contact && (
                    <p className="mt-1 text-xs text-ink-500">联系方式：{a.contact}</p>
                  )}
                </div>

                <div className="flex gap-2 flex-none">
                  <button onClick={() => { setDetail(a); setReviewNote(a.reviewNote || ''); }} className="btn-ghost">
                    详情
                  </button>
                  {a.status === 'pending' && (
                    <>
                      <button onClick={() => onUpdateStatus(a.id, 'approved', reviewNote)} className="btn-ghost text-sage-600">
                        <Check size={14} /> 通过
                      </button>
                      <button onClick={() => onUpdateStatus(a.id, 'rejected', '驳回')} className="btn-ghost text-coral-500">
                        <X size={14} /> 驳回
                      </button>
                    </>
                  )}
                  {a.status === 'approved' && (
                    <button onClick={() => onUpdateStatus(a.id, 'completed', '完成领养')} className="btn-primary text-xs">
                      <Check size={14} /> 完成领养
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 详情弹层 */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="领养申请详情"
        size="lg"
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="申请人" value={detail.applicant?.nickname} />
              <Field label="联系方式" value={detail.contact} />
              <Field label="宠物" value={detail.pet?.title} />
              <Field label="品种" value={detail.pet?.breed} />
              <Field label="状态" value={ADOPTION_STATUS_LABELS[detail.status]} />
              <Field label="申请时间" value={formatDateTime(detail.createdAt)} />
            </div>
            <div>
              <p className="text-xs font-mono uppercase text-ink-500 mb-1">申请说明</p>
              <p className="text-sm text-ink-900 whitespace-pre-wrap">{detail.reason}</p>
            </div>
            {detail.experience && (
              <div>
                <p className="text-xs font-mono uppercase text-ink-500 mb-1">养宠经验</p>
                <p className="text-sm text-ink-900">{detail.experience}</p>
              </div>
            )}
            {detail.reviewNote && (
              <div>
                <p className="text-xs font-mono uppercase text-ink-500 mb-1">审核备注</p>
                <p className="text-sm text-ink-900">{detail.reviewNote}</p>
              </div>
            )}

            {/* 回访记录 */}
            <div>
              <p className="text-xs font-mono uppercase text-ink-500 mb-2">回访记录（{detail.followups.length}）</p>
              {detail.followups.length > 0 ? (
                <div className="space-y-2">
                  {detail.followups.map(f => (
                    <div key={f.id} className="rounded-xl bg-warm-100 p-3 text-sm">
                      <p className="text-ink-900">{f.content}</p>
                      <p className="mt-1 text-xs text-ink-500">{formatDateTime(f.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-500">暂无回访记录</p>
              )}
            </div>

            {/* 操作区 */}
            {detail.status === 'pending' && (
              <div className="rounded-2xl bg-warm-100 p-4 space-y-3">
                <p className="text-sm font-medium">审核操作</p>
                <textarea
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  rows={2}
                  placeholder="审核备注（驳回时建议填写原因）"
                  className="input-base resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={() => onUpdateStatus(detail.id, 'approved', reviewNote)} className="btn-primary flex-1">
                    <Check size={14} /> 通过
                  </button>
                  <button onClick={() => onUpdateStatus(detail.id, 'rejected', reviewNote)} className="btn-danger flex-1">
                    <X size={14} /> 驳回
                  </button>
                </div>
              </div>
            )}

            {detail.status === 'approved' && (
              <button onClick={() => onUpdateStatus(detail.id, 'completed', '完成领养')} className="btn-primary w-full">
                <Check size={14} /> 标记为完成领养
              </button>
            )}

            {(detail.status === 'completed') && (
              <AddFollowupForm onSubmit={(content) => onAddFollowup(detail.id, content)} />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-mono uppercase text-ink-500">{label}</p>
      <p className="text-ink-900">{value || '—'}</p>
    </div>
  );
}

function AddFollowupForm({ onSubmit }: { onSubmit: (content: string) => void }) {
  const [content, setContent] = useState('');
  return (
    <div className="rounded-2xl bg-warm-100 p-4 space-y-3">
      <p className="text-sm font-medium flex items-center gap-1"><MessageSquarePlus size={14} /> 添加回访记录</p>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={2}
        placeholder="本次回访情况..."
        className="input-base resize-none"
      />
      <button
        onClick={() => { if (content.trim()) { onSubmit(content.trim()); setContent(''); } }}
        disabled={!content.trim()}
        className="btn-primary w-full"
      >
        添加回访
      </button>
    </div>
  );
}
