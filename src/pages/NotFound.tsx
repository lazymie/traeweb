import { Link } from 'react-router-dom';
import { PawPrint, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container py-16 md:py-24 text-center">
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-warm-100">
            <PawPrint size={36} className="text-coral-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-cream-50 border-2 border-warm-100">
            <span className="text-xs font-mono">?</span>
          </div>
        </div>
      </div>
      <p className="font-serif text-7xl font-bold text-ink-900">404</p>
      <h1 className="mt-4 font-serif text-2xl md:text-3xl font-bold text-ink-900">
        这只毛孩子跑丢了
      </h1>
      <p className="mt-3 text-sm text-ink-700 max-w-md mx-auto">
        你访问的页面不存在或已被移除，可能是迷路的小猫带你走到了这里。
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">
          <ArrowLeft size={14} /> 回到首页
        </Link>
        <Link to="/pets" className="btn-outline">
          浏览领养
        </Link>
      </div>
    </div>
  );
}
