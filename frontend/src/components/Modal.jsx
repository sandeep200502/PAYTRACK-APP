import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/** Accessible modal: Esc to close, focus moves inside, backdrop click closes. */
export default function Modal({ title, subtitle, onClose, children, footer, size = 'md', icon: Icon, iconTone = 'blue' }) {
  const panel = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const first = panel.current?.querySelector('input, select, textarea, button:not([data-close])');
    first?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' };
  const tones = { blue: 'bg-blue-50 text-blue-600', red: 'bg-red-50 text-red-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600' };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade-in bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panel}
        className={`relative flex max-h-[92vh] w-full animate-slide-up flex-col rounded-t-2xl bg-white shadow-pop sm:rounded-2xl ${widths[size]}`}
      >
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          {Icon && (
            <div className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tones[iconTone]}`}>
              <Icon className="h-[18px] w-[18px]" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button data-close className="btn btn-ghost -mr-2 -mt-1 p-2" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">{footer}</div>}
      </div>
    </div>
  );
}
