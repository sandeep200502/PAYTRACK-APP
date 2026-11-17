import { ArrowLeft } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import InvoiceForm, { blankItem } from '../components/InvoiceForm';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { useData } from '../hooks/useData';
import { useRouter } from '../hooks/useRouter';
import { useToast } from '../hooks/useToast';
import { calcTotals, nextInvoiceNumber } from '../utils/invoiceCalc';
import { addDays, formatINR, todayISO } from '../utils/format';

/** Route: /invoices/new  and  /invoices/:id/edit */
export default function InvoiceEditor({ id }) {
  const { invoicesById, rawInvoices, customers, settings, actions } = useData();
  const { navigate, query } = useRouter();
  const toast = useToast();
  const existing = id ? invoicesById[id] : null;

  if (id && !existing) {
    return <EmptyState title="Invoice not found" message="It may have been deleted." action={<Button onClick={() => navigate('/invoices')}>Back to invoices</Button>} />;
  }

  const preset = customers.find((c) => c.id === query.customer);
  const initial = existing
    ? {
        id: existing.id,
        number: existing.number,
        customerId: existing.customerId,
        customerName: existing.customerName,
        customerEmail: existing.customerEmail,
        customerPhone: existing.customerPhone,
        issueDate: existing.issueDate,
        dueDate: existing.dueDate,
        items: existing.items.map((it) => ({ ...it })),
        discountType: existing.discountType,
        discountValue: existing.discountValue,
        taxRate: existing.taxRate,
        notes: existing.notes || '',
        isDraft: existing.isDraft,
      }
    : {
        number: nextInvoiceNumber(rawInvoices, settings.invoicePrefix),
        customerId: preset?.id || '',
        customerName: preset?.name || '',
        customerEmail: preset?.email || '',
        customerPhone: preset?.phone || '',
        issueDate: todayISO(),
        dueDate: addDays(todayISO(), Number(settings.defaultDueDays) || 15),
        items: [blankItem()],
        discountType: 'flat',
        discountValue: 0,
        taxRate: settings.defaultTaxRate ?? 18,
        notes: 'Thank you for your business. Please pay by the due date.',
        isDraft: false,
      };

  const onSubmit = async (values, { asDraft }) => {
    try {
      const rec = await actions.saveInvoice(values);
      if (asDraft) toast.success('Draft saved', `${rec.number} is saved as a draft. It won't count towards receivables until created.`);
      else if (existing && !existing.isDraft) toast.success('Invoice updated', `${rec.number} has been saved.`);
      else toast.success('Invoice created', `${rec.number} for ${values.customerName} · ${formatINR(calcTotals(values).total)}. Status is tracked automatically.`);
      navigate(`/invoices/${rec.id}`);
    } catch (e) {
      toast.error('Could not save invoice', e.message);
    }
  };

  return (
    <>
      <PageHeader
        back={
          <button onClick={() => navigate(existing ? `/invoices/${existing.id}` : '/invoices')} className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> {existing ? existing.number : 'Invoices'}
          </button>
        }
        title={existing ? `Edit ${existing.number}` : 'Create Invoice'}
        subtitle={existing?.paid ? `${formatINR(existing.paid)} already received on this invoice. Totals can't go below that.` : 'Subtotal, discount, GST and total are calculated as you type.'}
      />
      <InvoiceForm
        key={existing?.id || 'new'}
        initial={initial}
        customers={customers}
        invoices={rawInvoices}
        settings={settings}
        paidSoFar={existing?.paid || 0}
        onSubmit={onSubmit}
        onCancel={() => navigate(existing ? `/invoices/${existing.id}` : '/invoices')}
      />
    </>
  );
}
