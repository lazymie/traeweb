import { useState } from 'react';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

export default function ImageGallery({ images = [], alt, className }: ImageGalleryProps) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);

  if (!Array.isArray(images) || !images.length) {
    return (
      <div className={cn('flex aspect-[4/3] items-center justify-center rounded-3xl bg-warm-100 text-ink-500', className)}>
        <Expand size={32} />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-warm-100 group">
        <img
          src={images[active]}
          alt={alt}
          className="h-full w-full object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setActive(i => (i - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-cream-50/90 backdrop-blur shadow-soft opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cream-50"
              aria-label="上一张"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setActive(i => (i + 1) % images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-cream-50/90 backdrop-blur shadow-soft opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cream-50"
              aria-label="下一张"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
        <button
          onClick={() => setZoom(true)}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-cream-50/90 backdrop-blur shadow-soft hover:bg-cream-50"
          aria-label="放大查看"
        >
          <Expand size={16} />
        </button>
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink-900/60 px-3 py-1 text-xs font-mono text-cream-50">
            {active + 1} / {images.length}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                'flex-none overflow-hidden rounded-xl border-2 transition-colors',
                i === active ? 'border-coral-400' : 'border-transparent hover:border-warm-200'
              )}
            >
              <img src={src} alt={`${alt} ${i + 1}`} className="h-16 w-16 object-cover" />
            </button>
          ))}
        </div>
      )}

      {zoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/90 backdrop-blur p-8 animate-fade-in"
          onClick={() => setZoom(false)}
        >
          <button className="absolute top-6 right-6 text-cream-50/80 hover:text-cream-50 text-sm">关闭 ×</button>
          <img src={images[active]} alt={alt} className="max-h-full max-w-full object-contain rounded-xl" />
        </div>
      )}
    </div>
  );
}
