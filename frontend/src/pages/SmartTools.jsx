import { useCallback, useEffect, useState } from 'react';
import { Wand2, Search, Copy, Printer, MessageSquareText, Download, Server, ExternalLink, FileText } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { useToast } from '../hooks/useToast';
import { extras, extrasAvailable } from '../services/extras';
import { formatINR, formatINRPrecise } from '../utils/format';

const STATUSES = ['Draft', 'Unpaid', 'Partially Paid', 'Overdue', 'Paid'];
const STATUS_CLS = {
  Paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'Partially Paid': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  Unpaid: 'bg-amber-50 text-amber-800 ring-amber-600/25',
  Overdue: 'bg-red-50 text-red-700 ring-red-600/20',
  Draft: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

function Pill({ status }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_CLS[status] || STATUS_CLS.Draft}`}>{status}</span>;
}

export default function SmartTools() {
  const toast = useToast();
  const [dash, setDash] = useState(null);
  const [chase, setChase] = useState([]);
  const [results, setResults] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');

  const run = useCallback(async (fn) => {
    try {
      setError('');
      await fn();
    } catch (e) {
      setError(e.message);
      toast.error('Smart Tools', e.message);
    }
  }, [toast]);

  const search = useCallback(() => run(async () => setResults(await extras.search({ q, status }))), [run, q, status]);

  useEffect(() => {
    if (!extrasAvailable) return;
    run(async () => {
      setDash(await extras.dashboard());
      setChase(await extras.suggestions());
    });
    run(async () => setResults(await extras.search({})));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!extrasAvailable) {
    return (
      <>
        <PageHeader title="Smart Tools" subtitle="Extra features served by the Spring Boot backend." />
        <div className="card">
          <EmptyState
            icon={Server}
            title="Backend not connected"
            message="Start the Spring Boot API (mvn spring-boot:run) and run the app with VITE_API_URL=http://localhost:4000/api npm run dev."
          />
        </div>
      </>
    );
  }

  const writeReminder = (s) => run(async () => setMessage(await extras.reminderMessage(s.invoice.invoiceId, s.suggestedChannel)));
  const copyUpi = (id) => run(async () => {
    const u = await extras.upiLink(id);
    try {
      await navigator.clipboard.writeText(u.link);
      toast.success('UPI link copied', `${u.invoiceNumber}, ${formatINRPrecise(u.amount)}`);
    } catch {
      toast.info('UPI link', u.link);
    }
  });

  return (
    <>
      <PageHeader
        title="Smart Tools"
        subtitle="Server-side dashboard, reminder text, UPI links, printable invoices and exports from the Spring Boot API."
        actions={
          <>
            <a className="btn btn-secondary" href={extras.invoicesCsvUrl()}><Download className="h-4 w-4" />Invoices CSV</a>
            <a className="btn btn-secondary" href={extras.paymentsCsvUrl()}><Download className="h-4 w-4" />Payments CSV</a>
          </>
        }
      />
      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {dash && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            <StatCard label="Invoiced" value={formatINR(dash.totalInvoiced)} tone="blue" />
            <StatCard label="Collected" value={formatINR(dash.totalCollected)} tone="green" />
            <StatCard label="Outstanding" value={formatINR(dash.outstanding)} tone="amber" />
            <StatCard label="Overdue" value={formatINR(dash.overdueAmount)} tone="red" />
            <StatCard label="Collection rate" value={`${dash.collectionRatePercent}%`} tone="violet" />
          </div>
          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <ChartCard title="Unpaid money by age" subtitle="Calculated by the backend">
              <ul className="divide-y divide-slate-100 text-sm">
                {Object.entries(dash.agingBuckets).map(([k, v]) => (
                  <li key={k} className="flex justify-between py-2"><span className="text-slate-600">{k}</span><span className="num font-semibold">{formatINR(v)}</span></li>
                ))}
              </ul>
            </ChartCard>
            <ChartCard title="Top debtors" subtitle="Who owes the most">
              <ul className="divide-y divide-slate-100 text-sm">
                {dash.topOutstandingCustomers.map((c) => (
                  <li key={c.customerId} className="flex justify-between py-2"><span className="text-slate-600">{c.customerName}</span><span className="num font-semibold">{formatINR(c.outstanding)}</span></li>
                ))}
              </ul>
            </ChartCard>
          </div>
        </>
      )}

      <ChartCard className="mb-6" title="Chase these payments" subtitle="Tone and channel are chosen from how late the invoice is.">
        {chase.length === 0 ? (
          <EmptyState compact icon={Wand2} title="Nothing to chase" message="No invoice is overdue." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <tbody className="divide-y divide-slate-100">
                {chase.map((s) => (
                  <tr key={s.invoice.invoiceId}>
                    <td className="py-2 pr-3 font-semibold">{s.invoice.number}</td>
                    <td className="py-2 pr-3">{s.invoice.customerName}</td>
                    <td className="num py-2 pr-3">{formatINR(s.invoice.balance)}</td>
                    <td className="py-2 pr-3">{s.invoice.daysOverdue} days</td>
                    <td className="py-2 pr-3 capitalize">{s.suggestedTone}{s.reminderDue ? '' : ' (reminded recently)'}</td>
                    <td className="py-2">
                      <div className="flex gap-1.5 whitespace-nowrap">
                        <Button size="sm" variant="secondary" icon={MessageSquareText} onClick={() => writeReminder(s)}>Reminder</Button>
                        <Button size="sm" variant="secondary" icon={Copy} onClick={() => copyUpi(s.invoice.invoiceId)}>UPI link</Button>
                        <a className="btn btn-secondary btn-sm" href={extras.printUrl(s.invoice.invoiceId)} target="_blank" rel="noreferrer"><Printer className="h-3.5 w-3.5" />Print</a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {message && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{message.channel}, {message.tone} tone</p>
            <textarea readOnly rows={9} value={message.body} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm" />
            <div className="mt-2">
              {message.link ? (
                <a className="btn btn-primary btn-sm" href={message.link} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" />Open {message.channel}</a>
              ) : (
                <span className="text-sm text-slate-500">No {message.channel === 'Email' ? 'email address' : 'phone number'} saved for this customer.</span>
              )}
            </div>
          </div>
        )}
      </ChartCard>

      <ChartCard title="Find invoices" subtitle="Search and filter handled by the backend">
        <div className="mb-3 flex flex-wrap gap-2">
          <input className="min-w-[180px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Invoice number or customer" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} />
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <Button icon={Search} onClick={search}>Search</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <tbody className="divide-y divide-slate-100">
              {results.map((r) => (
                <tr key={r.invoiceId}>
                  <td className="py-2 pr-3 font-semibold"><FileText className="mr-1 inline h-3.5 w-3.5 text-slate-400" />{r.number}</td>
                  <td className="py-2 pr-3">{r.customerName}</td>
                  <td className="num py-2 pr-3">{formatINR(r.total)}</td>
                  <td className="num py-2 pr-3">{formatINR(r.balance)} due</td>
                  <td className="py-2"><Pill status={r.status} /></td>
                </tr>
              ))}
              {results.length === 0 && <tr><td className="py-6 text-center text-slate-500">No invoices match.</td></tr>}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </>
  );
}
