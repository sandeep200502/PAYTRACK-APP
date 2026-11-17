import { useMemo, useState } from 'react';
import { Plus, Search, Wallet, IndianRupee, CalendarCheck, Smartphone, SearchX, Trash2, CircleCheck } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import { Input, Select } from '../components/FormField';
import { useData } from '../hooks/useData';
import { useRouter } from '../hooks/useRouter';
import { useModals } from '../hooks/useModals';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { paymentMethodBreakdown, computeKpis } from '../utils/analytics';
import { formatDate, formatINR } from '../utils/format';
import { METHOD_COLORS } from '../utils/analytics';

export default function Payments() {
  const { payments, invoices, actions, today } = useData();
  const { navigate } = useRouter();
  const { openPayment } = useModals();
  const confirm = useConfirm();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('');
  const [month, setMonth] = useState('');

  const k = computeKpis(invoices, payments, today);
  const methods = paymentMethodBreakdown(payments);
  const top = methods.slice().sort((a, b) => b.amount - a.amount)[0];
  const months = [...new Set(payments.map((p) => p.date.slice(0, 7)))].sort().reverse();

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter(
      (p) =>
        (!q || [p.number, p.invoiceNumber, p.customerName, p.reference].some((v) => v?.toLowerCase().includes(q))) &&
        (!method || p.method === method) &&
        (!month || p.date.startsWith(month)),
    );
  }, [payments, search, method, month]);

  const remove = async (p) => {
    const ok = await confirm({ title: `Remove ${p.number}?`, message: `${formatINR(p.amount)} from ${p.customerName} will be removed and ${p.invoiceNumber}'s balance will go back up. Use this only to fix a mistake.`, confirmLabel: 'Remove Payment' });
    if (!ok) return;
    await actions.deletePayment(p.id);
    toast.success('Payment removed', `${p.invoiceNumber} balance updated.`);
  };

  return (
    <>
      <PageHeader
        title="Payments"
        subtitle="Every rupee received, linked to its invoice."
        actions={
          <Button variant="success" icon={Plus} onClick={() => openPayment()}>
            Record Payment
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Received" value={formatINR(k.totalRevenue)} icon={IndianRupee} tone="green" sub={`${payments.length} payments`} />
        <StatCard label="Received This Month" value={formatINR(k.paidThisMonth)} icon={CalendarCheck} tone="blue" sub={`${k.paymentsThisMonth} payments`} />
        <StatCard label="Average Payment" value={formatINR(payments.length ? k.totalRevenue / payments.length : 0)} icon={Wallet} tone="violet" />
        <StatCard label="Top Method" value={top?.amount ? top.name : '—'} icon={Smartphone} tone="amber" sub={top?.amount ? `${formatINR(top.amount)} received` : undefined} />
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 p-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input aria-label="Search payments" placeholder="Search by customer, invoice, payment ID or reference…" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2 md:flex">
            <Select aria-label="Filter by method" value={method} onChange={(e) => setMethod(e.target.value)} className="md:w-44">
              <option value="">All methods</option>
              {['UPI', 'Bank Transfer', 'Cash', 'Card'].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </Select>
            <Select aria-label="Filter by month" value={month} onChange={(e) => setMonth(e.target.value)} className="md:w-44">
              <option value="">All months</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {new Date(`${m}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {payments.length === 0 ? (
          <EmptyState icon={Wallet} title="No payments recorded" message="When a customer pays, record it here. The invoice balance and status update instantly." action={<Button variant="success" icon={Plus} onClick={() => openPayment()}>Record Payment</Button>} />
        ) : rows.length === 0 ? (
          <EmptyState icon={SearchX} title="No payments match" message="Try another search or clear the filters." />
        ) : (
          <>
            <div className="scrollbar-thin hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="border-y border-slate-100 bg-slate-50/60">
                  <tr>
                    {['Payment ID', 'Invoice', 'Customer', 'Amount', 'Method', 'Date', 'Reference', 'Status', ''].map((h) => (
                      <th key={h} className={`th ${h === 'Amount' ? 'text-right' : ''} ${h === 'Reference' ? 'hidden 2xl:table-cell' : ''} ${h === 'Payment ID' ? 'hidden xl:table-cell' : ''}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="td hidden font-semibold text-slate-900 xl:table-cell">{p.number}</td>
                      <td className="td">
                        <button onClick={() => navigate(`/invoices/${p.invoiceId}`)} className="font-semibold text-brand-600 hover:underline">
                          {p.invoiceNumber}
                        </button>
                      </td>
                      <td className="td max-w-[200px] truncate">{p.customerName}</td>
                      <td className="td num text-right font-bold text-slate-900">{formatINR(p.amount)}</td>
                      <td className="td">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ background: METHOD_COLORS[p.method] }} />
                          {p.method}
                        </span>
                      </td>
                      <td className="td num text-slate-500">{formatDate(p.date)}</td>
                      <td className="td hidden font-mono text-xs text-slate-500 2xl:table-cell">{p.reference || '—'}</td>
                      <td className="td">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          <CircleCheck className="h-3.5 w-3.5" /> Received
                        </span>
                      </td>
                      <td className="td text-right">
                        <button onClick={() => remove(p)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${p.number}`} title="Remove payment">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-slate-100 border-t border-slate-100 md:hidden">
              {rows.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3.5" onClick={() => navigate(`/invoices/${p.invoiceId}`)}>
                  <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: METHOD_COLORS[p.method] }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{p.customerName}</p>
                    <p className="text-xs text-slate-500">
                      {p.invoiceNumber} · {p.method} · {formatDate(p.date)}
                    </p>
                  </div>
                  <p className="num text-sm font-bold text-emerald-700">+{formatINR(p.amount)}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}
