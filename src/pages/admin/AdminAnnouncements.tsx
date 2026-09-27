import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Plus, Pin, PinOff, Edit3, Trash2, Eye, Megaphone, Power } from 'lucide-react';
import type { Announcement, AnnouncementStatus } from '../../../shared/types';
import { get, post, put, del, asArray } from '@/utils/api';
import { toast } from '@/store/toast';
import Modal from '@/components/Modal';
import { PageLoading } from '@/components/Loading';
import EmptyState from '@/components/Empty';
import { formatDateTime } from '@/utils/format';
import { cn } from '@/lib/utils';

const STATUS_TABS: { v: AnnouncementStatus | 'all'; label: string }[] = [
  { v: 'all', label: '全部' },
  { v: 'published', label: '已发布' },
  { v: 'offline', label: '已下架' },
];

interface FormState {
  title: string;
  content: string;
  excerpt: string;
  pinned: boolean;
  status: AnnouncementStatus;
}

const EMPTY_FORM: FormState = {
  title: '',
  content: '',
  excerpt: '',
  pinned: false,
  status: 'published',
};

export default function AdminAnnouncements() {
  const [list, setList] = useState<Announcement[]>([]);
  const [status, setStatus] = useState<AnnouncementStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<Announcement | null>(null);
  const [preview, setPreview] = useState<Announcement | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await get<Announcement[]>('/announcements/admin/all');
      setList(asArray(data));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const filtered = status === 'all' ? list : list.filter(a => a.status === status);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({
      title: a.title,
      content: a.content,
      excerpt: a.excerpt,
      pinned: a.pinned,
      status: a.status,
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const onSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('标题和内容为必填');
      return;
    }
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      excerpt: form.excerpt.trim() || form.content.trim().slice(0, 80),
      pinned: form.pinned,
      status: form.status,
    };
    try {
      if (editing) {
        await put(`/announcements/${editing.id}`, payload);
        toast.success('公告已更新');
      } else {
        await post('/announcements', payload);
        toast.success('公告已发布');
      }
      closeForm();
      fetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const onToggleStatus = async (a: Announcement) => {
    const next: AnnouncementStatus = a.status === 'published' ? 'offline' : 'published';
    try {
      await put(`/announcements/${a.id}`, { status: next });
      toast.success(next === 'published' ? '已发布' : '已下架');
      fetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const onTogglePinned = async (a: Announcement) => {
    try {
      await put(`/announcements/${a.id}`, { pinned: !a.pinned });
      toast.success(!a.pinned ? '已置顶' : '已取消置顶');
      fetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const onDelete = async () => {
    if (!confirmDelete) return;
    try {
      await del(`/announcements/${confirmDelete.id}`);
      toast.success('公告已删除');
      setConfirmDelete(null);
      fetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink-900">公告管理</h1>
          <p className="mt-1 text-sm text-ink-700">发布、编辑与维护平台公告</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetch} className="btn-ghost"><RefreshCw size={14} /> 刷新</button>
          <button onClick={openCreate} className="btn-primary"><Plus size={14} /> 新建公告</button>
        </div>
      </div>

      {/* 状态筛选 */}
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
            <span className="ml-1 text-xs font-mono text-ink-500">
              {t.v === 'all' ? list.length : list.filter(a => a.status === t.v).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? <PageLoading /> : filtered.length === 0 ? (
        <EmptyState
          title="暂无公告"
          description="点击右上角“新建公告”发布第一条公告"
          action={<button onClick={openCreate} className="btn-primary"><Plus size={14} /> 新建公告</button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <div key={a.id} className="card p-4 md:p-5">
              <div className="flex items-start gap-4">
                <div className="flex-none">
                  {a.pinned ? (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-gold/15 text-amber-gold">
                      <Megaphone size={16} />
                    </span>
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-coral-400/15 text-coral-400">
                      <Megaphone size={16} />
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    {a.pinned && <span className="badge bg-amber-gold/15 text-amber-gold"><Pin size={10} /> 置顶</span>}
                    <h3 className="font-serif text-lg font-semibold text-ink-900 truncate">{a.title}</h3>
                    <span className={cn(
                      'badge',
                      a.status === 'published' ? 'bg-sage-500/15 text-sage-600' : 'bg-ink-700/10 text-ink-700'
                    )}>
                      {a.status === 'published' ? '已发布' : '已下架'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-700 line-clamp-2">{a.excerpt || a.content}</p>
                  <p className="mt-2 text-xs text-ink-500 font-mono">{formatDateTime(a.createdAt)}</p>
                </div>
                <div className="flex gap-1 flex-none">
                  <button onClick={() => setPreview(a)} className="btn-ghost px-2 py-1" title="预览">
                    <Eye size={14} />
                  </button>
                  <button onClick={() => onTogglePinned(a)} className="btn-ghost px-2 py-1" title={a.pinned ? '取消置顶' : '置顶'}>
                    {a.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                  </button>
                  <button onClick={() => openEdit(a)} className="btn-ghost px-2 py-1" title="编辑">
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => onToggleStatus(a)}
                    className="btn-ghost px-2 py-1"
                    title={a.status === 'published' ? '下架' : '上架'}
                  >
                    <Power size={14} />
                  </button>
                  <button onClick={() => setConfirmDelete(a)} className="btn-ghost px-2 py-1 text-coral-500" title="删除">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新建/编辑弹层 */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? '编辑公告' : '新建公告'}
        size="lg"
        footer={
          <>
            <button onClick={closeForm} className="btn-ghost">取消</button>
            <button onClick={onSave} className="btn-primary">{editing ? '保存' : '发布'}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-ink-500 mb-1">标题 <span className="text-coral-500">*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="公告标题"
              className="input-base"
              maxLength={80}
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase text-ink-500 mb-1">摘要（选填，留空自动截取）</label>
            <input
              type="text"
              value={form.excerpt}
              onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
              placeholder="一句话简介"
              className="input-base"
              maxLength={120}
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase text-ink-500 mb-1">内容 <span className="text-coral-500">*</span></label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="公告正文"
              rows={8}
              className="input-base resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-ink-500 mb-1">状态</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as AnnouncementStatus }))}
                className="input-base"
              >
                <option value="published">已发布</option>
                <option value="offline">已下架</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer select-none pb-2.5">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))}
                  className="h-4 w-4 rounded border-warm-200 text-coral-400 focus:ring-coral-400"
                />
                <Pin size={14} /> 置顶
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {/* 预览弹层 */}
      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title="公告预览"
        size="lg"
      >
        {preview && (
          <div className="space-y-4">
            <div className="flex items-baseline gap-2 flex-wrap">
              {preview.pinned && <span className="badge bg-amber-gold/15 text-amber-gold"><Pin size={10} /> 置顶</span>}
              <h2 className="font-serif text-2xl font-bold text-ink-900">{preview.title}</h2>
            </div>
            <p className="text-xs text-ink-500 font-mono">{formatDateTime(preview.createdAt)}</p>
            <div className="rounded-2xl bg-warm-100 p-4">
              <p className="text-sm text-ink-900 leading-relaxed whitespace-pre-wrap">{preview.content}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* 删除确认 */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="删除确认"
        size="sm"
        footer={
          <>
            <button onClick={() => setConfirmDelete(null)} className="btn-ghost">取消</button>
            <button onClick={onDelete} className="btn-danger"><Trash2 size={14} /> 删除</button>
          </>
        }
      >
        <p className="text-sm text-ink-700">
          确定删除公告「<span className="font-medium text-ink-900">{confirmDelete?.title}</span>」吗？此操作不可恢复。
        </p>
      </Modal>
    </div>
  );
}
