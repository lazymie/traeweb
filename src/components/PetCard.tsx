import { Link } from 'react-router-dom';
import { Heart, MapPin, Eye, PawPrint } from 'lucide-react';
import type { Pet, User } from '../../shared/types';
import { CATEGORY_LABELS, GENDER_LABELS, formatAge } from '@/utils/format';
import { cn } from '@/lib/utils';

interface PetCardProps {
  pet: Pet;
  publisher?: User;
  favorited?: boolean;
  onToggleFavorite?: (petId: number) => void;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-sage-500/90 text-cream-50',
  adopted: 'bg-amber-gold text-cream-50',
  pending: 'bg-amber-soft text-ink-900',
  rejected: 'bg-coral-400/90 text-cream-50',
  offline: 'bg-ink-500 text-cream-50',
};

const STATUS_LABELS: Record<string, string> = {
  available: '可领养',
  adopted: '已领养',
  pending: '待审核',
  rejected: '已驳回',
  offline: '已下架',
};

export default function PetCard({ pet, publisher, favorited, onToggleFavorite, className }: PetCardProps) {
  const cover = pet.images?.[0];
  const status = STATUS_LABELS[pet.status] ?? pet.status;

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-3xl bg-cream-50 shadow-soft border border-warm-100/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-card',
        className
      )}
    >
      <Link to={`/pets/${pet.id}`} className="block relative aspect-[4/3] overflow-hidden bg-warm-100">
        {cover ? (
          <img
            src={cover}
            alt={pet.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-500">
            <PawPrint size={32} />
          </div>
        )}
        <span className={cn(
          'absolute left-3 top-3 badge shadow-soft',
          STATUS_STYLES[pet.status] ?? STATUS_STYLES.available
        )}>
          {status}
        </span>
      </Link>

      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(pet.id);
          }}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-cream-50/90 backdrop-blur shadow-soft transition-all hover:bg-cream-50 hover:scale-110"
          aria-label={favorited ? '取消收藏' : '收藏'}
        >
          <Heart
            size={16}
            className={cn(
              'transition-colors',
              favorited ? 'fill-coral-400 text-coral-400' : 'text-ink-500'
            )}
          />
        </button>
      )}

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h3 className="font-serif text-lg font-semibold text-ink-900 truncate">
            <Link to={`/pets/${pet.id}`} className="hover:text-coral-400 transition-colors">
              {pet.title}
            </Link>
          </h3>
          <span className="text-xs text-ink-500 font-mono shrink-0">
            {formatAge(pet.age, pet.ageUnit)} · {GENDER_LABELS[pet.gender]}
          </span>
        </div>

        <div className="text-xs text-ink-700 space-y-1">
          <p className="truncate">
            <span className="text-ink-500">{CATEGORY_LABELS[pet.category]}</span>
            {pet.breed && <span className="ml-1">· {pet.breed}</span>}
          </p>
          {pet.location && (
            <p className="flex items-center gap-1 text-ink-500">
              <MapPin size={11} />
              <span className="truncate">{pet.location}</span>
            </p>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-3 text-xs text-ink-500">
          <span className="flex items-center gap-1">
            <Heart size={12} className="fill-coral-400/40 text-coral-400/60" />
            {pet.favoriteCount}
          </span>
          <span className="flex items-center gap-1">
            <Eye size={12} />
            {pet.viewCount}
          </span>
          {publisher && (
            <span className="truncate text-ink-500 max-w-[8rem]">by {publisher.nickname}</span>
          )}
        </div>
      </div>
    </article>
  );
}
