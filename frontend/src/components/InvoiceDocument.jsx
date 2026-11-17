// The printable invoice sheet (also what "Download / Print" outputs).

import StatusBadge from './StatusBadge';
import { formatDate, formatINRPrecise } from '../utils/format';
import { lineAmount } from '../utils/invoiceCalc';

export default function InvoiceDocument({ invoice: inv, customer, settings }) {
  return (
    <article className="print-area card overflow-hidden">
      <div className="h-1.5 bg-brand-600" />
      <div className="p-6 sm:p-10">
        <header className="flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-lg font-extrabold text-white">₹</div>
              <div>
                <p className="text-lg font-bold text-slate-900">{settings.name}</p>
                <p className="text-xs text-slate-500">GSTIN {settings.gstin}</p>
              </div>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-500">
              {settings.address}
              <br />
              {settings.phone} · {settings.email}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="eyebrow">Tax Invoice</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{inv.number}</p>
            <div className="mt-2 sm:flex sm:justify-end">
              <StatusBadge status={inv.status} size="lg" />
            </div>
          </div>
        </header>

        <div className="mt-8 grid gap-6 rounded-xl bg-slate-50 p-5 sm:grid-cols-3">
          <div>
            <p className="eyebrow">Billed to</p>
            <p className="mt-1.5 font-semibold text-slate-900">{inv.customerName}</p>
            {customer?.contactPerson && <p className="text-sm text-slate-600">Attn: {customer.contactPerson}</p>}
            <p className="text-sm text-slate-500">{inv.customerEmail}</p>
            <p className="text-sm text-slate-500">{inv.customerPhone}</p>
            {customer?.gstin && <p className="mt-1 text-xs text-slate-500">GSTIN {customer.gstin}</p>}
          </div>
          <div>
            <p className="eyebrow">Invoice date</p>
            <p className="num mt-1.5 font-semibold text-slate-900">{formatDate(inv.issueDate)}</p>
            <p className="eyebrow mt-4">Due date</p>
            <p className={`num mt-1.5 font-semibold ${inv.status === 'overdue' ? 'text-red-600' : 'text-slate-900'}`}>{formatDate(inv.dueDate)}</p>
          </div>
          <div>
            <p className="eyebrow">Balance due</p>
            <p className="num mt-1.5 text-2xl font-bold text-slate-900">{formatINRPrecise(inv.balance)}</p>
            {inv.status === 'overdue' && <p className="text-xs font-semibold text-red-600">{inv.daysOverdue} days overdue</p>}
          </div>
        </div>

        <div className="scrollbar-thin mt-8 overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="border-b-2 border-slate-900">
                <th className="py-2.5 pr-3 text-left text-xs font-bold uppercase tracking-wider text-slate-900">#</th>
                <th className="py-2.5 pr-3 text-left text-xs font-bold uppercase tracking-wider text-slate-900">Description</th>
                <th className="py-2.5 pr-3 text-right text-xs font-bold uppercase tracking-wider text-slate-900">Qty</th>
                <th className="py-2.5 pr-3 text-right text-xs font-bold uppercase tracking-wider text-slate-900">Unit price</th>
                <th className="py-2.5 text-right text-xs font-bold uppercase tracking-wider text-slate-900">Amount</th>
              </tr>
            </thead>
            <tbody className="num">
              {inv.items.map((it, i) => (
                <tr key={it.id} className="border-b border-slate-100">
                  <td className="py-3 pr-3 text-sm text-slate-400">{i + 1}</td>
                  <td className="py-3 pr-3 text-sm font-medium text-slate-900">{it.description}</td>
                  <td className="py-3 pr-3 text-right text-sm text-slate-700">{it.quantity}</td>
                  <td className="py-3 pr-3 text-right text-sm text-slate-700">{formatINRPrecise(it.unitPrice)}</td>
                  <td className="py-3 text-right text-sm font-semibold text-slate-900">{formatINRPrecise(lineAmount(it))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-6 sm:flex-row sm:justify-between">
          <div className="max-w-sm text-sm text-slate-500">
            {inv.notes && (
              <>
                <p className="eyebrow mb-1">Notes</p>
                <p className="leading-relaxed">{inv.notes}</p>
              </>
            )}
            {settings.upiId && (
              <p className="mt-3">
                Pay by UPI: <span className="font-semibold text-slate-800">{settings.upiId}</span>
              </p>
            )}
          </div>
          <dl className="num w-full space-y-2 text-sm sm:w-72">
            <Row label="Subtotal" value={formatINRPrecise(inv.subtotal)} />
            {inv.discount > 0 && <Row label="Discount" value={`− ${formatINRPrecise(inv.discount)}`} />}
            {inv.taxRate > 0 && (
              <>
                <Row label={`CGST (${inv.taxRate / 2}%)`} value={formatINRPrecise(inv.tax / 2)} />
                <Row label={`SGST (${inv.taxRate / 2}%)`} value={formatINRPrecise(inv.tax / 2)} />
              </>
            )}
            <div className="flex justify-between border-t-2 border-slate-900 pt-2.5 text-base font-bold text-slate-900">
              <dt>Total</dt>
              <dd>{formatINRPrecise(inv.total)}</dd>
            </div>
            <Row label="Amount paid" value={`− ${formatINRPrecise(inv.paid)}`} tone="text-emerald-700" />
            <div className="flex justify-between rounded-lg bg-slate-900 px-3 py-2 font-bold text-white">
              <dt>Balance due</dt>
              <dd>{formatINRPrecise(inv.balance)}</dd>
            </div>
          </dl>
        </div>

        <p className="mt-10 border-t border-slate-100 pt-4 text-center text-xs text-slate-400">This is a computer-generated invoice from PayTrack. Thank you for your business.</p>
      </div>
    </article>
  );
}

function Row({ label, value, tone = 'text-slate-900' }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`font-medium ${tone}`}>{value}</dd>
    </div>
  );
}
