import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PawPrint, Users, HeartHandshake, CheckCircle2, TrendingUp, AlertCircle, ArrowRight, PawPrint as Paw } from 'lucide-react';
import type { AdminStats } from '../../../shared/types';
import { get } from '@/utils/api';
import { PageLoading } from '@/components/Loading';
import { ROLE_LABELS, relativeTime, formatDateTime, PET_STATUS_LABELS, ADOPTION_STATUS_LABELS } from '@/utils/format';
import type { Pet, Adoption, User } from '../../../shared/types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingPets, setPendingPets] = useState<(Pet & { publisher?: User })[]>([]);
  const [pendingAdoptions, setPendingAdoptions] = useState<(Adoption & { pet?: Pet; applicant?: User })[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [s, pets, adoptions] = await Promise.all([
          get<AdminStats>('/admin/stats'),
          get<(Pet & { publisher?: User })[]>('/admin/pets', { status: 'pending' }),
          get<(Adoption & { pet?: Pet; applicant?: User })[]>('/admin/adoptions', { status: 'pending' }),
        ]);
        setStats(s);
        setPendingPets(pets);
        setPendingAdoptions(adoptions);
      } catch (e) {}
    })();
  }, []);

  if (!stats) return <PageLoading />;

  const CARDS = [
    { label: '总宠物数', value: stats.totalPets, icon: Paw, color: 'bg-coral-400' },
    { label: '可领养', value: stats.availablePets, icon: PawPrint, color: 'bg-sage-500' },
    { label: '待审核', value: stats.pendingPets, icon: AlertCircle, color: 'bg-amber-gold' },
    { label: '已领养', value: stats.adoptedPets, icon: CheckCircle2, color: 'bg-sage-600' },
    { label: '总用户', value: stats.totalUsers, icon: Users, color: 'bg-ink-700' },
    { label: '总申请', value: stats.totalApplications, icon: HeartHandshake, color: 'bg-coral-500' },
    { label: '待审申请', value: stats.pendingApplications, icon: AlertCircle, color: 'bg-amber-gold' },
    { label: '领养率', value: stats.adoptionRate + '%', icon: TrendingUp, color: 'bg-sage-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink-900">平台概览</h1>
        <p className="mt-1 text-sm text-ink-700">欢迎回来，这是平台当前的运行情况</p>
      </div>

      {/* 数据卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {CARDS.map((c) => (
          <div key={c.label} className="card p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.color} text-cream-50`}>
              <c.icon size={18} />
            </div>
            <p className="mt-3 font-serif text-3xl font-bold text-ink-900">{c.value}</p>
            <p className="text-xs text-ink-500">{c.label}</p>
          </div>
        ))}
      </div>

      {/* 待办 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 待审核宠物 */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-gold" /> 待审核宠物
              <span className="badge bg-amber-gold/15 text-amber-gold">{pendingPets.length}</span>
            </h2>
            <Link to="/admin/pets" className="text-xs text-coral-400 hover:underline flex items-center gap-1">
              查看全部 <ArrowRight size={11} />
            </Link>
          </div>
          {pendingPets.length === 0 ? (
            <p className="text-sm text-ink-500 py-6 text-center">暂无待审核宠物</p>
          ) : (
            <div className="space-y-3">
              {pendingPets.slice(0, 5).map(p => (
                <Link key={p.id} to={`/pets/${p.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-warm-100 transition-colors">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.title} className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-warm-100 flex items-center justify-center">
                      <PawPrint size={16} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{p.title}</p>
                    <p className="text-xs text-ink-500 truncate">{p.breed} · by {p.publisher?.nickname || '未知'}</p>
                  </div>
                  <span className="text-xs text-ink-500 font-mono">{relativeTime(p.createdAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 待审核申请 */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
              <HeartHandshake size={18} className="text-coral-400" /> 待审核领养申请
              <span className="badge bg-coral-400/15 text-coral-500">{pendingAdoptions.length}</span>
            </h2>
            <Link to="/admin/adoptions" className="text-xs text-coral-400 hover:underline flex items-center gap-1">
              查看全部 <ArrowRight size={11} />
            </Link>
          </div>
          {pendingAdoptions.length === 0 ? (
            <p className="text-sm text-ink-500 py-6 text-center">暂无待审核申请</p>
          ) : (
            <div className="space-y-3">
              {pendingAdoptions.slice(0, 5).map(a => (
                <Link key={a.id} to={`/admin/adoptions`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-warm-100 transition-colors">
                  {a.pet?.images?.[0] ? (
                    <img src={a.pet.images[0]} alt={a.pet.title} className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-warm-100 flex items-center justify-center">
                      <PawPrint size={16} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">
                      {a.applicant?.nickname || '未知用户'} → {a.pet?.title || '已删除'}
                    </p>
                    <p className="text-xs text-ink-500 truncate">{a.reason}</p>
                  </div>
                  <span className="text-xs text-ink-500 font-mono">{relativeTime(a.createdAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
