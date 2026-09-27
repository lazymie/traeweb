import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Loading({ className, size = 24 }: { className?: string; size?: number }) {
  return <Loader2 className={cn('animate-spin text-coral-400', className)} size={size} />;
}

export function PageLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-full border-2 border-warm-200" />
          <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-coral-400 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-ink-500">加载中...</p>
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-warm-100', className)} />;
}

export function PetCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl bg-cream-50 shadow-soft border border-warm-100/70">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-3 w-24" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>
    </div>
  );
}
