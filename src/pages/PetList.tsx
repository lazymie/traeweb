import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, PawPrint } from 'lucide-react';
import type { Pet, PetQuery, PetCategory, PetGender } from '../../shared/types';
import { get } from '@/utils/api';
import PetCard from '@/components/PetCard';
import Pagination from '@/components/Pagination';
import EmptyState from '@/components/Empty';
import { PetCardSkeleton } from '@/components/Loading';
import { CATEGORY_LABELS, GENDER_LABELS } from '@/utils/format';
import { useAuthStore } from '@/store/auth';
import { post, del } from '@/utils/api';
import { toast } from '@/store/toast';
import { cn } from '@/lib/utils';

const CATEGORIES: PetCategory[] = ['dog', 'cat', 'other'];
const GENDERS: PetGender[] = ['male', 'female', 'unknown'];
const AGE_OPTIONS = [
  { label: '不限', min: undefined, max: undefined },
  { label: '幼年（≤1岁）', min: 0, max: 1 },
  { label: '青年（1-3岁）', min: 1, max: 3 },
  { label: '成年（3-7岁）', min: 3, max: 7 },
  { label: '老年（7岁+）', min: 7, max: undefined },
];

export default function PetList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pets, setPets] = useState<Pet[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const { user } = useAuthStore();
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  // 从 URL 读取筛选条件
  const query: PetQuery = {
    keyword: searchParams.get('keyword') || undefined,
    category: (searchParams.get('category') as PetCategory) || undefined,
    gender: (searchParams.get('gender') as PetGender) || undefined,
    ageMin: searchParams.get('ageMin') ? Number(searchParams.get('ageMin')) : undefined,
    ageMax: searchParams.get('ageMax') ? Number(searchParams.get('ageMax')) : undefined,
    location: searchParams.get('location') || undefined,
    sort: (searchParams.get('sort') as 'latest' | 'popular') || 'latest',
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    pageSize: 12,
  };

  // 同步用户收藏状态
  useEffect(() => {
    if (!user) return;
    // 通过 profile API 拿收藏列表（暂用 pets/mine 反推或直接调 favorite 接口）
    // 这里用最简单方式：列表数据中已带 favorited 字段（需要后端支持）
  }, [user]);

  const fetchPets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<{ list: Pet[]; total: number }>('/pets', query as Record<string, unknown>);
      setPets(res.list);
      setTotal(res.total);
    } catch (e: any) {
      toast.error(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === '') next.delete(key);
    else next.set(key, value);
    // 改变筛选条件时回到第一页
    if (key !== 'page' && key !== 'sort') next.delete('page');
    setSearchParams(next);
  };

  const onPageChange = (p: number) => updateParam('page', String(p));

  const onToggleFavorite = async (petId: number) => {
    if (!user) {
      toast.warning('请先登录后再收藏');
      return;
    }
    const isFav = favorites.has(petId);
    setFavorites(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(petId);
      else next.add(petId);
      return next;
    });
    try {
      if (isFav) {
        await del(`/pets/${petId}/favorite`);
      } else {
        await post(`/pets/${petId}/favorite`);
      }
    } catch (e: any) {
      // 回滚
      setFavorites(prev => {
        const next = new Set(prev);
        if (isFav) next.add(petId);
        else next.delete(petId);
        return next;
      });
      toast.error(e.message);
    }
  };

  const activeFilters = [
    query.category && { key: 'category', label: CATEGORY_LABELS[query.category] },
    query.gender && { key: 'gender', label: GENDER_LABELS[query.gender] },
    query.location && { key: 'location', label: query.location },
    query.keyword && { key: 'keyword', label: `"${query.keyword}"` },
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <div className="container py-8 md:py-12">
      <div className="mb-8">
        <span className="heading-eyebrow">领养中心</span>
        <h1 className="mt-2 font-serif text-3xl md:text-4xl font-bold text-ink-900">
          等待一个家的毛孩子
        </h1>
        <p className="mt-2 text-sm text-ink-700">
          所有信息均经审核后展示，请认真了解后再申请领养
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        {/* 筛选侧栏 */}
        <aside className={cn(
          'lg:block',
          filterOpen ? 'fixed inset-0 z-40 bg-ink-900/40 lg:bg-transparent lg:static' : 'hidden'
        )}>
          <div className={cn(
            'lg:sticky lg:top-20 bg-cream-50 lg:bg-transparent lg:rounded-none p-5 lg:p-0',
            filterOpen && 'absolute right-0 top-0 h-full w-80 rounded-l-3xl shadow-lift overflow-y-auto p-6'
          )}>
            <div className="flex items-center justify-between mb-5 lg:mb-6">
              <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
                <SlidersHorizontal size={16} /> 筛选
              </h2>
              {filterOpen && (
                <button onClick={() => setFilterOpen(false)} className="lg:hidden">
                  <X size={18} />
                </button>
              )}
            </div>

            {/* 搜索框 */}
            <div className="mb-6">
              <label className="block text-xs font-mono uppercase tracking-wider text-ink-500 mb-2">关键词</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
                <input
                  type="text"
                  placeholder="品种、性格、关键词..."
                  defaultValue={query.keyword}
                  onBlur={(e) => updateParam('keyword', e.target.value || null)}
                  className="input-base pl-9"
                />
              </div>
            </div>

            {/* 种类 */}
            <div className="mb-6">
              <label className="block text-xs font-mono uppercase tracking-wider text-ink-500 mb-2">种类</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => updateParam('category', query.category === c ? null : c)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                      query.category === c
                        ? 'bg-coral-400 text-cream-50 shadow-soft'
                        : 'bg-warm-100 text-ink-700 hover:bg-warm-200'
                    )}
                  >
                    {CATEGORY_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>

            {/* 性别 */}
            <div className="mb-6">
              <label className="block text-xs font-mono uppercase tracking-wider text-ink-500 mb-2">性别</label>
              <div className="flex flex-wrap gap-2">
                {GENDERS.map(g => (
                  <button
                    key={g}
                    onClick={() => updateParam('gender', query.gender === g ? null : g)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                      query.gender === g
                        ? 'bg-coral-400 text-cream-50 shadow-soft'
                        : 'bg-warm-100 text-ink-700 hover:bg-warm-200'
                    )}
                  >
                    {GENDER_LABELS[g]}
                  </button>
                ))}
              </div>
            </div>

            {/* 年龄 */}
            <div className="mb-6">
              <label className="block text-xs font-mono uppercase tracking-wider text-ink-500 mb-2">年龄</label>
              <div className="space-y-1.5">
                {AGE_OPTIONS.map((opt, i) => {
                  const isActive = (query.ageMin === opt.min && query.ageMax === opt.max) ||
                    (!opt.min && !opt.max && !query.ageMin && !query.ageMax && i === 0);
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        updateParam('ageMin', opt.min === undefined ? null : String(opt.min));
                        updateParam('ageMax', opt.max === undefined ? null : String(opt.max));
                        if (opt.min !== undefined) {
                          const next = new URLSearchParams(searchParams);
                          next.set('ageMin', String(opt.min));
                          if (opt.max !== undefined) next.set('ageMax', String(opt.max));
                          else next.delete('ageMax');
                          next.delete('page');
                          setSearchParams(next);
                        } else {
                          const next = new URLSearchParams(searchParams);
                          next.delete('ageMin');
                          next.delete('ageMax');
                          next.delete('page');
                          setSearchParams(next);
                        }
                      }}
                      className={cn(
                        'block w-full text-left rounded-lg px-3 py-1.5 text-sm transition-colors',
                        isActive ? 'bg-coral-400/15 text-coral-500 font-medium' : 'text-ink-700 hover:bg-warm-100'
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 地区 */}
            <div className="mb-6">
              <label className="block text-xs font-mono uppercase tracking-wider text-ink-500 mb-2">地区</label>
              <input
                type="text"
                placeholder="如：北京、上海..."
                defaultValue={query.location}
                onBlur={(e) => updateParam('location', e.target.value || null)}
                className="input-base"
              />
            </div>

            <button
              onClick={() => setSearchParams(new URLSearchParams())}
              className="btn-ghost w-full"
            >
              清空筛选
            </button>
          </div>
        </aside>

        {/* 卡片网格 */}
        <div>
          {/* 工具栏 */}
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="text-sm text-ink-700">
              共 <span className="font-mono font-semibold text-ink-900">{total}</span> 只毛孩子
              {activeFilters.length > 0 && (
                <span className="ml-2 inline-flex flex-wrap items-center gap-1.5">
                  {activeFilters.map(f => (
                    <span key={f.key} className="badge bg-warm-100 text-ink-700">
                      {f.label}
                      <button onClick={() => updateParam(f.key, null)} className="ml-0.5 hover:text-coral-400">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterOpen(true)}
                className="lg:hidden btn-ghost"
              >
                <SlidersHorizontal size={14} /> 筛选
              </button>
              <div className="flex rounded-full bg-warm-100 p-0.5">
                <button
                  onClick={() => updateParam('sort', 'latest')}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                    query.sort === 'latest' ? 'bg-cream-50 text-ink-900 shadow-soft' : 'text-ink-700'
                  )}
                >
                  最新
                </button>
                <button
                  onClick={() => updateParam('sort', 'popular')}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                    query.sort === 'popular' ? 'bg-cream-50 text-ink-900 shadow-soft' : 'text-ink-700'
                  )}
                >
                  热门
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <PetCardSkeleton key={i} />)}
            </div>
          ) : pets.length === 0 ? (
            <EmptyState
              icon={<PawPrint size={28} />}
              title="没有找到匹配的毛孩子"
              description="试试调整筛选条件，或清除所有筛选重新浏览"
              action={<button onClick={() => setSearchParams(new URLSearchParams())} className="btn-outline">清空筛选</button>}
            />
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pets.map((p) => (
                  <PetCard
                    key={p.id}
                    pet={p}
                    publisher={(p as any).publisher}
                    favorited={favorites.has(p.id) || (p as any).favorited}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </div>
              <Pagination
                page={query.page || 1}
                pageSize={query.pageSize || 12}
                total={total}
                onChange={onPageChange}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
