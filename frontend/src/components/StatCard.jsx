import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

const TONES = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  slate: 'bg-slate-100 text-slate-600',
  violet: 'bg-violet-50 text-violet-600',
};

export default function StatCard({ label, value, icon: Icon, tone = 'blue', sub, trend, onClick }) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={`card group flex w-full flex-col gap-3 p-4 text-left sm:p-5 ${onClick ? 'transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-slate-500">{label}</span>
        {Icon && (
          <span className={`grid h-8 w-8 place-items-center rounded-lg ${TONES[tone]}`}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="num text-[22px] font-bold tracking-tight text-slate-900 sm:text-2xl">{value}</div>
      {(sub || trend !== undefined) && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          {trend !== undefined && trend !== null && (
            <span className={`inline-flex items-center font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {Math.abs(trend)}%
            </span>
          )}
          {sub}
        </div>
      )}
    </Comp>
  );
}
