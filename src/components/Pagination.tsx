import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-2 py-6">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-warm-200 text-ink-700 hover:bg-warm-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        aria-label="上一页"
      >
        <ChevronLeft size={16} />
      </button>
      {pages.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            'flex h-9 min-w-[2.25rem] items-center justify-center rounded-full px-3 text-sm font-mono transition-colors',
            p === page
              ? 'bg-coral-400 text-cream-50 shadow-soft'
              : 'border border-warm-200 text-ink-700 hover:bg-warm-100'
          )}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-warm-200 text-ink-700 hover:bg-warm-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        aria-label="下一页"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
