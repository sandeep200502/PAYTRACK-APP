import { useMemo, useState } from 'react';
import { Plus, Search, Users, SearchX } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import CustomerCard from '../components/CustomerCard';
import CustomerFormModal from '../components/CustomerFormModal';
import EmptyState from '../components/EmptyState';
import { Input, Select } from '../components/FormField';
import { useData } from '../hooks/useData';
import { useRouter } from '../hooks/useRouter';
import { customerStats } from '../utils/analytics';
import { formatINR } from '../utils/format';

export default function Customers() {
  const { customers, invoices, payments } = useData();
  const { navigate } = useRouter();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('outstanding');
  const [adding, setAdding] = useState(false);

  const withStats = useMemo(() => customers.map((c) => ({ c, s: customerStats(c, invoices, payments) })), [customers, invoices, payments]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase().replace(/\s/g, '');
    const list = withStats.filter(({ c }) => !q || [c.name, c.email, c.phone, c.contactPerson, c.city].some((v) => v?.toLowerCase().replace(/\s/g, '').includes(q)));
    const sorters = {
      outstanding: (a, b) => b.s.outstanding - a.s.outstanding,
      billed: (a, b) => b.s.billed - a.s.billed,
      name: (a, b) => a.c.name.localeCompare(b.c.name),
      risk: (a, b) => b.s.overdue - a.s.overdue,
    };
    return list.sort(sorters[sort]);
  }, [withStats, search, sort]);

  const totalOutstanding = withStats.reduce((s, x) => s + x.s.outstanding, 0);
  const atRisk = withStats.filter((x) => x.s.behaviour.tone === 'red').length;

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} customers · ${formatINR(totalOutstanding)} outstanding${atRisk ? ` · ${atRisk} high risk` : ''}`}
        actions={
          <Button icon={Plus} onClick={() => setAdding(true)}>
            Add Customer
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input aria-label="Search customers" placeholder="Search by name, email or phone…" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select aria-label="Sort customers" className="sm:w-56" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="outstanding">Highest outstanding</option>
          <option value="risk">Most overdue</option>
          <option value="billed">Highest billed</option>
          <option value="name">Name (A → Z)</option>
        </Select>
      </div>

      {customers.length === 0 ? (
        <div className="card">
          <EmptyState icon={Users} title="No customers yet" message="Add the businesses you bill. Their payment history builds up automatically." action={<Button icon={Plus} onClick={() => setAdding(true)}>Add Customer</Button>} />
        </div>
      ) : rows.length === 0 ? (
        <div className="card">
          <EmptyState icon={SearchX} title={`No customers match “${search}”`} message="Search works on name, email and phone number." />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ c, s }) => (
            <CustomerCard key={c.id} customer={c} stats={s} onOpen={() => navigate(`/customers/${c.id}`)} />
          ))}
        </div>
      )}

      {adding && <CustomerFormModal onClose={() => setAdding(false)} onSaved={(c) => navigate(`/customers/${c.id}`)} />}
    </>
  );
}
