import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, SlidersHorizontal, X, FileText, SearchX } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import InvoiceTable from '../components/InvoiceTable';
import EmptyState from '../components/EmptyState';
import { Input, Select } from '../components/FormField';
import { useData } from '../hooks/useData';
import { useRouter } from '../hooks/useRouter';
import { useModals } from '../hooks/useModals';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { formatINR } from '../utils/format';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'paid', label: 'Paid' },
  { id: 'pending', label: 'Pending' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'partial', label: 'Partially Paid' },
  { id: 'draft', label: 'Draft' },
];

const STATUS_ORDER = { overdue: 0, partial: 1, pending: 2, draft: 3, paid: 4 };
const EMPTY_FILTERS = { customerId: '', from: '', to: '', min: '', max: '' };

export default function Invoices() {
  const { invoices, customers, actions } = useData();
  const { navigate, query } = useRouter();
  const { openPayment, openReminder } = useModals();
  const confirm = useConfirm();
  const toast = useToast();

  const [tab, setTab] = useState(query.status && TABS.some((t) => t.id === query.status) ? query.status : 'all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState({ field: 'issueDate', dir: 'desc' });

  useEffect(() => {
    if (query.status) setTab(query.status);
  }, [query.status]);

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.id, t.id === 'all' ? invoices.length : invoices.filter((i) => i.status === t.id).length])), [invoices]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = filters.min === '' ? -Infinity : Number(filters.min);
    const max = filters.max === '' ? Infinity : Number(filters.max);
    const list = invoices.filter(
      (i) =>
        (tab === 'all' || i.status === tab) &&
        (!q || i.number.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q)) &&
        (!filters.customerId || i.customerId === filters.customerId) &&
        (!filters.from || i.issueDate >= filters.from) &&
        (!filters.to || i.issueDate <= filters.to) &&
        i.total >= min &&
        i.total <= max,
    );
    const dir = sort.dir === 'asc' ? 1 : -1;
    return list.sort((a, b) => {
      let va = a[sort.field];
      let vb = b[sort.field];
      if (sort.field === 'status') {
        va = STATUS_ORDER[va];
        vb = STATUS_ORDER[vb];
      }
      if (typeof va === 'string') return va.localeCompare(vb) * dir;
      return ((va ?? 0) - (vb ?? 0)) * dir;
    });
  }, [invoices, tab, search, filters, sort]);

  const onSort = (field) => setSort((s) => ({ field, dir: s.field === field && s.dir === 'desc' ? 'asc' : 'desc' }));

  const remove = async (inv) => {
    const ok = await confirm({
      title: `Delete ${inv.number}?`,
      message: `This permanently removes the invoice for ${inv.customerName} (${formatINR(inv.total)})${inv.paymentCount ? ` and its ${inv.paymentCount} recorded payment${inv.paymentCount > 1 ? 's' : ''}` : ''}. This cannot be undone.`,
      confirmLabel: 'Delete Invoice',
    });
    if (!ok) return;
    await actions.deleteInvoice(inv.id);
    toast.success('Invoice deleted', `${inv.number} was removed.`);
  };

  const clearAll = () => {
    setSearch('');
    setFilters(EMPTY_FILTERS);
    setTab('all');
  };

  const totalShown = rows.reduce((s, i) => s + i.total, 0);
  const balanceShown = rows.reduce((s, i) => s + (i.status === 'draft' ? 0 : i.balance), 0);

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle="Create, track and manage every invoice in one place."
        actions={
          <Button icon={Plus} onClick={() => navigate('/invoices/new')}>
            Create Invoice
          </Button>
        }
      />

      <section className="card overflow-hidden">
        {/* Status tabs */}
        <div className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-slate-100 px-3 pt-3" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex shrink-0 items-center gap-2 rounded-t-lg px-3 pb-3 pt-1.5 text-sm font-semibold transition ${tab === t.id ? 'text-brand-700' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {t.label}
              <span className={`num rounded-full px-1.5 py-0.5 text-[11px] ${tab === t.id ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>{counts[t.id]}</span>
              {tab === t.id && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand-600" />}
            </button>
          ))}
        </div>

        {/* Search + filters */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input aria-label="Search invoices" placeholder="Search by invoice ID or customer name…" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" icon={SlidersHorizontal} onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
              Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
            </Button>
            <Select aria-label="Sort invoices" className="w-auto" value={`${sort.field}:${sort.dir}`} onChange={(e) => { const [field, dir] = e.target.value.split(':'); setSort({ field, dir }); }}>
              <option value="issueDate:desc">Newest first</option>
              <option value="issueDate:asc">Oldest first</option>
              <option value="dueDate:asc">Due date (soonest)</option>
              <option value="total:desc">Amount (high → low)</option>
              <option value="total:asc">Amount (low → high)</option>
              <option value="balance:desc">Balance (high → low)</option>
              <option value="customerName:asc">Customer (A → Z)</option>
              <option value="status:asc">Status (urgent first)</option>
            </Select>
          </div>
        </div>

        {showFilters && (
          <div className="grid animate-fade-in gap-3 border-y border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="label" htmlFor="flt-customer">Customer</label>
              <Select id="flt-customer" value={filters.customerId} onChange={(e) => setFilters({ ...filters, customerId: e.target.value })}>
                <option value="">All customers</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="label" htmlFor="flt-from">Issued from</label>
              <Input id="flt-from" type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="flt-to">Issued to</label>
              <Input id="flt-to" type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="flt-min">Min amount (₹)</label>
              <Input id="flt-min" type="number" min="0" value={filters.min} onChange={(e) => setFilters({ ...filters, min: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="flt-max">Max amount (₹)</label>
              <Input id="flt-max" type="number" min="0" value={filters.max} onChange={(e) => setFilters({ ...filters, max: e.target.value })} />
            </div>
          </div>
        )}

        {(search || activeFilterCount > 0 || tab !== 'all') && (
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2.5 text-[13px] text-slate-500">
            <span>
              Showing <b className="text-slate-900">{rows.length}</b> of {invoices.length} · <span className="num">{formatINR(totalShown)}</span> billed · <span className="num">{formatINR(balanceShown)}</span> outstanding
            </span>
            <button onClick={clearAll} className="ml-auto inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline">
              <X className="h-3.5 w-3.5" /> Clear all
            </button>
          </div>
        )}

        {invoices.length === 0 ? (
          <EmptyState icon={FileText} title="No invoices yet" message="Create your first invoice. PayTrack will calculate GST, track payments and flag overdue dues for you." action={<Button icon={Plus} onClick={() => navigate('/invoices/new')}>Create Invoice</Button>} />
        ) : rows.length === 0 ? (
          <EmptyState icon={SearchX} title="No invoices match" message="Try a different search term or clear the filters." action={<Button variant="secondary" onClick={clearAll}>Clear filters</Button>} />
        ) : (
          <InvoiceTable
            invoices={rows}
            sort={sort}
            onSort={onSort}
            onOpen={(i) => navigate(`/invoices/${i.id}`)}
            onEdit={(i) => navigate(`/invoices/${i.id}/edit`)}
            onPay={(i) => openPayment(i.id)}
            onRemind={(i) => openReminder(i.id)}
            onDelete={remove}
          />
        )}
      </section>
    </>
  );
}
