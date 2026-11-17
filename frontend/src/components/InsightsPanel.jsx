import { CircleAlert, Hourglass, Wallet, Bell, TrendingUp, TrendingDown, UserRound, Clock, CircleCheck, FileText, Sparkles, ChevronRight } from 'lucide-react';
import { useRouter } from '../hooks/useRouter';
import EmptyState from './EmptyState';

const ICONS = { alert: CircleAlert, hourglass: Hourglass, wallet: Wallet, bell: Bell, up: TrendingUp, down: TrendingDown, user: UserRound, clock: Clock, check: CircleCheck, file: FileText };
const TONES = {
  danger: 'bg-red-50 text-red-600',
  warning: 'bg-amber-50 text-amber-600',
  success: 'bg-emerald-50 text-emerald-600',
  info: 'bg-blue-50 text-blue-600',
};

export default function InsightsPanel({ insights, limit }) {
  const { navigate } = useRouter();
  const list = limit ? insights.slice(0, limit) : insights;
  return (
    <section className="card overflow-hidden">
      <header className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-[15px] font-bold text-slate-900">Business Insights</h2>
          <p className="text-xs text-slate-500">Generated from your live invoice and payment data</p>
        </div>
      </header>
      {list.length === 0 ? (
        <EmptyState compact icon={Sparkles} title="No insights yet" message="Create a few invoices and PayTrack will start spotting patterns." />
      ) : (
        <ul className="divide-y divide-slate-100">
          {list.map((ins) => {
            const Icon = ICONS[ins.icon] || Sparkles;
            const clickable = !!ins.action;
            return (
              <li key={ins.id}>
                <button
                  disabled={!clickable}
                  onClick={() => clickable && navigate(ins.action.to)}
                  className={`group flex w-full items-start gap-3 px-5 py-3.5 text-left ${clickable ? 'hover:bg-slate-50' : 'cursor-default'}`}
                >
                  <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${TONES[ins.tone]}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900">{ins.title}</span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-slate-500">{ins.detail}</span>
                  </span>
                  {clickable && <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
