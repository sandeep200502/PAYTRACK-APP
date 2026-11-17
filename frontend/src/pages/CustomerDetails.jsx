import { useMemo, useState } from 'react';
import { ArrowLeft, Mail, Phone, MapPin, Pencil, Trash2, Plus, Receipt, Wallet, Clock, Gauge, Building2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import StatCard from '../components/StatCard';
import InvoiceTable from '../components/InvoiceTable';
import EmptyState from '../components/EmptyState';
import CustomerFormModal from '../components/CustomerFormModal';
import { Pill } from '../components/StatusBadge';
import { avatarTone } from '../components/CustomerCard';
import { useData } from '../hooks/useData';
import { useRouter } from '../hooks/useRouter';
import { useModals } from '../hooks/useModals';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { customerStats } from '../utils/analytics';
import { formatDate, formatINR, initials } from '../utils/format';

export default function CustomerDetails({ id }) {
  const { customersById, invoices, payments, actions } = useData();
  const { navigate } = useRouter();
  const { openPayment, openReminder } = useModals();
  const confirm = useConfirm();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const c = customersById[id];

  const stats = useMemo(() => (c ? customerStats(c, invoices, payments) : null), [c, invoices, payments]);
  if (!c) return <EmptyState title="Customer not found" action={<Button onClick={() => navigate('/customers')}>Back to customers</Button>} />;

  const own = invoices.filter((i) => i.customerId === c.id);
  const ownPayments = payments.filter((p) => p.customerId === c.id);

  const remove = async () => {
    const ok = await confirm({ title: `Delete ${c.name}?`, message: 'The customer will be removed from your list. This cannot be undone.', confirmLabel: 'Delete Customer' });
    if (!ok) return;
    try {
      await actions.deleteCustomer(c.id);
      toast.success('Customer deleted', `${c.name} was removed.`);
      navigate('/customers');
    } catch (e) {
      toast.error("Can't delete this customer", e.message);
    }
  };

  return (
    <>
      <PageHeader
        back={
          <button onClick={() => navigate('/customers')} className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Customers
          </button>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className={`grid h-11 w-11 place-items-center rounded-xl text-base font-bold ${avatarTone(c.name)}`}>{initials(c.name)}</span>
            {c.name}
            <Pill tone={stats.behaviour.tone}>{stats.behaviour.label}</Pill>
          </span>
        }
        actions={
          <>
            <Button icon={Plus} onClick={() => navigate(`/invoices/new?customer=${c.id}`)}>
              New Invoice
            </Button>
            <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button variant="ghost" icon={Trash2} onClick={remove} aria-label="Delete customer" className="text-red-600 hover:bg-red-50 hover:text-red-700" />
          </>
        }
      />

      <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
        {c.contactPerson && (
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-slate-400" /> {c.contactPerson}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <Mail className="h-4 w-4 text-slate-400" /> {c.email || '—'}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Phone className="h-4 w-4 text-slate-400" /> {c.phone || '—'}
        </span>
        {c.city && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-slate-400" /> {c.city}
          </span>
        )}
        {c.gstin && <span className="text-slate-500">GSTIN {c.gstin}</span>}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Billed" value={formatINR(stats.billed)} icon={Receipt} tone="blue" sub={`${stats.invoiceCount} invoices`} />
        <StatCard label="Total Paid" value={formatINR(stats.paid)} icon={Wallet} tone="green" sub={stats.lastPaymentDate ? `Last paid ${formatDate(stats.lastPaymentDate)}` : 'No payments yet'} />
        <StatCard label="Outstanding" value={formatINR(stats.outstanding)} icon={Clock} tone={stats.overdue ? 'red' : 'amber'} sub={stats.overdue ? `${formatINR(stats.overdue)} overdue` : 'Nothing overdue'} />
        <StatCard label="Payment Behaviour" value={stats.avgDaysToPay !== null ? `${stats.avgDaysToPay} days` : '—'} icon={Gauge} tone="violet" sub={stats.onTimeRate !== null ? `avg. to pay · ${stats.onTimeRate}% on time` : stats.behaviour.note} />
      </div>

      <div className="grid gap-6">
        <section className="card overflow-hidden">
          <header className="px-5 py-4">
            <h2 className="text-[15px] font-bold text-slate-900">Invoices</h2>
          </header>
          {own.length ? (
            <InvoiceTable invoices={own} onOpen={(i) => navigate(`/invoices/${i.id}`)} onPay={(i) => openPayment(i.id)} onRemind={(i) => openReminder(i.id)} onEdit={(i) => navigate(`/invoices/${i.id}/edit`)} />
          ) : (
            <EmptyState compact icon={Receipt} title="No invoices yet" action={<Button icon={Plus} onClick={() => navigate(`/invoices/new?customer=${c.id}`)}>Create Invoice</Button>} />
          )}
        </section>

        <section className="card overflow-hidden">
          <header className="px-5 py-4">
            <h2 className="text-[15px] font-bold text-slate-900">Payment History</h2>
            <p className="text-xs text-slate-500">{stats.behaviour.note}</p>
          </header>
          {ownPayments.length ? (
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {ownPayments.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{p.invoiceNumber}</p>
                    <p className="truncate text-xs text-slate-500">
                      {formatDate(p.date)} · {p.method}
                      {p.reference ? ` · ${p.reference}` : ''}
                    </p>
                  </div>
                  <p className="num text-sm font-bold text-emerald-700">+{formatINR(p.amount)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState compact icon={Wallet} title="No payments recorded" />
          )}
        </section>
      </div>

      {editing && <CustomerFormModal customer={c} onClose={() => setEditing(false)} />}
    </>
  );
}
