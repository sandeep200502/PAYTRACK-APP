import { CircleCheck, Clock, CircleAlert, CircleDashed, PieChart, FileText } from 'lucide-react';
import { STATUS_LABEL } from '../utils/invoiceCalc';

// Colour + icon + label, so status is never communicated by colour alone.
const STYLES = {
  paid: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', icon: CircleCheck },
  partial: { cls: 'bg-blue-50 text-blue-700 ring-blue-600/20', icon: PieChart },
  pending: { cls: 'bg-amber-50 text-amber-800 ring-amber-600/25', icon: Clock },
  overdue: { cls: 'bg-red-50 text-red-700 ring-red-600/20', icon: CircleAlert },
  draft: { cls: 'bg-slate-100 text-slate-600 ring-slate-500/20', icon: FileText },
};

export default function StatusBadge({ status, size = 'md' }) {
  const s = STYLES[status] || { cls: 'bg-slate-100 text-slate-600 ring-slate-500/20', icon: CircleDashed };
  const Icon = s.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full font-semibold ring-1 ring-inset ${s.cls} ${
        size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'
      }`}
    >
      <Icon className={size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'} aria-hidden />
      {STATUS_LABEL[status] || status}
    </span>
  );
}

const TONE = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/25',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

export function Pill({ tone = 'slate', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONE[tone]} ${className}`}>
      {children}
    </span>
  );
}
