import { Link } from 'react-router-dom';
import { PawPrint, Github, Mail, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-warm-100 bg-cream-100">
      <div className="container py-12 grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-coral-400 text-cream-50">
              <PawPrint size={16} />
            </div>
            <span className="font-serif text-lg font-bold text-ink-900">暖窝</span>
          </div>
          <p className="mt-3 text-sm text-ink-700 max-w-md leading-relaxed">
            暖窝 · 宠物领养平台致力于整合救助机构与领养者的信息，让每一个流浪毛孩子都能更快找到温暖的家。
          </p>
          <p className="mt-4 text-xs text-ink-500">
            用「<span className="text-coral-400 font-medium">领养代替购买</span>」，让陪伴不再缺席。
          </p>
        </div>

        <div>
          <h4 className="font-serif text-sm font-semibold text-ink-900 mb-3">导航</h4>
          <ul className="space-y-2 text-sm text-ink-700">
            <li><Link to="/" className="hover:text-coral-400 transition-colors">首页</Link></li>
            <li><Link to="/pets" className="hover:text-coral-400 transition-colors">领养</Link></li>
            <li><Link to="/announcements" className="hover:text-coral-400 transition-colors">公告中心</Link></li>
            <li><Link to="/about" className="hover:text-coral-400 transition-colors">关于我们</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-sm font-semibold text-ink-900 mb-3">联系</h4>
          <ul className="space-y-2 text-sm text-ink-700">
            <li className="flex items-center gap-2"><Mail size={14} /> hello@warmnest.cn</li>
            <li className="flex items-center gap-2"><Github size={14} /> github.com/warmnest</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-warm-100">
        <div className="container py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-ink-500">
          <p>© 2026 暖窝 WarmNest · 仅用于学习与演示</p>
          <p className="flex items-center gap-1">
            Made with <Heart size={11} className="fill-coral-400 text-coral-400" /> for every wandering soul
          </p>
        </div>
      </div>
    </footer>
  );
}
