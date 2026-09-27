import { Link } from 'react-router-dom';
import { PawPrint, Home, Users, FileText, Info, Heart, Bell, User as UserIcon, ChevronDown, LogOut, ShieldCheck, Plus } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { ROLE_LABELS } from '@/utils/format';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', label: '首页', icon: Home },
  { to: '/pets', label: '领养', icon: PawPrint },
  { to: '/announcements', label: '公告', icon: Bell },
  { to: '/about', label: '关于', icon: Info },
];

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-cream-50/85 backdrop-blur-md border-b border-warm-100">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-coral-400 text-cream-50 shadow-soft transition-transform group-hover:scale-105">
            <PawPrint size={18} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-serif text-xl font-bold text-ink-900">暖窝</span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-500">warm nest</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-ink-700 hover:bg-warm-100 hover:text-ink-900 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/publish" className="btn-outline text-xs">
                <Plus size={14} /> 发布领养
              </Link>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  onBlur={() => setTimeout(() => setMenuOpen(false), 200)}
                  className="flex items-center gap-2 rounded-full bg-warm-100 pl-1 pr-3 py-1 hover:bg-warm-200 transition-colors"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.nickname} className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-coral-400 text-cream-50">
                      <UserIcon size={14} />
                    </div>
                  )}
                  <span className="text-sm font-medium text-ink-900 max-w-[6rem] truncate">{user.nickname}</span>
                  <ChevronDown size={14} className={cn('text-ink-500 transition-transform', menuOpen && 'rotate-180')} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-cream-50 shadow-card border border-warm-100 overflow-hidden animate-fade-up">
                    <div className="px-4 py-3 border-b border-warm-100">
                      <p className="text-sm font-semibold text-ink-900 truncate">{user.nickname}</p>
                      <p className="text-xs text-ink-500 truncate">{user.email}</p>
                      <span className="mt-1 inline-flex badge bg-sage-500/15 text-sage-600">
                        {ROLE_LABELS[user.role]}
                      </span>
                    </div>
                    <Link to="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-700 hover:bg-warm-100">
                      <UserIcon size={14} /> 个人中心
                    </Link>
                    <Link to="/profile?tab=publish" className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-700 hover:bg-warm-100">
                      <FileText size={14} /> 我的发布
                    </Link>
                    <Link to="/profile?tab=applications" className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-700 hover:bg-warm-100">
                      <Heart size={14} /> 我的申请
                    </Link>
                    <Link to="/profile?tab=favorites" className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-700 hover:bg-warm-100">
                      <Heart size={14} /> 我的收藏
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-coral-500 font-medium hover:bg-warm-100">
                        <ShieldCheck size={14} /> 后台管理
                      </Link>
                    )}
                    <button
                      onClick={() => { logout(); setMenuOpen(false); }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink-700 hover:bg-warm-100 border-t border-warm-100"
                    >
                      <LogOut size={14} /> 退出登录
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login" className="btn-ghost">登录</Link>
              <Link to="/login?mode=register" className="btn-primary">注册</Link>
            </div>
          )}

          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden rounded-full p-2 text-ink-700 hover:bg-warm-100"
            aria-label="菜单"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-warm-100 bg-cream-50 animate-fade-in">
          <nav className="container py-3 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-warm-100"
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-700 hover:bg-warm-100">
                  <UserIcon size={16} /> {user.nickname}
                </Link>
                <Link to="/publish" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-700 hover:bg-warm-100">
                  <Plus size={16} /> 发布领养
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-coral-500 hover:bg-warm-100">
                    <ShieldCheck size={16} /> 后台管理
                  </Link>
                )}
                <button onClick={() => { logout(); setMobileOpen(false); }} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-700 hover:bg-warm-100">
                  <LogOut size={16} /> 退出登录
                </button>
              </>
            ) : (
              <div className="flex gap-2 px-3 py-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-outline flex-1">登录</Link>
                <Link to="/login?mode=register" onClick={() => setMobileOpen(false)} className="btn-primary flex-1">注册</Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
