import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Menu, Plus, Search, FileText, UserRound, CircleAlert, Clock, Wallet } from 'lucide-react';
import { useRouter } from '../hooks/useRouter';
import { useData } from '../hooks/useData';
import { useModals } from '../hooks/useModals';
import { useAuth } from '../hooks/useAuth';
import { formatINR, initials } from '../utils/format';
import { Logo } from './Sidebar';
import StatusBadge from './StatusBadge';

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && onOutside();
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, onOutside]);
}

function GlobalSearch() {
  const { invoices, customers } = useData();
  const { navigate } = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useClickOutside(box, () => setOpen(false));

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return { inv: [], cus: [] };
    return {
      inv: invoices.filter((i) => i.number.toLowerCase().includes(s) || i.customerName.toLowerCase().includes(s)).slice(0, 5),
      cus: customers.filter((c) => [c.name, c.email, c.phone].some((v) => v?.toLowerCase().includes(s))).slice(0, 4),
    };
  }, [q, invoices, customers]);

  const pick = (to) => {
    navigate(to);
    setQ('');
    setOpen(false);
  };

  return (
    <div ref={box} className="relative hidden w-full max-w-sm md:block">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results.inv[0]) pick(`/invoices/${results.inv[0].id}`);
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder="Search invoices or customers…"
        aria-label="Search invoices or customers"
        className="input h-10 rounded-xl border-slate-200 bg-slate-50 pl-10 focus:bg-white"
      />
      {open && q.trim() && (
        <div className="absolute left-0 right-0 top-12 z-40 animate-fade-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop">
          {!results.inv.length && !results.cus.length && <p className="px-4 py-6 text-center text-sm text-slate-500">No matches for “{q}”</p>}
          {results.inv.length > 0 && <p className="eyebrow px-4 pb-1 pt-3">Invoices</p>}
          {results.inv.map((i) => (
            <button key={i.id} onClick={() => pick(`/invoices/${i.id}`)} className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-slate-50">
              <FileText className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-900">{i.number}</span>
              <span className="truncate text-sm text-slate-500">{i.customerName}</span>
              <span className="ml-auto">
                <StatusBadge status={i.status} />
              </span>
            </button>
          ))}
          {results.cus.length > 0 && <p className="eyebrow px-4 pb-1 pt-3">Customers</p>}
          {results.cus.map((c) => (
            <button key={c.id} onClick={() => pick(`/customers/${c.id}`)} className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-slate-50">
              <UserRound className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-900">{c.name}</span>
              <span className="truncate text-xs text-slate-500">{c.email}</span>
            </button>
          ))}
          <div className="h-2" />
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const { invoices, payments, today } = useData();
  const { navigate } = useRouter();
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useClickOutside(box, () => setOpen(false));

  const items = useMemo(() => {
    const overdue = invoices
      .filter((i) => i.status === 'overdue')
      .sort((a, b) => b.daysOverdue - a.daysOverdue)
      .map((i) => ({ id: `o${i.id}`, icon: CircleAlert, tone: 'text-red-600 bg-red-50', title: `${i.number} is ${i.daysOverdue} days overdue`, detail: `${i.customerName} · ${formatINR(i.balance)} due`, to: `/invoices/${i.id}` }));
    const soon = invoices
      .filter((i) => (i.status === 'pending' || i.status === 'partial') && i.daysToDue >= 0 && i.daysToDue <= 3)
      .map((i) => ({ id: `s${i.id}`, icon: Clock, tone: 'text-amber-600 bg-amber-50', title: `${i.number} due ${i.daysToDue === 0 ? 'today' : `in ${i.daysToDue} day${i.daysToDue > 1 ? 's' : ''}`}`, detail: `${i.customerName} · ${formatINR(i.balance)}`, to: `/invoices/${i.id}` }));
    const recent = payments
      .filter((p) => p.date >= today.slice(0, 8) + '01')
      .slice(0, 2)
      .map((p) => ({ id: `p${p.id}`, icon: Wallet, tone: 'text-emerald-600 bg-emerald-50', title: `${formatINR(p.amount)} received`, detail: `${p.customerName} · ${p.method}`, to: '/payments' }));
    return [...overdue, ...soon, ...recent];
  }, [invoices, payments, today]);

  const alertCount = items.filter((i) => !i.id.startsWith('p')).length;

  return (
    <div ref={box} className="relative">
      <button className="btn btn-ghost relative h-10 w-10 p-0" onClick={() => setOpen((o) => !o)} aria-label={`Notifications, ${alertCount} alerts`}>
        <Bell className="h-5 w-5" />
        {alertCount > 0 && <span className="num absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{alertCount}</span>}
      </button>
      {open && (
        <div className="fixed inset-x-3 top-16 z-40 animate-fade-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-bold text-slate-900">Notifications</p>
            <span className="text-xs text-slate-500">{alertCount} need attention</span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-500">You’re all caught up.</p>}
            {items.map((n) => (
              <button key={n.id} onClick={() => { navigate(n.to); setOpen(false); }} className="flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${n.tone}`}>
                  <n.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">{n.title}</span>
                  <span className="block truncate text-xs text-slate-500">{n.detail}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar({ onMenu }) {
  const { navigate } = useRouter();
  const { settings } = useData();
  const { openPayment } = useModals();
  const { user } = useAuth();
  if (user?.role === 'ADMIN') {
    return (
      <header className="no-print sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button className="btn btn-ghost -ml-2 h-10 w-10 p-0 lg:hidden" onClick={onMenu} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="md:hidden">
            <Logo dark={false} compact />
          </div>
          <span className="ml-auto rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">Administrator</span>
        </div>
      </header>
    );
  }
  return (
    <header className="no-print sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button className="btn btn-ghost -ml-2 h-10 w-10 p-0 lg:hidden" onClick={onMenu} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <div className="md:hidden">
          <Logo dark={false} compact />
        </div>
        <GlobalSearch />
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button className="btn btn-secondary hidden h-10 sm:inline-flex" onClick={() => openPayment()}>
            <Wallet className="h-4 w-4" /> Record Payment
          </button>
          <button className="btn btn-primary h-10 px-3 sm:px-4" onClick={() => navigate('/invoices/new')} aria-label="New invoice">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Invoice</span>
          </button>
          <Notifications />
          <div className="hidden h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-orange-400 text-sm font-bold text-slate-900 sm:grid" title={settings?.ownerName}>
            {initials(settings?.ownerName || 'S')}
          </div>
        </div>
      </div>
    </header>
  );
}
