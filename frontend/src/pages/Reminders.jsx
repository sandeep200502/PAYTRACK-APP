import { useMemo, useState } from 'react';
import { BellRing, CircleAlert, Clock, History, MessageCircle, Mail, Copy, PartyPopper } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import ReminderComposer from '../components/ReminderComposer';
import EmptyState from '../components/EmptyState';
import { useData } from '../hooks/useData';
import { useRouter } from '../hooks/useRouter';
import { formatDate, formatINR } from '../utils/format';

const CHANNEL_ICON = { WhatsApp: MessageCircle, Email: Mail, Copied: Copy };

export default function Reminders() {
  const { invoices, reminders } = useData();
  const { query } = useRouter();

  const queue = useMemo(() => {
    const overdue = invoices.filter((i) => i.status === 'overdue').sort((a, b) => b.daysOverdue - a.daysOverdue);
    const soon = invoices.filter((i) => (i.status === 'pending' || i.status === 'partial') && i.daysToDue >= 0 && i.daysToDue <= 7).sort((a, b) => a.daysToDue - b.daysToDue);
    return { overdue, soon };
  }, [invoices]);

  const all = [...queue.overdue, ...queue.soon];
  const [selectedId, setSelectedId] = useState(query.invoice || all[0]?.id);
  const selected = all.find((i) => i.id === selectedId) || all[0];
  const lastFor = (id) => reminders.find((r) => r.invoiceId === id);

  const Item = ({ inv }) => {
    const active = selected?.id === inv.id;
    const r = lastFor(inv.id);
    return (
      <button
        onClick={() => {
          setSelectedId(inv.id);
          if (window.innerWidth < 1024) setTimeout(() => document.getElementById('composer')?.scrollIntoView({ behavior: 'smooth' }), 50);
        }}
        className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition ${active ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-slate-50'}`}
      >
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-semibold ${active ? 'text-brand-800' : 'text-slate-900'}`}>{inv.customerName}</p>
          <p className="text-xs text-slate-500">
            {inv.number} · {r ? `reminded ${formatDate(r.date)}` : 'not reminded yet'}
          </p>
        </div>
        <div className="text-right">
          <p className="num text-sm font-bold text-slate-900">{formatINR(inv.balance)}</p>
          <p className={`text-[11px] font-semibold ${inv.status === 'overdue' ? 'text-red-600' : 'text-amber-700'}`}>
            {inv.status === 'overdue' ? `${inv.daysOverdue}d overdue` : inv.daysToDue === 0 ? 'due today' : `due in ${inv.daysToDue}d`}
          </p>
        </div>
      </button>
    );
  };

  return (
    <>
      <PageHeader title="Reminders" subtitle="Pick an invoice, review the auto-written message and send it on WhatsApp or email." />

      {all.length === 0 ? (
        <div className="card">
          <EmptyState icon={PartyPopper} title="No one to chase" message="No invoices are overdue or due in the next 7 days." />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="space-y-4">
            <section className="card p-3">
              <p className="flex items-center gap-2 px-3 pb-2 pt-1 text-[13px] font-bold text-red-700">
                <CircleAlert className="h-4 w-4" /> Overdue ({queue.overdue.length})
              </p>
              {queue.overdue.length ? queue.overdue.map((i) => <Item key={i.id} inv={i} />) : <p className="px-3 pb-2 text-xs text-slate-500">Nothing overdue.</p>}
            </section>
            <section className="card p-3">
              <p className="flex items-center gap-2 px-3 pb-2 pt-1 text-[13px] font-bold text-amber-700">
                <Clock className="h-4 w-4" /> Due in the next 7 days ({queue.soon.length})
              </p>
              {queue.soon.length ? queue.soon.map((i) => <Item key={i.id} inv={i} />) : <p className="px-3 pb-2 text-xs text-slate-500">Nothing due this week.</p>}
            </section>
          </div>

          <div className="space-y-6">
            <section id="composer" className="card scroll-mt-20 p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
                  <BellRing className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900">Smart reminder</h2>
                  <p className="text-xs text-slate-500">Tone is suggested from how late the payment is.</p>
                </div>
              </div>
              {selected && <ReminderComposer key={selected.id} invoice={selected} />}
            </section>

            <section className="card overflow-hidden">
              <header className="flex items-center gap-2 px-5 py-4">
                <History className="h-4 w-4 text-slate-400" />
                <h2 className="text-[15px] font-bold text-slate-900">Reminder history</h2>
              </header>
              {reminders.length ? (
                <ul className="divide-y divide-slate-100 border-t border-slate-100">
                  {reminders.slice(0, 10).map((r) => {
                    const Icon = CHANNEL_ICON[r.channel] || BellRing;
                    return (
                      <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {r.invoice.customerName} · {r.invoice.number}
                          </p>
                          <p className="text-xs capitalize text-slate-500">
                            {r.channel} · {r.tone} tone
                          </p>
                        </div>
                        <p className="num text-xs text-slate-500">{formatDate(r.date)}</p>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState compact icon={History} title="No reminders sent yet" />
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}
