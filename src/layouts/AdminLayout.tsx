import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PawPrint, LayoutDashboard, PawPrint as Paw, HeartHandshake, Users, Bell, BarChart3, LogOut, Menu, X, Home } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/admin', label: '概览', icon: LayoutDashboard, end: true },
  { to: '/admin/pets', label: '宠物审核', icon: Paw },
  { to: '/admin/adoptions', label: '领养管理', icon: HeartHandshake },
  { to: '/admin/users', label: '用户管理', icon: Users },
  { to: '/admin/announcements', label: '公告管理', icon: Bell },
  { to: '/admin/stats', label: '数据统计', icon: BarChart3 },
];

export default function AdminLayout() {
  const { user, logout, initialized } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (initialized && (!user || user.role !== 'admin')) {
      toast.error('需要管理员权限');
      navigate('/login?redirect=/admin');
    }
  }, [user, initialized, navigate]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  const handleLogout = () => {
    logout();
    toast.info('已退出登录');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-cream-50">
      {/* 顶部栏（移动端） */}
      <header className="lg:hidden sticky top-0 z-30 bg-cream-50 border-b border-warm-100 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-coral-400 text-cream-50">
            <PawPrint size={14} />
          </div>
          <span className="font-serif font-bold">暖窝后台</span>
        </div>
        <button onClick={() => setOpen(v => !v)} className="p-2 text-ink-700">
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      <div className="flex">
        {/* 侧栏 */}
        <aside
          className={cn(
            'fixed lg:sticky top-0 lg:top-0 left-0 z-40 h-screen w-60 flex-none bg-ink-900 text-cream-50 transition-transform lg:translate-x-0',
            open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          <div className="flex h-full flex-col">
            <div className="px-6 py-5 border-b border-ink-900/40">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-coral-400">
                  <PawPrint size={16} />
                </div>
                <div>
                  <p className="font-serif text-lg font-bold leading-none">暖窝</p>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-cream-50/60 mt-1">admin console</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {NAV.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-coral-400 text-cream-50 shadow-soft'
                      : 'text-cream-50/80 hover:bg-ink-700 hover:text-cream-50'
                  )}
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              ))}
              <div className="my-3 border-t border-cream-50/10" />
              <NavLink to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream-50/80 hover:bg-ink-700">
                <Home size={16} /> 回到前台
              </NavLink>
            </nav>

            <div className="border-t border-ink-900/40 p-4">
              <div className="flex items-center gap-3">
                {user.avatar && (
                  <img src={user.avatar} alt={user.nickname} className="h-9 w-9 rounded-full object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.nickname}</p>
                  <p className="text-xs text-cream-50/60 truncate">{user.email}</p>
                </div>
                <button onClick={handleLogout} className="text-cream-50/80 hover:text-cream-50" aria-label="退出">
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* 遮罩 */}
        {open && (
          <div onClick={() => setOpen(false)} className="lg:hidden fixed inset-0 bg-ink-900/40 z-30" />
        )}

        {/* 内容 */}
        <main className="flex-1 min-w-0 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
