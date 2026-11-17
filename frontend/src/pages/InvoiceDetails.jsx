import { ArrowLeft, Pencil, Printer, Send, Trash2, Wallet, FilePlus2, CircleCheck, Bell, Trash, UserRound, ChevronRight } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import InvoiceDocument from '../components/InvoiceDocument';
import EmptyState from '../components/EmptyState';
import { useData } from '../hooks/useData';
import { useRouter } from '../hooks/useRouter';
import { useModals } from '../hooks/useModals';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { formatDate, formatINR } from '../utils/format';

export default function InvoiceDetails({ id }) {
  const { invoicesById, customersById, payments, reminders, settings, actions } = useData();
  const { navigate } = useRouter();
  const { openPayment, openReminder } = useModals();
  const confirm = useConfirm();
  const toast = useToast();
  const inv = invoicesById[id];

  if (!inv) {
    return <EmptyState title="Invoice not found" message="It may have been deleted." action={<Button onClick={() => navigate('/invoices')}>Back to invoices</Button>} />;
  }

  const customer = customersById[inv.customerId];
  const own = payments.filter((p) => p.invoiceId === inv.id);
  const ownReminders = reminders.filter((r) => r.invoiceId === inv.id);
  const pct = inv.total ? Math.min(100, Math.round((inv.paid / inv.total) * 100)) : 0;
  const isOpen = inv.status !== 'paid' && inv.status !== 'draft';

  const timeline = [
    { id: 'c', date: inv.issueDate, icon: FilePlus2, tone: 'bg-slate-100 text-slate-600', title: inv.isDraft ? 'Draft created' : 'Invoice issued', detail: formatINR(inv.total) },
    ...own.map((p) => ({ id: p.id, date: p.date, icon: CircleCheck, tone: 'bg-emerald-50 text-emerald-600', title: `${formatINR(p.amount)} received`, detail: `${p.method}${p.reference ? ` · ${p.reference}` : ''}`, payment: p })),
    ...ownReminders.map((r) => ({ id: r.id, date: r.date, icon: Bell, tone: 'bg-amber-50 text-amber-600', title: 'Reminder sent', detail: `${r.channel} · ${r.tone} tone` })),
  ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const removeInvoice = async () => {
    const ok = await confirm({ title: `Delete ${inv.number}?`, message: `This removes the invoice and ${own.length} recorded payment${own.length === 1 ? '' : 's'}. This cannot be undone.`, confirmLabel: 'Delete Invoice' });
    if (!ok) return;
    await actions.deleteInvoice(inv.id);
    toast.success('Invoice deleted', `${inv.number} was removed.`);
    navigate('/invoices');
  };

  const removePayment = async (p) => {
    const ok = await confirm({ title: 'Remove this payment?', message: `${formatINR(p.amount)} via ${p.method} on ${formatDate(p.date)} will be removed and the balance will go back up. Use this only to fix a mistake.`, confirmLabel: 'Remove Payment' });
    if (!ok) return;
    await actions.deletePayment(p.id);
    toast.success('Payment removed', `Balance on ${inv.number} updated.`);
  };

  const issue = async () => {
    await actions.issueDraft(inv.id);
    toast.success('Invoice issued', `${inv.number} is now active and being tracked.`);
  };

  return (
    <>
      <PageHeader
        back={
          <button onClick={() => navigate('/invoices')} className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Invoices
          </button>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            {inv.number} <StatusBadge status={inv.status} size="lg" />
          </span>
        }
        subtitle={`${inv.customerName} · Issued ${formatDate(inv.issueDate)} · Due ${formatDate(inv.dueDate)}`}
        actions={
          <>
            {inv.isDraft && (
              <Button icon={Send} onClick={issue}>
                Issue Invoice
              </Button>
            )}
            {isOpen && (
              <Button variant="success" icon={Wallet} onClick={() => openPayment(inv.id)}>
                Record Payment
              </Button>
            )}
            {isOpen && (
              <Button variant="secondary" icon={Send} onClick={() => openReminder(inv.id)}>
                Send Reminder
              </Button>
            )}
            <Button variant="secondary" icon={Pencil} onClick={() => navigate(`/invoices/${inv.id}/edit`)}>
              Edit
            </Button>
            <Button variant="secondary" icon={Printer} onClick={() => window.print()}>
              Print / PDF
            </Button>
            <Button variant="ghost" icon={Trash2} onClick={removeInvoice} aria-label="Delete invoice" className="text-red-600 hover:bg-red-50 hover:text-red-700" />
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <InvoiceDocument invoice={inv} customer={customer} settings={settings} />

        <aside className="no-print space-y-4">
          <section className="card p-5">
            <p className="eyebrow">Payment progress</p>
            <div className="num mt-3 flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatINR(inv.paid)}</p>
                <p className="text-xs text-slate-500">of {formatINR(inv.total)} received</p>
              </div>
              <p className="text-sm font-bold text-slate-700">{pct}%</p>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full transition-all duration-500 ${inv.status === 'overdue' ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
            </div>
            <dl className="num mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs text-slate-500">Remaining balance</dt>
                <dd className="mt-0.5 font-bold text-slate-900">{formatINR(inv.balance)}</dd>
              </div>
              <div className={`rounded-xl p-3 ${inv.status === 'overdue' ? 'bg-red-50' : 'bg-slate-50'}`}>
                <dt className="text-xs text-slate-500">{inv.status === 'overdue' ? 'Overdue by' : inv.status === 'paid' ? 'Settled on' : 'Due in'}</dt>
                <dd className={`mt-0.5 font-bold ${inv.status === 'overdue' ? 'text-red-600' : 'text-slate-900'}`}>
                  {inv.status === 'overdue' ? `${inv.daysOverdue} days` : inv.status === 'paid' ? formatDate(inv.paidOnDate) : inv.status === 'draft' ? '—' : inv.daysToDue === 0 ? 'Today' : `${inv.daysToDue} days`}
                </dd>
              </div>
            </dl>
          </section>

          {customer && (
            <button onClick={() => navigate(`/customers/${customer.id}`)} className="card flex w-full items-center gap-3 p-4 text-left transition hover:border-slate-300">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <UserRound className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900">{customer.name}</span>
                <span className="block text-xs text-slate-500">View payment history</span>
              </span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          )}

          <section className="card p-5">
            <p className="eyebrow mb-4">Activity</p>
            <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-4 before:top-2 before:w-px before:bg-slate-200">
              {timeline.map((t) => (
                <li key={t.id} className="relative flex items-start gap-3">
                  <span className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full ring-4 ring-white ${t.tone}`}>
                    <t.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                    <p className="truncate text-xs text-slate-500">
                      {formatDate(t.date)} · {t.detail}
                    </p>
                  </div>
                  {t.payment && (
                    <button onClick={() => removePayment(t.payment)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-600" aria-label="Remove payment" title="Remove payment">
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </>
  );
}
