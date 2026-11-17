import { Mail, Phone } from 'lucide-react';
import { Pill } from './StatusBadge';
import { formatINR, initials } from '../utils/format';

const AVATAR = ['bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-800', 'bg-violet-100 text-violet-700', 'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-800'];
export const avatarTone = (name = '') => AVATAR[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR.length];

export default function CustomerCard({ customer, stats, onOpen }) {
  const pct = stats.billed ? Math.round((stats.paid / stats.billed) * 100) : 0;
  return (
    <button onClick={onOpen} className="card group flex flex-col p-5 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold ${avatarTone(customer.name)}`}>{initials(customer.name)}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-slate-900 group-hover:text-brand-700">{customer.name}</p>
          <p className="truncate text-xs text-slate-500">{[customer.contactPerson, customer.city].filter(Boolean).join(' · ') || 'No contact details'}</p>
          <Pill tone={stats.behaviour.tone} className="mt-2">{stats.behaviour.label}</Pill>
        </div>
      </div>

      <div className="mt-4 space-y-1 text-xs text-slate-500">
        <p className="flex items-center gap-2 truncate">
          <Mail className="h-3.5 w-3.5 shrink-0" /> {customer.email || '—'}
        </p>
        <p className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 shrink-0" /> {customer.phone || '—'}
        </p>
      </div>

      <div className="num mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
        <div>
          <p className="eyebrow">Billed</p>
          <p className="mt-0.5 text-sm font-bold text-slate-900">{formatINR(stats.billed)}</p>
        </div>
        <div>
          <p className="eyebrow">Paid</p>
          <p className="mt-0.5 text-sm font-bold text-emerald-700">{formatINR(stats.paid)}</p>
        </div>
        <div>
          <p className="eyebrow">Due</p>
          <p className={`mt-0.5 text-sm font-bold ${stats.overdue > 0 ? 'text-red-600' : stats.outstanding > 0 ? 'text-amber-700' : 'text-slate-400'}`}>{formatINR(stats.outstanding)}</p>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100" title={`${pct}% collected`}>
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-[11px] text-slate-500">
        {stats.invoiceCount} invoice{stats.invoiceCount === 1 ? '' : 's'} · {pct}% collected
      </p>
    </button>
  );
}
