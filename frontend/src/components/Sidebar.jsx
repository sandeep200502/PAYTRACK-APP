import { LayoutDashboard, FileText, Users, Wallet, CircleAlert, ChartColumn, BellRing, Settings, Wand2, ShieldCheck, LogOut, X } from 'lucide-react';
import { useRouter } from '../hooks/useRouter';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { initials } from '../utils/format';

export const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/payments', label: 'Payments', icon: Wallet },
  { to: '/overdue', label: 'Overdue', icon: CircleAlert, badge: 'overdue' },
  { to: '/reports', label: 'Reports', icon: ChartColumn },
  { to: '/reminders', label: 'Reminders', icon: BellRing, badge: 'reminders' },
  { to: '/tools', label: 'Smart Tools', icon: Wand2 },
  { to: '/admin', label: 'Admin', icon: ShieldCheck, adminOnly: true },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Logo({ dark = true, compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-white shadow-[0_6px_16px_-6px_rgba(59,110,245,.8)]">
        <span className="text-[17px] font-extrabold leading-none">₹</span>
        <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 ${dark ? 'border-[#0c1a33]' : 'border-white'} bg-emerald-400`} />
      </div>
      <div className="leading-tight">
        <div className={`text-[15px] font-extrabold tracking-[0.12em] ${dark ? 'text-white' : 'text-slate-900'}`}>PAYTRACK</div>
        {!compact && <div className={`text-[11px] font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Smart Business Finance</div>}
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose }) {
  const { segments, navigate } = useRouter();
  const data = useData();
  const current = `/${segments[0] || 'dashboard'}`;
  const overdueCount = data.invoices?.filter((i) => i.status === 'overdue').length ?? 0;
  const dueSoon = data.invoices?.filter((i) => (i.status === 'pending' || i.status === 'partial') && i.daysToDue <= 3).length ?? 0;
  const badges = { overdue: overdueCount, reminders: overdueCount + dueSoon };
  const s = data.settings || {};
  const { user, authRequired, logout } = useAuth();
  const shownName = user?.name || s.ownerName || 'Sandeep';

  const go = (to) => {
    navigate(to);
    onClose?.();
  };

  const content = (
    <div className="flex h-full flex-col bg-[#0c1a33] text-slate-300">
      <div className="flex items-center justify-between px-5 pb-6 pt-6">
        <Logo />
        <button className="rounded-lg p-2 text-slate-400 hover:bg-white/10 lg:hidden" onClick={onClose} aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="Main">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Menu</p>
        {NAV.filter((item) => (user?.role === 'ADMIN' ? item.adminOnly : !item.adminOnly)).map((item) => {
          const active = current === item.to;
          const count = item.badge ? badges[item.badge] : 0;
          return (
            <button
              key={item.to}
              onClick={() => go(item.to)}
              aria-current={active ? 'page' : undefined}
              className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
              }`}
            >
              {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-400" />}
              <item.icon className={`h-[18px] w-[18px] ${active ? 'text-brand-300' : 'text-slate-500 group-hover:text-slate-300'}`} />
              {item.label}
              {count > 0 && (
                <span className={`num ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${item.badge === 'overdue' ? 'bg-red-500/90 text-white' : 'bg-white/10 text-slate-200'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="m-3 rounded-2xl bg-white/5 p-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-orange-400 text-sm font-bold text-slate-900">
            {initials(shownName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{shownName}</p>
            <p className="truncate text-xs text-slate-400">{user?.email || s.name || 'My Business'}</p>
          </div>
        </div>
        {authRequired && user && (
          <button
            onClick={logout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{content}</aside>
      {open && (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-slate-900/50" onClick={onClose} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-slide-up shadow-2xl">{content}</aside>
        </div>
      )}
    </>
  );
}
