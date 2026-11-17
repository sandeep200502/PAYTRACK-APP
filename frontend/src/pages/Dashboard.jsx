import { useMemo } from 'react';
import { IndianRupee, Clock, CircleAlert, CircleCheck, FileText, TriangleAlert, ChevronRight, Plus, Wallet, CalendarClock, Banknote, CreditCard, Landmark, Smartphone } from 'lucide-react';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import InsightsPanel from '../components/InsightsPanel';
import InvoiceTable from '../components/InvoiceTable';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { RevenueChart, StatusDonut, CashFlowChart } from '../components/Charts';
import { useData } from '../hooks/useData';
import { useRouter } from '../hooks/useRouter';
import { useModals } from '../hooks/useModals';
import { cashFlow, computeKpis, generateInsights, monthlySeries, statusDistribution } from '../utils/analytics';
import { formatDate, formatINR, pluralize } from '../utils/format';

const METHOD_ICON = { UPI: Smartphone, Cash: Banknote, 'Bank Transfer': Landmark, Card: CreditCard };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
}

export default function Dashboard() {
  const { invoices, payments, customers, settings, today } = useData();
  const { navigate } = useRouter();
  const { openPayment, openReminder } = useModals();

  const k = useMemo(() => computeKpis(invoices, payments, today), [invoices, payments, today]);
  const series = useMemo(() => monthlySeries(invoices, payments, 6, today), [invoices, payments, today]);
  const dist = useMemo(() => statusDistribution(invoices), [invoices]);
  const cf = useMemo(() => cashFlow(invoices, today), [invoices, today]);
  const insights = useMemo(() => generateInsights({ invoices, payments, customers }, today), [invoices, payments, customers, today]);
  const trend = k.paidLastMonth ? Math.round(((k.paidThisMonth - k.paidLastMonth) / k.paidLastMonth) * 100) : null;

  const overdue = invoices.filter((i) => i.status === 'overdue').sort((a, b) => b.daysOverdue - a.daysOverdue);
  const upcoming = invoices.filter((i) => (i.status === 'pending' || i.status === 'partial') && i.daysToDue >= 0).sort((a, b) => a.daysToDue - b.daysToDue).slice(0, 5);
  const firstName = (settings.ownerName || 'there').split(' ')[0];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {greeting()}, {firstName} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Here's your business payment overview.</p>
        </div>
        <div className="flex gap-2 sm:hidden">
          <Button variant="secondary" icon={Wallet} onClick={() => openPayment()}>
            Record Payment
          </Button>
          <Button icon={Plus} onClick={() => navigate('/invoices/new')}>
            New Invoice
          </Button>
        </div>
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <button onClick={() => navigate('/overdue')} className="group flex w-full items-center gap-3 rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-left transition hover:border-red-300 hover:bg-red-50 sm:px-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-600 text-white">
            <TriangleAlert className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-red-900">{pluralize(overdue.length, 'invoice')} need your attention</span>
            <span className="block truncate text-[13px] text-red-800/80">
              {formatINR(k.overdue)} overdue · oldest is {overdue[0].customerName}, {overdue[0].daysOverdue} days late
            </span>
          </span>
          <span className="hidden items-center gap-1 text-sm font-semibold text-red-700 sm:flex">
            Review <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </button>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total Revenue" value={formatINR(k.totalRevenue)} icon={IndianRupee} tone="blue" sub={`${k.collectionRate}% of billed collected`} onClick={() => navigate('/payments')} />
        <StatCard label="Pending Amount" value={formatINR(k.pending)} icon={Clock} tone="amber" sub="Not yet due" onClick={() => navigate('/invoices?status=pending')} />
        <StatCard label="Overdue Amount" value={formatINR(k.overdue)} icon={CircleAlert} tone="red" sub={pluralize(k.overdueCount, 'invoice')} onClick={() => navigate('/overdue')} />
        <StatCard label="Paid This Month" value={formatINR(k.paidThisMonth)} icon={CircleCheck} tone="green" trend={trend} sub="vs last month" onClick={() => navigate('/payments')} />
        <div className="col-span-2 lg:col-span-1">
          <StatCard label="Active Invoices" value={k.activeInvoices} icon={FileText} tone="violet" sub={`${formatINR(k.outstanding)} outstanding`} onClick={() => navigate('/invoices')} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Revenue Overview" subtitle="Collected vs invoiced, last 6 months">
          <RevenueChart data={series} />
        </ChartCard>
        <ChartCard title="Payment Status" subtitle="All issued invoices">
          <StatusDonut data={dist} height={170} />
        </ChartCard>
      </div>

      {/* Insights + cash flow */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <InsightsPanel insights={insights} limit={6} />
        </div>
        <ChartCard className="lg:col-span-2" title="Expected Cash Flow" subtitle="Money you can expect, by due date" action={<button onClick={() => navigate('/reports')} className="text-xs font-semibold text-brand-600 hover:underline">Details</button>}>
          <div className="num mb-4 grid grid-cols-2 gap-2">
            {[
              ['This week', cf.thisWeek, 'text-blue-700'],
              ['Next week', cf.nextWeek, 'text-blue-500'],
              ['Overdue', cf.overdue, 'text-red-600'],
              ['Total expected', cf.total, 'text-slate-900'],
            ].map(([l, v, c]) => (
              <div key={l} className="rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-[11px] font-medium text-slate-500">{l}</p>
                <p className={`text-[15px] font-bold ${c}`}>{formatINR(v)}</p>
              </div>
            ))}
          </div>
          <CashFlowChart data={cf.chart} height={170} />
        </ChartCard>
      </div>

      {/* Tables */}
      <div className="grid gap-4 2xl:grid-cols-3">
        <section className="card overflow-hidden 2xl:col-span-2">
          <header className="flex items-center justify-between px-5 py-4">
            <h2 className="text-[15px] font-bold text-slate-900">Recent Invoices</h2>
            <button onClick={() => navigate('/invoices')} className="text-sm font-semibold text-brand-600 hover:underline">
              View all
            </button>
          </header>
          {invoices.length ? (
            <InvoiceTable
              variant="compact"
              invoices={invoices.slice(0, 6)}
              onOpen={(i) => navigate(`/invoices/${i.id}`)}
              onPay={(i) => openPayment(i.id)}
              onRemind={(i) => openReminder(i.id)}
            />
          ) : (
            <EmptyState icon={FileText} title="No invoices yet" message="Create your first invoice to start tracking payments." action={<Button icon={Plus} onClick={() => navigate('/invoices/new')}>Create Invoice</Button>} />
          )}
        </section>

        <div className="grid content-start gap-4 md:grid-cols-2 2xl:grid-cols-1">
          <section className="card overflow-hidden">
            <header className="flex items-center justify-between px-5 py-4">
              <h2 className="text-[15px] font-bold text-slate-900">Upcoming Payments</h2>
              <CalendarClock className="h-4 w-4 text-slate-400" />
            </header>
            {upcoming.length ? (
              <ul className="divide-y divide-slate-100 border-t border-slate-100">
                {upcoming.map((i) => (
                  <li key={i.id}>
                    <button onClick={() => navigate(`/invoices/${i.id}`)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-slate-50">
                      <div className={`w-12 shrink-0 rounded-lg py-1 text-center ${i.daysToDue <= 3 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-600'}`}>
                        <p className="num text-sm font-bold leading-tight">{i.daysToDue === 0 ? 'Today' : `${i.daysToDue}d`}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{i.customerName}</p>
                        <p className="text-xs text-slate-500">
                          {i.number} · {formatDate(i.dueDate)}
                        </p>
                      </div>
                      <p className="num text-sm font-bold text-slate-900">{formatINR(i.balance)}</p>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact icon={CalendarClock} title="Nothing due soon" />
            )}
          </section>

          <section className="card overflow-hidden">
            <header className="flex items-center justify-between px-5 py-4">
              <h2 className="text-[15px] font-bold text-slate-900">Recent Payments</h2>
              <button onClick={() => navigate('/payments')} className="text-sm font-semibold text-brand-600 hover:underline">
                View all
              </button>
            </header>
            {payments.length ? (
              <ul className="divide-y divide-slate-100 border-t border-slate-100">
                {payments.slice(0, 5).map((p) => {
                  const Icon = METHOD_ICON[p.method] || Wallet;
                  return (
                    <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{p.customerName}</p>
                        <p className="text-xs text-slate-500">
                          {p.method} · {formatDate(p.date)}
                        </p>
                      </div>
                      <p className="num text-sm font-bold text-emerald-700">+{formatINR(p.amount)}</p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState compact icon={Wallet} title="No payments yet" />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

