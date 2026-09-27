import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { PawPrint, Mail, Lock, User as UserIcon, Phone, Building2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import type { UserRole } from '../../shared/types';

export default function Login() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, user } = useAuthStore();
  const initialMode = params.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState<'login' | 'register'>(initialMode as 'login' | 'register');
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: '', password: '', nickname: '', email: '', phone: '',
  });

  const redirect = params.get('redirect') || '/';

  useEffect(() => {
    if (user) navigate(redirect, { replace: true });
  }, [user, navigate, redirect]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login({ username: form.username, password: form.password });
        toast.success('登录成功');
      } else {
        if (!form.nickname || !form.email) {
          toast.warning('请填写完整信息');
          setLoading(false);
          return;
        }
        await register({
          username: form.username,
          password: form.password,
          nickname: form.nickname,
          email: form.email,
          phone: form.phone || undefined,
          role,
        });
        toast.success('注册成功，已自动登录');
      }
      navigate(redirect, { replace: true });
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const set = (k: keyof typeof form, v: string) => setForm(s => ({ ...s, [k]: v }));

  return (
    <div className="container py-8 md:py-16">
      <div className="grid lg:grid-cols-2 gap-10 max-w-5xl mx-auto overflow-hidden rounded-4xl shadow-card bg-cream-50 border border-warm-100">
        {/* 左：品牌区 */}
        <div className="relative hidden lg:block bg-ink-900 text-cream-50 p-10">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-coral-400/20 blur-3xl" />
          <div className="relative h-full flex flex-col">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-coral-400">
                <PawPrint size={18} />
              </div>
              <span className="font-serif text-xl font-bold">暖窝</span>
            </Link>

            <div className="mt-12">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-coral-400">warmnest</p>
              <h2 className="mt-3 font-serif text-4xl font-bold leading-tight">
                每一次领养，<br />都是一次重逢。
              </h2>
              <p className="mt-4 text-sm text-cream-50/70 leading-relaxed max-w-xs">
                登录或注册暖窝，开始你的领养旅程。让等待的灵魂，遇见愿意陪伴它一生的你。
              </p>
            </div>

            <div className="mt-auto space-y-3">
              <div className="flex items-center gap-3 text-sm text-cream-50/80">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cream-50/10">1</div>
                浏览心仪的毛孩子
              </div>
              <div className="flex items-center gap-3 text-sm text-cream-50/80">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cream-50/10">2</div>
                在线提交领养申请
              </div>
              <div className="flex items-center gap-3 text-sm text-cream-50/80">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cream-50/10">3</div>
                审核通过，迎接回家
              </div>
            </div>
          </div>
        </div>

        {/* 右：表单 */}
        <div className="p-8 md:p-10">
          <div className="flex rounded-full bg-warm-100 p-1 mb-8">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${mode === 'login' ? 'bg-cream-50 text-ink-900 shadow-soft' : 'text-ink-700'}`}
            >
              登录
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${mode === 'register' ? 'bg-cream-50 text-ink-900 shadow-soft' : 'text-ink-700'}`}
            >
              注册
            </button>
          </div>

          <h1 className="font-serif text-3xl font-bold text-ink-900 mb-2">
            {mode === 'login' ? '欢迎回来' : '加入暖窝'}
          </h1>
          <p className="text-sm text-ink-500 mb-8">
            {mode === 'login' ? '用你的账号继续陪伴之旅' : '注册一个账号，开启领养旅程'}
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <Field icon={<UserIcon size={14} />} label="用户名">
              <input
                type="text"
                value={form.username}
                onChange={e => set('username', e.target.value)}
                placeholder="3-20 个字符"
                required
                minLength={3}
                maxLength={20}
                className="input-base pl-9"
              />
            </Field>

            {mode === 'register' && (
              <>
                <Field icon={<UserIcon size={14} />} label="昵称">
                  <input
                    type="text"
                    value={form.nickname}
                    onChange={e => set('nickname', e.target.value)}
                    placeholder="页面显示名称"
                    required
                    className="input-base pl-9"
                  />
                </Field>
                <Field icon={<Mail size={14} />} label="邮箱">
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="用于通知与找回密码"
                    required
                    className="input-base pl-9"
                  />
                </Field>
                <Field icon={<Phone size={14} />} label="手机号（选填）">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="便于审核通过后联系"
                    className="input-base pl-9"
                  />
                </Field>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-ink-500 mb-2">注册身份</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { v: 'user', label: '领养者', desc: '想给毛孩子一个家', icon: UserIcon },
                      { v: 'org', label: '救助机构', desc: '发布与管理领养信息', icon: Building2 },
                    ].map(opt => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setRole(opt.v as UserRole)}
                        className={`rounded-2xl border p-4 text-left transition-all ${
                          role === opt.v
                            ? 'border-coral-400 bg-coral-400/5 shadow-soft'
                            : 'border-warm-200 hover:border-warm-200 hover:bg-warm-100/50'
                        }`}
                      >
                        <opt.icon size={20} className={role === opt.v ? 'text-coral-400' : 'text-ink-500'} />
                        <p className={`mt-2 font-medium ${role === opt.v ? 'text-coral-500' : 'text-ink-900'}`}>{opt.label}</p>
                        <p className="text-xs text-ink-500 mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Field icon={<Lock size={14} />} label="密码">
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder={mode === 'login' ? '您的密码' : '至少 6 位'}
                  required
                  minLength={mode === 'register' ? 6 : undefined}
                  className="input-base pl-9 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-900"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </Field>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? '请稍候...' : mode === 'login' ? '登录' : '注册并登录'}
              <ArrowRight size={14} />
            </button>
          </form>

          <div className="mt-6 p-3 rounded-xl bg-warm-100/60 text-xs text-ink-700">
            <p className="font-medium mb-1">演示账号</p>
            <p>管理员：<code className="font-mono">admin / admin123</code></p>
            <p>救助机构：<code className="font-mono">org1 / org123</code></p>
            <p>领养者：<code className="font-mono">user1 / user123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-wider text-ink-500 mb-2">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500">{icon}</span>
        {children}
      </div>
    </div>
  );
}
