import { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw, Shield, UserCheck, UserX, Edit3, Mail } from 'lucide-react';
import type { User, UserRole, UserStatus } from '../../../shared/types';
import { get, put, asArray } from '@/utils/api';
import { toast } from '@/store/toast';
import Modal from '@/components/Modal';
import { PageLoading } from '@/components/Loading';
import EmptyState from '@/components/Empty';
import { ROLE_LABELS, formatDateTime } from '@/utils/format';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

const ROLE_TABS: { v: UserRole | 'all'; label: string }[] = [
  { v: 'all', label: '全部角色' },
  { v: 'user', label: '领养者' },
  { v: 'org', label: '救助机构' },
  { v: 'admin', label: '管理员' },
];

const STATUS_TABS: { v: UserStatus | 'all'; label: string }[] = [
  { v: 'all', label: '全部状态' },
  { v: 'active', label: '正常' },
  { v: 'disabled', label: '已禁用' },
];

interface EditForm {
  nickname: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
}

export default function AdminUsers() {
  const me = useAuthStore(s => s.user);
  const [list, setList] = useState<User[]>([]);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [role, setRole] = useState<UserRole | 'all'>('all');
  const [status, setStatus] = useState<UserStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<EditForm>({ nickname: '', email: '', phone: '', role: 'user', status: 'active' });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (keyword) params.keyword = keyword;
      if (role !== 'all') params.role = role;
      if (status !== 'all') params.status = status;
      const data = await get<User[]>('/admin/users', params);
      setList(asArray(data));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [keyword, role, status]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput.trim());
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({
      nickname: u.nickname,
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      status: u.status,
    });
  };

  const onSave = async () => {
    if (!editing) return;
    try {
      await put(`/admin/users/${editing.id}`, form);
      toast.success('用户信息已更新');
      setEditing(null);
      fetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const onToggleStatus = async (u: User) => {
    const next: UserStatus = u.status === 'active' ? 'disabled' : 'active';
    try {
      await put(`/admin/users/${u.id}`, { status: next });
      toast.success(next === 'active' ? '已启用' : '已禁用');
      fetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink-900">用户管理</h1>
          <p className="mt-1 text-sm text-ink-700">管理平台注册用户、角色与状态</p>
        </div>
        <button onClick={fetch} className="btn-ghost"><RefreshCw size={14} /> 刷新</button>
      </div>

      {/* 搜索 */}
      <form onSubmit={onSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="搜索用户名、昵称或邮箱"
            className="input-base pl-9"
          />
        </div>
        <button type="submit" className="btn-primary">搜索</button>
        {keyword && (
          <button
            type="button"
            onClick={() => { setSearchInput(''); setKeyword(''); }}
            className="btn-ghost"
          >清除</button>
        )}
      </form>

      {/* 筛选 */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-1 border-b border-warm-100 overflow-x-auto">
          {ROLE_TABS.map(t => (
            <button
              key={t.v}
              onClick={() => setRole(t.v)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                role === t.v ? 'border-coral-400 text-coral-500' : 'border-transparent text-ink-700 hover:text-ink-900'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 border-b border-warm-100 overflow-x-auto">
          {STATUS_TABS.map(t => (
            <button
              key={t.v}
              onClick={() => setStatus(t.v)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                status === t.v ? 'border-coral-400 text-coral-500' : 'border-transparent text-ink-700 hover:text-ink-900'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <PageLoading /> : list.length === 0 ? (
        <EmptyState title="暂无符合条件的用户" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-warm-100/60 text-xs font-mono uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-4 py-3 text-left">用户</th>
                  <th className="px-4 py-3 text-left">联系方式</th>
                  <th className="px-4 py-3 text-left">角色</th>
                  <th className="px-4 py-3 text-left">状态</th>
                  <th className="px-4 py-3 text-left">注册时间</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {list.map(u => (
                  <tr key={u.id} className="hover:bg-warm-100/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.nickname} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-warm-200 flex items-center justify-center text-ink-700 font-mono uppercase">
                            {u.nickname.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-ink-900">{u.nickname}</p>
                          <p className="text-xs text-ink-500">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-700">
                      <p className="text-xs">{u.email}</p>
                      {u.phone && <p className="text-xs text-ink-500">{u.phone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'badge',
                        u.role === 'admin' ? 'bg-coral-400/15 text-coral-500' :
                        u.role === 'org' ? 'bg-amber-gold/15 text-amber-gold' : 'bg-sage-500/15 text-sage-600'
                      )}>
                        <Shield size={10} /> {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'badge',
                        u.status === 'active' ? 'bg-sage-500/15 text-sage-600' : 'bg-ink-700/10 text-ink-700'
                      )}>
                        {u.status === 'active' ? <UserCheck size={10} /> : <UserX size={10} />}
                        {u.status === 'active' ? '正常' : '已禁用'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-500 font-mono">{formatDateTime(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(u)}
                          className="btn-ghost px-2 py-1"
                          title="编辑"
                          disabled={me?.id === u.id}
                        >
                          <Edit3 size={14} />
                        </button>
                        {me?.id !== u.id && (
                          <button
                            onClick={() => onToggleStatus(u)}
                            className={cn(
                              'btn-ghost px-2 py-1',
                              u.status === 'active' ? 'text-coral-500' : 'text-sage-600'
                            )}
                            title={u.status === 'active' ? '禁用' : '启用'}
                          >
                            {u.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
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

      {/* 编辑弹层 */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="编辑用户"
        size="md"
        footer={
          <>
            <button onClick={() => setEditing(null)} className="btn-ghost">取消</button>
            <button onClick={onSave} className="btn-primary">保存</button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-warm-100 p-3 text-sm">
              <p className="text-xs text-ink-500">用户名（不可修改）</p>
              <p className="text-ink-900 font-mono">@{editing.username}</p>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-ink-500 mb-1">昵称</label>
              <input
                type="text"
                value={form.nickname}
                onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-ink-500 mb-1">邮箱</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-ink-500 mb-1">手机</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="input-base"
                placeholder="选填"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase text-ink-500 mb-1">角色</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
                  className="input-base"
                  disabled={me?.id === editing.id}
                >
                  <option value="user">领养者</option>
                  <option value="org">救助机构</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-ink-500 mb-1">状态</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as UserStatus }))}
                  className="input-base"
                  disabled={me?.id === editing.id}
                >
                  <option value="active">正常</option>
                  <option value="disabled">已禁用</option>
                </select>
              </div>
            </div>
            {me?.id === editing.id && (
              <p className="text-xs text-amber-gold flex items-center gap-1">
                <Mail size={11} /> 不能修改自己的角色与状态
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
