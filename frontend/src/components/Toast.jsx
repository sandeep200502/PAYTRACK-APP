import { CircleCheck, CircleAlert, Info, TriangleAlert, X } from 'lucide-react';
import { useToastState } from '../hooks/useToast';

const STYLE = {
  success: { icon: CircleCheck, cls: 'text-emerald-600', bar: 'bg-emerald-500' },
  error: { icon: CircleAlert, cls: 'text-red-600', bar: 'bg-red-500' },
  warning: { icon: TriangleAlert, cls: 'text-amber-600', bar: 'bg-amber-500' },
  info: { icon: Info, cls: 'text-blue-600', bar: 'bg-blue-500' },
};

export default function ToastViewport() {
  const { toasts, dismiss } = useToastState();
  return (
    <div className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:bottom-auto sm:left-auto sm:right-0 sm:top-16 sm:items-end" aria-live="polite">
      {toasts.map((t) => {
        const s = STYLE[t.type];
        const Icon = s.icon;
        return (
          <div key={t.id} className="pointer-events-auto flex w-full max-w-sm animate-slide-in items-start gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-3.5 pr-2 shadow-pop">
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${s.cls}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{t.title}</p>
              {t.detail && <p className="mt-0.5 text-[13px] leading-snug text-slate-500">{t.detail}</p>}
            </div>
            <button className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
