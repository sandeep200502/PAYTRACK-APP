import { useMemo } from 'react';
import { CircleAlert, Hourglass, Users, Send, Wallet, PartyPopper, Info } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { AgingChart } from '../components/Charts';
import { useData } from '../hooks/useData';
import { useRouter } from '../hooks/useRouter';
import { useModals } from '../hooks/useModals';
import { agingBuckets } from '../utils/analytics';
import { formatDate, formatINR } from '../utils/format';

const severity = (d) => (d > 60 ? 'bg-red-900' : d > 30 ? 'bg-red-600' : d > 7 ? 'bg-orange-500' : 'bg-amber-400');

export default function Overdue() {
  const { invoices, reminders, today } = useData();
  const { navigate } = useRouter();
  const { openPayment, openReminder } = useModals();

  const overdue = useMemo(() => invoices.filter((i) => i.status === 'overdue').sort((a, b) => b.daysOverdue - a.daysOverdue), [invoices]);
  const aging = useMemo(() => agingBuckets(invoices), [invoices]);
  const total = overdue.reduce((s, i) => s + i.balance, 0);
  const avgDays = overdue.length ? Math.round(overdue.reduce((s, i) => s + i.daysOverdue, 0) / overdue.length) : 0;
  const customersAffected = new Set(overdue.map((i) => i.customerId)).size;
  const lastReminder = (id) => reminders.find((r) => r.invoiceId === id);

  return (
    <>
      <PageHeader title="Overdue" subtitle={`Detected automatically: due date has passed and a balance is still owed. Checked against today, ${formatDate(today)}.`} />

      {overdue.length === 0 ? (
        <div className="card">
          <EmptyState icon={PartyPopper} title="No overdue invoices" message="Every customer is within their payment terms. PayTrack will flag an invoice here the day after its due date if it isn't fully paid." />
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Total Overdue" value={formatINR(total)} icon={CircleAlert} tone="red" sub={`${overdue.length} invoices`} />
            <StatCard label="Average Delay" value={`${avgDays} days`} icon={Hourglass} tone="amber" sub="past due date" />
            <StatCard label="Oldest Due" value={`${overdue[0].daysOverdue} days`} icon={Hourglass} tone="red" sub={overdue[0].customerName} />
            <StatCard label="Customers Affected" value={customersAffected} icon={Users} tone="slate" />
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-5">
            <ChartCard className="lg:col-span-3" title="Payment Aging" subtitle="Overdue balance by how late it is. Older = harder to collect.">
              <AgingChart data={aging} height={210} />
            </ChartCard>
            <div className="grid grid-cols-2 gap-3 lg:col-span-2">
              {aging.map((b) => (
                <div key={b.key} className="card p-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: b.color }} />
                    <span className="text-[13px] font-semibold text-slate-700">{b.label}</span>
                  </div>
                  <p className="num mt-2 text-lg font-bold text-slate-900">{formatINR(b.amount)}</p>
                  <p className="text-xs text-slate-500">
                    {b.count} invoice{b.count === 1 ? '' : 's'} · <span className={b.risk === 'Low' ? 'text-amber-700' : 'font-semibold text-red-600'}>{b.risk} risk</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <section className="card overflow-hidden">
            <header className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
              <h2 className="text-[15px] font-bold text-slate-900">Overdue invoices</h2>
              <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <Info className="h-3.5 w-3.5" /> Sorted by most days overdue
              </p>
            </header>
            <div className="scrollbar-thin hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="border-y border-slate-100 bg-slate-50/60">
                  <tr>
                    {['Customer', 'Invoice', 'Amount due', 'Due date', 'Days overdue', 'Last reminder', 'Status', 'Action'].map((h) => (
                      <th key={h} className={`th ${h === 'Amount due' || h === 'Action' ? 'text-right' : ''} ${h === 'Last reminder' ? 'hidden 2xl:table-cell' : ''} ${h === 'Due date' ? 'hidden xl:table-cell' : ''}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overdue.map((i) => {
                    const r = lastReminder(i.id);
                    return (
                      <tr key={i.id} className="hover:bg-slate-50/80">
                        <td className="td">
                          <button onClick={() => navigate(`/customers/${i.customerId}`)} className="font-semibold text-slate-900 hover:text-brand-700">
                            {i.customerName}
                          </button>
                        </td>
                        <td className="td">
                          <button onClick={() => navigate(`/invoices/${i.id}`)} className="font-semibold text-brand-600 hover:underline">
                            {i.number}
                          </button>
                        </td>
                        <td className="td num text-right font-bold text-slate-900">{formatINR(i.balance)}</td>
                        <td className="td num hidden text-slate-500 xl:table-cell">{formatDate(i.dueDate)}</td>
                        <td className="td">
                          <div className="flex items-center gap-2.5">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                              <div className={`h-full rounded-full ${severity(i.daysOverdue)}`} style={{ width: `${Math.min(100, (i.daysOverdue / 60) * 100)}%` }} />
                            </div>
                            <span className="num font-semibold text-red-600">{i.daysOverdue} days</span>
                          </div>
                        </td>
                        <td className="td hidden text-xs text-slate-500 2xl:table-cell">{r ? <>{formatDate(r.date)}<br />{r.channel}</> : <span className="font-semibold text-amber-700">Never reminded</span>}</td>
                        <td className="td">
                          <StatusBadge status={i.status} />
                        </td>
                        <td className="td text-right">
                          <div className="inline-flex gap-1.5">
                            <Button size="sm" variant="secondary" icon={Wallet} onClick={() => openPayment(i.id)} aria-label={`Record payment for ${i.number}`} title="Record payment" />
                            <Button size="sm" icon={Send} onClick={() => openReminder(i.id)}>
                              Remind
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-slate-100 border-t border-slate-100 md:hidden">
              {overdue.map((i) => (
                <li key={i.id} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3" onClick={() => navigate(`/invoices/${i.id}`)}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{i.customerName}</p>
                      <p className="text-xs text-slate-500">
                        {i.number} · Due {formatDate(i.dueDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="num text-sm font-bold text-slate-900">{formatINR(i.balance)}</p>
                      <p className="text-xs font-semibold text-red-600">{i.daysOverdue} days overdue</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button size="sm" variant="secondary" icon={Wallet} onClick={() => openPayment(i.id)}>
                      Payment
                    </Button>
                    <Button size="sm" icon={Send} onClick={() => openReminder(i.id)}>
                      Remind
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}
