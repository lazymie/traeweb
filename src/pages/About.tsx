import { Link } from 'react-router-dom';
import { PawPrint, Heart, ShieldCheck, Users, Search, FileText, ArrowRight, Sparkles } from 'lucide-react';

const HERO = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' +
  encodeURIComponent('group photo of various rescued pets dogs and cats together, warm sunset light, professional photography') +
  '&image_size=landscape_16_9';

const VALUES = [
  { icon: Heart, title: '以领养代替购买', desc: '我们坚持公益理念，反对商业繁殖，让流浪动物有机会重新拥有家。' },
  { icon: ShieldCheck, title: '审核制保障', desc: '所有领养信息与申请都经审核，流程公开透明，保障宠物福利。' },
  { icon: Users, title: '连接救助机构', desc: '聚合全国救助机构信息，让真实可靠的领养机会更快被看见。' },
];

const PROCESS = [
  { num: '01', title: '浏览与筛选', desc: '按种类、年龄、地区等条件找到心仪的毛孩子', icon: Search },
  { num: '02', title: '提交领养申请', desc: '在线填写申请表，说明家庭情况与养宠经验', icon: FileText },
  { num: '03', title: '审核与沟通', desc: '发布者或管理员审核申请，通过后双方沟通确认', icon: Users },
  { num: '04', title: '完成领养', desc: '迎接毛孩子回家，定期回访反馈近况', icon: Heart },
];

export default function About() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-cream-100">
        <div className="absolute inset-0">
          <img src={HERO} alt="" className="h-full w-full object-cover opacity-25" />
        </div>
        <div className="container relative py-16 md:py-24 text-center max-w-3xl">
          <span className="heading-eyebrow justify-center"><Sparkles size={12} /> 关于暖窝</span>
          <h1 className="mt-4 font-serif text-4xl md:text-5xl font-bold text-ink-900 text-balance">
            让等待的灵魂，<br />遇见<span className="text-coral-400">愿意陪伴它</span>的你。
          </h1>
          <p className="mt-6 text-base md:text-lg text-ink-700 leading-relaxed">
            暖窝是一个面向流浪动物救助机构与潜在领养者的公益领养平台。
            我们聚合真实可靠的领养信息，规范领养流程，传播「领养代替购买」的理念，
            让每一个流浪的毛孩子都能找到属于自己的温暖角落。
          </p>
        </div>
      </section>

      {/* 价值观 */}
      <section className="container py-16 md:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {VALUES.map((v, i) => (
            <div
              key={v.title}
              className="card p-6 md:p-8 animate-fade-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-400/15 text-coral-400 mb-4">
                <v.icon size={20} />
              </div>
              <h3 className="font-serif text-xl font-semibold text-ink-900">{v.title}</h3>
              <p className="mt-2 text-sm text-ink-700 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 领养流程 */}
      <section className="bg-ink-900 text-cream-50 py-16 md:py-20">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-coral-400">
              <Sparkles size={12} /> 领养流程
            </span>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl font-bold">规范、透明的四步领养</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {PROCESS.map((s, i) => (
              <div
                key={s.num}
                className="relative rounded-3xl bg-ink-700/40 border border-cream-50/10 p-6 animate-fade-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className="font-mono text-sm text-coral-400">{s.num}</span>
                <div className="mt-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-coral-400/15 text-coral-400">
                  <s.icon size={20} />
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-cream-50/70 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16 md:py-20 text-center">
        <PawPrint size={32} className="mx-auto text-coral-400" />
        <h2 className="mt-4 font-serif text-3xl md:text-4xl font-bold text-ink-900 text-balance max-w-2xl mx-auto">
          准备好，迎接一段温暖的相伴了吗？
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/pets" className="btn-primary">
            浏览领养信息 <ArrowRight size={14} />
          </Link>
          <Link to="/publish" className="btn-outline">
            发布领养信息
          </Link>
        </div>
      </section>
    </div>
  );
}
