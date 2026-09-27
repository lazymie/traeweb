import { useEffect, useState } from 'react';
import { RefreshCw, PawPrint, Users, HeartHandshake, TrendingUp, BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { AdminStats, PetStatus, AdoptionStatus } from '../../../shared/types';
import { get, asArray } from '@/utils/api';
import { toast } from '@/store/toast';
import { PageLoading } from '@/components/Loading';
import { CATEGORY_LABELS, PET_STATUS_LABELS, ADOPTION_STATUS_LABELS } from '@/utils/format';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  dog: '#E8623A',
  cat: '#7BA88F',
  other: '#D8B647',
};

const PET_STATUS_COLORS: Record<PetStatus, string> = {
  pending: '#D8B647',
  available: '#7BA88F',
  adopted: '#4A7C59',
  rejected: '#E8623A',
  offline: '#A89F8A',
};

const ADOPTION_STATUS_COLORS: Record<AdoptionStatus, string> = {
  pending: '#D8B647',
  approved: '#7BA88F',
  completed: '#4A7C59',
  rejected: '#E8623A',
  cancelled: '#A89F8A',
};

interface ExtendedStats extends AdminStats {
  petStatusBreakdown: { status: PetStatus; count: number }[];
  adoptionStatusBreakdown: { status: AdoptionStatus; count: number }[];
}

export default function AdminStats() {
  const [stats, setStats] = useState<ExtendedStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const data = await get<AdminStats>('/admin/stats');
      // 由后端 petsByCategory / applicationsTrend 等组合展示
      // 此处补充客户端可推算的细分
      const petStatusBreakdown: { status: PetStatus; count: number }[] = [
        { status: 'pending', count: data.pendingPets },
        { status: 'available', count: data.availablePets },
        { status: 'adopted', count: data.adoptedPets },
        { status: 'rejected', count: 0 },
        { status: 'offline', count: 0 },
      ];
      const adoptionStatusBreakdown: { status: AdoptionStatus; count: number }[] = [
        { status: 'pending', count: data.pendingApplications },
        { status: 'approved', count: 0 },
        { status: 'completed', count: data.completedAdoptions },
        { status: 'rejected', count: 0 },
        { status: 'cancelled', count: 0 },
      ];
      setStats({
        ...data,
        petsByCategory: asArray(data?.petsByCategory),
        applicationsTrend: asArray(data?.applicationsTrend),
        petStatusBreakdown,
        adoptionStatusBreakdown,
      });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  if (loading || !stats) return <PageLoading />;

  const SUMMARY_CARDS = [
    { label: '总宠物', value: stats.totalPets, icon: PawPrint, color: 'bg-coral-400' },
    { label: '总用户', value: stats.totalUsers, icon: Users, color: 'bg-ink-700' },
    { label: '总申请', value: stats.totalApplications, icon: HeartHandshake, color: 'bg-coral-500' },
    { label: '领养率', value: stats.adoptionRate + '%', icon: TrendingUp, color: 'bg-sage-500' },
  ];

  const petStatusData = stats.petStatusBreakdown
    .filter(d => d.count > 0)
    .map(d => ({ name: PET_STATUS_LABELS[d.status], value: d.count, status: d.status }));

  const adoptionStatusData = stats.adoptionStatusBreakdown
    .filter(d => d.count > 0)
    .map(d => ({ name: ADOPTION_STATUS_LABELS[d.status], value: d.count, status: d.status }));

  const categoryData = stats.petsByCategory.map(c => ({
    name: CATEGORY_LABELS[c.category] || c.category,
    value: c.count,
    category: c.category,
  }));

  const trendData = stats.applicationsTrend.map(t => ({
    date: t.date.slice(5), // MM-DD
    count: t.count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink-900">数据统计</h1>
          <p className="mt-1 text-sm text-ink-700">平台运营数据概览与趋势分析</p>
        </div>
        <button onClick={fetch} className="btn-ghost"><RefreshCw size={14} /> 刷新</button>
      </div>

      {/* 汇总卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {SUMMARY_CARDS.map(c => (
          <div key={c.label} className="card p-5">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', c.color, 'text-cream-50')}>
              <c.icon size={18} />
            </div>
            <p className="mt-3 font-serif text-3xl font-bold text-ink-900">{c.value}</p>
            <p className="text-xs text-ink-500">{c.label}</p>
          </div>
        ))}
      </div>

      {/* 趋势图 */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
            <BarChart3 size={18} className="text-coral-400" /> 近30天领养申请趋势
          </h2>
          <span className="text-xs text-ink-500 font-mono">共 {stats.totalApplications} 条申请</span>
        </div>
        {trendData.length === 0 ? (
          <p className="text-sm text-ink-500 py-10 text-center">暂无数据</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E1D0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#7A7361' }}
                tickLine={false}
                axisLine={{ stroke: '#D8D0BE' }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#7A7361' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#FBF7F0',
                  border: '1px solid #D8D0BE',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#2B2A28', fontWeight: 600 }}
              />
              <Line
                type="monotone"
                dataKey="count"
                name="申请数"
                stroke="#E8623A"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#E8623A' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 饼图区 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 宠物种类分布 */}
        <div className="card p-6">
          <h2 className="font-serif text-lg font-semibold mb-4">宠物种类分布</h2>
          {categoryData.length === 0 ? (
            <p className="text-sm text-ink-500 py-16 text-center">暂无数据</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={2}
                >
                  {categoryData.map((d) => (
                    <Cell key={d.category} fill={CATEGORY_COLORS[d.category] || '#A89F8A'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#FBF7F0',
                    border: '1px solid #D8D0BE',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 宠物状态分布 */}
        <div className="card p-6">
          <h2 className="font-serif text-lg font-semibold mb-4">宠物状态分布</h2>
          {petStatusData.length === 0 ? (
            <p className="text-sm text-ink-500 py-16 text-center">暂无数据</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={petStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={2}
                >
                  {petStatusData.map((d) => (
                    <Cell key={d.status} fill={PET_STATUS_COLORS[d.status as PetStatus]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#FBF7F0',
                    border: '1px solid #D8D0BE',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 领养申请状态 */}
      <div className="card p-6">
        <h2 className="font-serif text-lg font-semibold mb-4">领养申请状态分布</h2>
        {adoptionStatusData.length === 0 ? (
          <p className="text-sm text-ink-500 py-16 text-center">暂无数据</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={adoptionStatusData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E1D0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#7A7361' }}
                tickLine={false}
                axisLine={{ stroke: '#D8D0BE' }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#7A7361' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#FBF7F0',
                  border: '1px solid #D8D0BE',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                cursor={{ fill: 'rgba(232, 98, 58, 0.06)' }}
              />
              <Bar dataKey="value" name="数量" radius={[8, 8, 0, 0]}>
                {adoptionStatusData.map((d) => (
                  <Cell key={d.status} fill={ADOPTION_STATUS_COLORS[d.status as AdoptionStatus]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 明细 */}
      <div className="card p-6">
        <h2 className="font-serif text-lg font-semibold mb-4">关键指标明细</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric label="可领养宠物" value={stats.availablePets} accent="text-sage-600" />
          <Metric label="待审核宠物" value={stats.pendingPets} accent="text-amber-gold" />
          <Metric label="已领养宠物" value={stats.adoptedPets} accent="text-sage-600" />
          <Metric label="待审申请" value={stats.pendingApplications} accent="text-amber-gold" />
          <Metric label="已完成领养" value={stats.completedAdoptions} accent="text-sage-600" />
          <Metric label="领养成功率" value={stats.adoptionRate + '%'} accent="text-coral-400" />
          <Metric label="平均每用户申请" value={stats.totalUsers > 0 ? (stats.totalApplications / stats.totalUsers).toFixed(2) : '0'} accent="text-ink-900" />
          <Metric label="宠物上架率" value={stats.totalPets > 0 ? Math.round(stats.availablePets / stats.totalPets * 100) + '%' : '0'} accent="text-sage-600" />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div className="rounded-2xl bg-warm-100 p-4">
      <p className={cn('font-serif text-2xl font-bold', accent)}>{value}</p>
      <p className="text-xs text-ink-500 mt-1">{label}</p>
    </div>
  );
}
