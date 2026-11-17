import { useEffect, useState } from 'react';
import { Copy, Mail, MessageCircle, Sparkles, Phone, AtSign } from 'lucide-react';
import { Textarea } from './FormField';
import StatusBadge from './StatusBadge';
import { useData } from '../hooks/useData';
import { useToast } from '../hooks/useToast';
import { buildReminder, mailtoLink, suggestTone, TONES, whatsappLink } from '../utils/reminders';
import { formatDate, formatINR } from '../utils/format';

/** Smart reminder: tone auto-picked from how late the invoice is; message is editable. */
export default function ReminderComposer({ invoice, onSent }) {
  const { settings, actions, reminders } = useData();
  const toast = useToast();
  const suggested = suggestTone(invoice);
  const [tone, setTone] = useState(suggested);
  const [draft, setDraft] = useState(() => buildReminder(invoice, { tone: suggested, business: settings }));

  useEffect(() => {
    const t = suggestTone(invoice);
    setTone(t);
    setDraft(buildReminder(invoice, { tone: t, business: settings }));
  }, [invoice.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeTone = (t) => {
    setTone(t);
    setDraft(buildReminder(invoice, { tone: t, business: settings }));
  };

  const history = reminders.filter((r) => r.invoiceId === invoice.id);

  const sent = async (channel) => {
    await actions.logReminder(invoice.id, channel, tone);
    toast.success('Reminder prepared successfully.', `${channel} reminder for ${invoice.number} logged in reminder history.`);
    onSent?.();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft.message);
      sent('Copied');
    } catch {
      const el = document.getElementById('reminder-message');
      el?.select();
      toast.info('Message selected', 'Press Ctrl+C (or ⌘C) to copy it.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm">
        <div>
          <p className="font-semibold text-slate-900">{invoice.customerName}</p>
          <p className="text-xs text-slate-500">
            {invoice.number} · Due {formatDate(invoice.dueDate)}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="num font-bold text-slate-900">{formatINR(invoice.balance)}</p>
          <StatusBadge status={invoice.status} />
        </div>
      </div>

      <div>
        <p className="label">Tone</p>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Reminder tone">
          {TONES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={tone === t.id}
              onClick={() => changeTone(t.id)}
              className={`relative rounded-xl border px-3 py-2 text-left transition ${tone === t.id ? 'border-brand-500 bg-brand-50 ring-4 ring-brand-500/10' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <span className={`block text-sm font-semibold ${tone === t.id ? 'text-brand-700' : 'text-slate-700'}`}>{t.label}</span>
              <span className="hidden text-[11px] text-slate-500 sm:block">{t.hint}</span>
              {t.id === suggested && (
                <span className="absolute -top-2 right-2 inline-flex items-center gap-0.5 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  <Sparkles className="h-2.5 w-2.5" /> Suggested
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="reminder-message" className="label">
          Message <span className="font-normal text-slate-400">(you can edit before sending)</span>
        </label>
        <Textarea id="reminder-message" rows={11} className="num font-[450] leading-relaxed" value={draft.message} onChange={(e) => setDraft({ ...draft, message: e.target.value })} />
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5 select-all">
          <Phone className="h-3.5 w-3.5" /> {invoice.customerPhone || 'No phone on file'}
        </span>
        <span className="inline-flex items-center gap-1.5 select-all">
          <AtSign className="h-3.5 w-3.5" /> {invoice.customerEmail || 'No email on file'}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <button type="button" onClick={copy} className="btn btn-secondary">
          <Copy className="h-4 w-4" /> Copy Message
        </button>
        <a href={whatsappLink(invoice.customerPhone, draft.message)} target="_blank" rel="noreferrer" onClick={() => sent('WhatsApp')} className="btn bg-[#25D366] text-white hover:bg-[#1ebe5b]">
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
        <a href={mailtoLink(invoice.customerEmail, draft.subject, draft.message)} onClick={() => sent('Email')} className="btn btn-primary">
          <Mail className="h-4 w-4" /> Email
        </a>
      </div>

      {history.length > 0 && (
        <p className="text-xs text-slate-500">
          Previously reminded {history.length} time{history.length > 1 ? 's' : ''} · last on {formatDate(history[0].date)} via {history[0].channel}
        </p>
      )}
    </div>
  );
}
