import { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore } from '@/store/toast';

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLORS = {
  success: 'bg-sage-500 text-cream-50',
  error: 'bg-coral-400 text-cream-50',
  info: 'bg-ink-700 text-cream-50',
  warning: 'bg-amber-gold text-cream-50',
};

export default function ToastContainer() {
  const { toasts, remove } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm">
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div
            key={t.id}
            className="animate-fade-up flex items-start gap-3 rounded-2xl px-4 py-3 shadow-card"
            style={{ backgroundColor: COLORS[t.type].split(' ')[0].includes('cream') ? '#FBF7F0' : undefined }}
          >
            <div className={`flex h-7 w-7 flex-none items-center justify-center rounded-full ${COLORS[t.type]}`}>
              <Icon size={16} />
            </div>
            <p className="flex-1 pt-0.5 text-sm text-ink-900">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="text-ink-500 hover:text-ink-900 transition-colors"
              aria-label="关闭"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
