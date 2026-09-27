import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, Heart, FileText, Home as HomeIcon, PawPrint, Megaphone, Sparkles } from 'lucide-react';
import type { Pet, Announcement } from '../../shared/types';
import { get } from '@/utils/api';
import PetCard from '@/components/PetCard';
import { PetCardSkeleton } from '@/components/Loading';
import { relativeTime } from '@/utils/format';

const HERO_IMAGE = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + 
  encodeURIComponent('warm cinematic photograph of a person holding a rescued orange tabby cat, soft golden hour light, cozy home atmosphere, depth of field, professional pet adoption photo') +
  '&image_size=landscape_16_9';

const PROCESS_STEPS = [
  { num: '01', title: '浏览领养', desc: '在领养中心按种类、年龄、地区筛选心仪的毛孩子', icon: Search },
  { num: '02', title: '提交申请', desc: '在线填写领养申请表，说明家庭情况与养宠经验', icon: FileText },
  { num: '03', title: '审核确认', desc: '发布者或管理员审核申请，通过后双方联系确认', icon: Heart },
  { num: '04', title: '迎接回家', desc: '完成领养，开启一段温暖的相伴旅程', icon: HomeIcon },
];

export default function Home() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [petRes, annRes] = await Promise.all([
          get<{ list: Pet[]; total: number }>('/pets', { pageSize: 8, sort: 'latest' }),
          get<Announcement[]>('/announcements'),
        ]);
        setPets(petRes.list);
        setAnnouncements(annRes.slice(0, 5));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-cream-100">
        <div className="absolute inset-0">
          <img src={HERO_IMAGE} alt="" className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-cream-100 via-cream-100/80 to-transparent" />
        </div>
        <div className="container relative grid gap-8 py-16 md:py-24 lg:grid-cols-2 lg:items-center">
          <div className="animate-fade-up">
            <span className="heading-eyebrow">
              <Sparkles size={12} /> 领养代替购买
            </span>
            <h1 className="mt-4 font-serif text-5xl md:text-6xl font-bold leading-[1.05] text-ink-900 text-balance">
              给一个流浪的灵魂，
              <br />
              <span className="text-coral-400">一个永远的家。</span>
            </h1>
            <p className="mt-6 text-base md:text-lg text-ink-700 max-w-xl leading-relaxed">
              暖窝是面向救助机构与领养者的公益领养平台。我们聚合真实的领养信息，
              规范领养流程，让每一个等待的毛孩子都能找到属于它的温暖角落。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/pets" className="btn-primary">
                <Search size={16} /> 开始领养
              </Link>
              <Link to="/publish" className="btn-outline">
                <PawPrint size={16} /> 发布领养信息
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-8 text-ink-700">
              <div>
                <p className="font-serif text-3xl font-bold text-coral-400">200+</p>
                <p className="text-xs text-ink-500">已发布的毛孩子</p>
              </div>
              <div className="h-10 w-px bg-warm-200" />
              <div>
                <p className="font-serif text-3xl font-bold text-coral-400">120+</p>
                <p className="text-xs text-ink-500">已找到新家</p>
              </div>
              <div className="h-10 w-px bg-warm-200" />
              <div>
                <p className="font-serif text-3xl font-bold text-coral-400">15+</p>
                <p className="text-xs text-ink-500">合作救助机构</p>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block animate-zoom-in">
            <div className="absolute -top-8 -right-8 h-72 w-72 rounded-full bg-coral-400/20 blur-3xl" />
            <div className="relative grid grid-cols-2 gap-4">
              <div className="space-y-4 pt-8">
                <img
                  src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=closeup portrait of a fluffy orange tabby cat looking at camera, soft warm light&image_size=portrait_4_3"
                  alt="待领养猫咪"
                  className="rounded-3xl shadow-card w-full aspect-[3/4] object-cover"
                />
                <img
                  src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=small brown puppy looking up curious, soft pastel background&image_size=square"
                  alt="待领养小狗"
                  className="rounded-3xl shadow-card w-full aspect-square object-cover"
                />
              </div>
              <div className="space-y-4">
                <img
                  src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=white samoyed dog smiling in park, fluffy fur, sunny day&image_size=square"
                  alt="萨摩耶"
                  className="rounded-3xl shadow-card w-full aspect-square object-cover"
                />
                <img
                  src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=black and white cat sitting by window, dignified expression&image_size=portrait_4_3"
                  alt="猫咪"
                  className="rounded-3xl shadow-card w-full aspect-[3/4] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 公告条 */}
      {announcements.length > 0 && (
        <section className="border-y border-amber-gold/30 bg-amber-gold/8">
          <div className="container py-3 flex items-center gap-4">
            <span className="flex items-center gap-2 flex-none rounded-full bg-amber-gold text-cream-50 px-3 py-1 text-xs font-mono font-medium">
              <Megaphone size={12} /> 公告
            </span>
            <div className="flex-1 overflow-hidden">
              <div className="flex gap-12 animate-marquee whitespace-nowrap">
                {[...announcements, ...announcements].map((a, i) => (
                  <Link
                    key={i}
                    to="/announcements"
                    className="text-sm text-ink-700 hover:text-coral-400 transition-colors"
                  >
                    <span className="text-coral-500">·</span> {a.title}
                    <span className="ml-3 text-xs text-ink-500">{relativeTime(a.createdAt)}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 最新领养信息 */}
      <section className="container py-16 md:py-20">
        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <span className="heading-eyebrow">最新到达</span>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl font-bold text-ink-900">
              等待回家的毛孩子
            </h2>
            <p className="mt-2 text-sm text-ink-700">每一只都在耐心地等待一个温暖的家</p>
          </div>
          <Link to="/pets" className="btn-ghost hidden sm:inline-flex">
            查看全部 <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <PetCardSkeleton key={i} />)
            : pets.map((p, i) => (
              <PetCard
                key={p.id}
                pet={p}
                publisher={(p as any).publisher}
                className="animate-fade-up"
              />
            ))}
        </div>

        <div className="mt-10 text-center sm:hidden">
          <Link to="/pets" className="btn-outline">
            查看全部 <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* 领养流程 */}
      <section className="bg-ink-900 text-cream-50 py-16 md:py-20">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-coral-400">
              <Sparkles size={12} /> 领养流程
            </span>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl font-bold">
              四步，让一颗心不再流浪
            </h2>
            <p className="mt-3 text-sm text-cream-50/70">
              规范、透明、有温度的领养流程，保障宠物福利与领养者体验
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {PROCESS_STEPS.map((s, i) => (
              <div
                key={s.num}
                className="relative rounded-3xl bg-ink-700/40 border border-cream-50/10 p-6 hover:bg-ink-700 transition-colors animate-fade-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className="font-mono text-sm text-coral-400">{s.num}</span>
                <div className="mt-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-coral-400/15 text-coral-400">
                  <s.icon size={20} />
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-cream-50/70 leading-relaxed">{s.desc}</p>
                {i < PROCESS_STEPS.length - 1 && (
                  <ArrowRight
                    size={20}
                    className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 text-cream-50/30 z-10"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link to="/about" className="btn-primary">
              了解更多 <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* 理念条 */}
      <section className="container py-16 md:py-20 text-center">
        <p className="font-serif text-2xl md:text-3xl text-ink-900 max-w-3xl mx-auto leading-relaxed text-balance">
          「每一次领养，
          <span className="text-coral-400">不只是带走一只动物</span>，
          而是给一段生命，
          一个不再寒冷的归宿。」
        </p>
        <div className="mt-6 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-ink-500">
          <PawPrint size={12} /> warmnest · since 2026
        </div>
      </section>
    </div>
  );
}
