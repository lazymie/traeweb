import { PawPrint } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function EmptyState({ title = '暂无数据', description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warm-100 text-ink-500 mb-4">
        {icon ?? <PawPrint size={28} />}
      </div>
      <h3 className="font-serif text-lg font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-2 text-sm text-ink-700 max-w-md">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
