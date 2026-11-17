import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Pencil, Send, Trash2, Wallet } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDate, formatINR } from '../utils/format';

function dueHint(inv) {
  if (inv.status === 'paid') return inv.paidOnDate ? `Paid ${formatDate(inv.paidOnDate)}` : 'Paid';
  if (inv.status === 'draft') return 'Not sent';
  if (inv.status === 'overdue') return `${inv.daysOverdue}d overdue`;
  if (inv.daysToDue === 0) return 'Due today';
  return `in ${inv.daysToDue}d`;
}

const hintTone = (inv) =>
  inv.status === 'overdue' ? 'text-red-600' : inv.status !== 'paid' && inv.status !== 'draft' && inv.daysToDue <= 3 ? 'text-amber-600' : 'text-slate-400';

function SortHeader({ label, field, sort, onSort, align = 'left', className = '' }) {
  if (!onSort) return <th className={`th ${align === 'right' ? 'text-right' : ''} ${className}`}>{label}</th>;
  const active = sort?.field === field;
  const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th className={`th ${align === 'right' ? 'text-right' : ''} ${className}`} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button onClick={() => onSort(field)} className={`inline-flex items-center gap-1 uppercase tracking-wider hover:text-slate-900 ${active ? 'text-slate-900' : ''}`}>
        {label}
        <Icon className="h-3 w-3" />
      </button>
    </th>
  );
}

/**
 * Responsive invoice list: a sortable table on tablet/desktop, cards on phones.
 * variant="compact" hides issue date / paid columns (dashboard).
 */
export default function InvoiceTable({ invoices, variant = 'full', sort, onSort, onOpen, onEdit, onDelete, onPay, onRemind }) {
  const full = variant === 'full';
  return (
    <>
      {/* Desktop / tablet */}
      <div className="scrollbar-thin hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead className="border-b border-slate-100 bg-slate-50/60">
            <tr>
              <SortHeader label="Invoice" field="number" sort={sort} onSort={onSort} />
              <SortHeader label="Customer" field="customerName" sort={sort} onSort={onSort} />
              {full && <SortHeader label="Issue date" field="issueDate" sort={sort} onSort={onSort} className="hidden 2xl:table-cell" />}
              <SortHeader label="Due date" field="dueDate" sort={sort} onSort={onSort} />
              <SortHeader label="Amount" field="total" sort={sort} onSort={onSort} align="right" />
              {full && <SortHeader label="Paid" field="paid" sort={sort} onSort={onSort} align="right" className="hidden xl:table-cell" />}
              {full && <SortHeader label="Balance" field="balance" sort={sort} onSort={onSort} align="right" />}
              <SortHeader label="Status" field="status" sort={sort} onSort={onSort} />
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="group cursor-pointer transition hover:bg-slate-50/80" onClick={() => onOpen?.(inv)}>
                <td className="td font-semibold text-slate-900">{inv.number}</td>
                <td className="td max-w-[200px] truncate">{inv.customerName}</td>
                {full && <td className="td num hidden text-slate-500 2xl:table-cell">{formatDate(inv.issueDate)}</td>}
                <td className="td">
                  <div className="num">{formatDate(inv.dueDate)}</div>
                  <div className={`text-[11px] font-medium ${hintTone(inv)}`}>{dueHint(inv)}</div>
                </td>
                <td className="td num text-right font-semibold text-slate-900">{formatINR(inv.total)}</td>
                {full && <td className="td num hidden text-right text-emerald-700 xl:table-cell">{inv.paid ? formatINR(inv.paid) : '—'}</td>}
                {full && <td className={`td num text-right font-semibold ${inv.balance > 0 && inv.status !== 'draft' ? 'text-slate-900' : 'text-slate-400'}`}>{formatINR(inv.balance)}</td>}
                <td className="td">
                  <StatusBadge status={inv.status} />
                </td>
                <td className="td text-right" onClick={(e) => e.stopPropagation()}>
                  <RowActions inv={inv} compactActions={full && !!onEdit} {...{ onOpen, onEdit, onDelete, onPay, onRemind }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phone */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {invoices.map((inv) => (
          <li key={inv.id} className="px-4 py-3.5 active:bg-slate-50" onClick={() => onOpen?.(inv)}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{inv.customerName}</p>
                <p className="text-xs text-slate-500">
                  {inv.number} · Due {formatDate(inv.dueDate)}
                </p>
              </div>
              <div className="text-right">
                <p className="num text-sm font-bold text-slate-900">{formatINR(inv.status === 'paid' || inv.status === 'draft' ? inv.total : inv.balance)}</p>
                <p className={`text-[11px] font-medium ${hintTone(inv)}`}>{inv.status === 'paid' || inv.status === 'draft' ? dueHint(inv) : `due · ${dueHint(inv)}`}</p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
              <StatusBadge status={inv.status} />
              <RowActions inv={inv} {...{ onOpen, onEdit, onDelete, onPay, onRemind }} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function IconBtn({ label, onClick, icon: Icon, tone = 'default' }) {
  const tones = {
    default: 'text-slate-400 hover:bg-slate-100 hover:text-slate-700',
    blue: 'text-slate-400 hover:bg-blue-50 hover:text-blue-600',
    green: 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600',
    red: 'text-slate-400 hover:bg-red-50 hover:text-red-600',
    amber: 'text-slate-400 hover:bg-amber-50 hover:text-amber-600',
  };
  return (
    <button onClick={onClick} className={`grid h-7 w-7 place-items-center rounded-lg transition ${tones[tone]}`} aria-label={label} title={label}>
      <Icon className="h-4 w-4" />
    </button>
  );
}

function RowActions({ inv, onOpen, onEdit, onDelete, onPay, onRemind, compactActions }) {
  const open = inv.status !== 'paid' && inv.status !== 'draft';
  return (
    <div className="inline-flex items-center gap-0.5">
      {onOpen && !compactActions && <IconBtn label={`View ${inv.number}`} icon={Eye} onClick={() => onOpen(inv)} />}
      {onPay && open && <IconBtn label={`Record payment for ${inv.number}`} icon={Wallet} tone="green" onClick={() => onPay(inv)} />}
      {onRemind && open && <IconBtn label={`Send reminder for ${inv.number}`} icon={Send} tone="amber" onClick={() => onRemind(inv)} />}
      {onEdit && <IconBtn label={`Edit ${inv.number}`} icon={Pencil} tone="blue" onClick={() => onEdit(inv)} />}
      {onDelete && <IconBtn label={`Delete ${inv.number}`} icon={Trash2} tone="red" onClick={() => onDelete(inv)} />}
    </div>
  );
}
