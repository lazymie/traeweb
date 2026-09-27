import { useState, useEffect } from 'react';
import { Megaphone, Pin, ChevronRight, ArrowLeft, Calendar } from 'lucide-react';
import type { Announcement } from '../../shared/types';
import { get } from '@/utils/api';
import { PageLoading } from '@/components/Loading';
import EmptyState from '@/components/Empty';
import { formatDateTime } from '@/utils/format';

export default function Announcements() {
  const [list, setList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Announcement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await get<Announcement[]>('/announcements');
        setList(data);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <PageLoading />;

  if (active) {
    return (
      <div className="container py-8 md:py-12 max-w-3xl">
        <button onClick={() => setActive(null)} className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-coral-400 mb-6">
          <ArrowLeft size={14} /> 返回公告列表
        </button>
        <article>
          {active.pinned && (
            <span className="inline-flex items-center gap-1 mb-3 badge bg-amber-gold/15 text-amber-gold">
              <Pin size={10} /> 置顶
            </span>
          )}
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink-900 mb-3">{active.title}</h1>
          <p className="text-sm text-ink-500 flex items-center gap-2 mb-6">
            <Calendar size={12} /> {formatDateTime(active.createdAt)}
          </p>
          <div className="rounded-3xl bg-cream-50 border border-warm-100 p-6 md:p-8">
            <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">{active.content}</p>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12 max-w-4xl">
      <div className="mb-8">
        <span className="heading-eyebrow">
          <Megaphone size={12} /> 平台公告
        </span>
        <h1 className="mt-2 font-serif text-3xl md:text-4xl font-bold text-ink-900">
          公告中心
        </h1>
        <p className="mt-2 text-sm text-ink-700">了解平台动态与领养须知</p>
      </div>

      {list.length === 0 ? (
        <EmptyState title="暂无公告" />
      ) : (
        <div className="space-y-3">
          {list.map(a => (
            <button
              key={a.id}
              onClick={() => setActive(a)}
              className="w-full text-left card p-5 hover:shadow-card transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="flex-none">
                  {a.pinned ? (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-gold/15 text-amber-gold">
                      <Pin size={16} />
                    </span>
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-coral-400/15 text-coral-400">
                      <Megaphone size={16} />
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    {a.pinned && <span className="badge bg-amber-gold/15 text-amber-gold">置顶</span>}
                    <h3 className="font-serif text-lg font-semibold text-ink-900 group-hover:text-coral-400 transition-colors truncate">
                      {a.title}
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-ink-700 line-clamp-2">{a.excerpt || a.content}</p>
                  <p className="mt-2 text-xs text-ink-500 font-mono">{formatDateTime(a.createdAt)}</p>
                </div>
                <ChevronRight size={16} className="text-ink-500 group-hover:text-coral-400 group-hover:translate-x-1 transition-all flex-none mt-2" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
