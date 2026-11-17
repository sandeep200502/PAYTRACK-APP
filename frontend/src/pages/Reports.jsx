import { useMemo, useState } from 'react';
import { Download, Receipt, IndianRupee, Percent, Clock, CircleAlert } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import Button from '../components/Button';
import InsightsPanel from '../components/InsightsPanel';
import { Pill } from '../components/StatusBadge';
import { InvoicedVsCollected, StatusDonut, MethodsChart, TopCustomersChart, CashFlowChart, AgingChart } from '../components/Charts';
import { Select } from '../components/FormField';
import { useData } from '../hooks/useData';
import { useRouter } from '../hooks/useRouter';
import { useToast } from '../hooks/useToast';
import { agingBuckets, cashFlow, computeKpis, customerStats, generateInsights, monthlySeries, paymentMethodBreakdown, STATUS_COLORS, statusDistribution, topCustomers } from '../utils/analytics';
import { formatINR, todayISO } from '../utils/format';
import { STATUS_LABEL } from '../utils/invoiceCalc';

function exportCsv(invoices) {
  const header = ['Invoice', 'Customer', 'Issue date', 'Due date', 'Total', 'Paid', 'Balance', 'Status', 'Days overdue'];
  const lines = invoices.map((i) => [i.number, i.customerName, i.issueDate, i.dueDate, i.total, i.paid, i.balance, STATUS_LABEL[i.status], i.daysOverdue || 0]);
  const csv = [header, ...lines].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: `paytrack-invoices-${todayISO()}.csv` });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Reports() {
  const { invoices, payments, customers, today } = useData();
  const { navigate } = useRouter();
  const toast = useToast();
  const [months, setMonths] = useState(6);

  const k = useMemo(() => computeKpis(invoices, payments, today), [invoices, payments, today]);
  const series = useMemo(() => monthlySeries(invoices, payments, months, today), [invoices, payments, months, today]);
  const dist = useMemo(() => statusDistribution(invoices, { includeDraft: true }), [invoices]);
  const methods = useMemo(() => paymentMethodBreakdown(payments), [payments]);
  const tops = useMemo(() => topCustomers(customers, invoices, payments, 6), [customers, invoices, payments]);
  const cf = useMemo(() => cashFlow(invoices, today), [invoices, today]);
  const aging = useMemo(() => agingBuckets(invoices), [invoices]);
  const insights = useMemo(() => generateInsights({ invoices, payments, customers }, today), [invoices, payments, customers, today]);
  const behaviour = useMemo(
    () => customers.map((c) => ({ c, s: customerStats(c, invoices, payments) })).filter((x) => x.s.invoiceCount > 0).sort((a, b) => b.s.overdue - a.s.overdue || b.s.outstanding - a.s.outstanding),
    [customers, invoices, payments],
  );

  const periodCollected = series.reduce((s, m) => s + m.collected, 0);
  const periodInvoiced = series.reduce((s, m) => s + m.invoiced, 0);
  const paidVsPending = [
    { label: 'Paid', value: k.totalRevenue, color: STATUS_COLORS.paid },
    { label: 'Pending', value: k.pending, color: STATUS_COLORS.pending },
    { label: 'Overdue', value: k.overdue, color: STATUS_COLORS.overdue },
  ];
  const pvpTotal = paidVsPending.reduce((s, x) => s + x.value, 0) || 1;

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Revenue, collections and customer payment analytics, calculated from your live data."
        actions={
          <>
            <Select aria-label="Report period" value={months} onChange={(e) => setMonths(Number(e.target.value))} className="w-44">
              <option value={3}>Last 3 months</option>
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
            </Select>
            <Button
              variant="secondary"
              icon={Download}
              onClick={() => {
                exportCsv(invoices);
                toast.success('Export started', `${invoices.length} invoices exported as CSV.`);
              }}
            >
              Export CSV
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatCard label={`Invoiced (${months}m)`} value={formatINR(periodInvoiced)} icon={Receipt} tone="blue" />
        <StatCard label={`Collected (${months}m)`} value={formatINR(periodCollected)} icon={IndianRupee} tone="green" />
        <StatCard label="Collection Rate" value={`${k.collectionRate}%`} icon={Percent} tone="violet" sub="all time" />
        <StatCard label="Outstanding" value={formatINR(k.outstanding)} icon={Clock} tone="amber" />
        <div className="col-span-2 lg:col-span-1">
          <StatCard label="Overdue" value={formatINR(k.overdue)} icon={CircleAlert} tone="red" sub={`${k.overdueCount} invoices`} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Revenue by Month" subtitle="Invoiced vs collected">
          <InvoicedVsCollected data={series} />
        </ChartCard>
        <ChartCard title="Invoice Status Distribution" subtitle="Count of invoices, balance shown on the right">
          <StatusDonut data={dist} height={160} />
        </ChartCard>

        <ChartCard title="Paid vs Pending" subtitle="Where all billed money stands today">
          <div className="flex h-4 overflow-hidden rounded-full bg-slate-100">
            {paidVsPending.map((x) => (
              <div key={x.label} style={{ width: `${(x.value / pvpTotal) * 100}%`, background: x.color }} className="border-r-2 border-white last:border-0" title={`${x.label}: ${formatINR(x.value)}`} />
            ))}
          </div>
          <ul className="mt-5 space-y-3">
            {paidVsPending.map((x) => (
              <li key={x.label} className="flex items-center gap-2.5 text-sm">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: x.color }} />
                <span className="text-slate-600">{x.label}</span>
                <span className="num ml-auto font-bold text-slate-900">{formatINR(x.value)}</span>
                <span className="num w-10 text-right text-xs text-slate-500">{Math.round((x.value / pvpTotal) * 100)}%</span>
              </li>
            ))}
          </ul>
        </ChartCard>
        <ChartCard title="Expected Cash Flow" subtitle={`${formatINR(cf.total)} still to come in`}>
          <CashFlowChart data={cf.chart} height={190} />
        </ChartCard>
        <ChartCard title="Overdue Aging" subtitle={`${formatINR(k.overdue)} overdue in total`}>
          <AgingChart data={aging} height={190} />
        </ChartCard>

        <ChartCard className="lg:col-span-2" title="Top Customers" subtitle="By total billed, split into paid and outstanding">
          <TopCustomersChart data={tops} />
        </ChartCard>
        <ChartCard title="Payment Methods" subtitle="How customers pay you">
          <MethodsChart data={methods} height={150} />
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 2xl:grid-cols-5">
        <section className="card overflow-hidden 2xl:col-span-3">
          <header className="px-5 py-4">
            <h2 className="text-[15px] font-bold text-slate-900">Customer Payment Behaviour</h2>
            <p className="text-[13px] text-slate-500">Learned from each customer's payment history</p>
          </header>
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full">
              <thead className="border-y border-slate-100 bg-slate-50/60">
                <tr>
                  <th className="th">Customer</th>
                  <th className="th text-right">Billed</th>
                  <th className="th text-right">Outstanding</th>
                  <th className="th text-right">Avg. days</th>
                  <th className="th text-right">On time</th>
                  <th className="th">Behaviour</th>
                </tr>
              </thead>
              <tbody className="num divide-y divide-slate-100">
                {behaviour.map(({ c, s }) => (
                  <tr key={c.id} className="cursor-pointer hover:bg-slate-50/80" onClick={() => navigate(`/customers/${c.id}`)}>
                    <td className="td font-semibold text-slate-900">{c.name}</td>
                    <td className="td text-right">{formatINR(s.billed)}</td>
                    <td className={`td text-right font-semibold ${s.overdue ? 'text-red-600' : 'text-slate-900'}`}>{formatINR(s.outstanding)}</td>
                    <td className="td text-right">{s.avgDaysToPay ?? '—'}</td>
                    <td className="td text-right">{s.onTimeRate !== null ? `${s.onTimeRate}%` : '—'}</td>
                    <td className="td">
                      <Pill tone={s.behaviour.tone}>{s.behaviour.label}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <div className="2xl:col-span-2">
          <InsightsPanel insights={insights} />
        </div>
      </div>
    </>
  );
}
