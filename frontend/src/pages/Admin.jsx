import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Users, UserX, Building2, FileText, Wallet, Ban, CircleCheck, Trash2, UserPlus, KeyRound, Search, IndianRupee, UserRoundCheck, History } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { Field, Input } from '../components/FormField';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { adminApi } from '../services/admin';
import { formatDate, formatINR } from '../utils/format';

function Pill({ children, tone }) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    red: 'bg-red-50 text-red-700 ring-red-600/20',
    blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    slate: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  };
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}>{children}</span>;
}

const ACTIONS = {
  CREATE_USER: 'created the account',
  DISABLE_USER: 'disabled the account',
  ENABLE_USER: 'enabled the account',
  RESET_PASSWORD: 'reset the password of',
  DELETE_USER: 'deleted the account',
};

const when = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never');

/** One small dialog used for both "Add user" (needs name and email) and "Reset password". */
function UserModal({ mode, target, onClose, onDone }) {
  const toast = useToast();
  const creating = mode === 'create';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm({ ...form, [k]: v });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (creating && !form.name.trim()) return setError('Name is required');
    if (creating && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return setError('Enter a valid email address');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setSaving(true);
    try {
      if (creating) {
        await adminApi.create(form.name.trim(), form.email.trim(), form.password);
        toast.success('Account created', form.email.trim());
      } else {
        await adminApi.resetPassword(target.id, form.password);
        toast.success('Password reset', `Share the new password with ${target.name}.`);
      }
      onDone();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title={creating ? 'Add user' : `Reset password for ${target.name}`}
      subtitle={creating ? 'Creates a normal account. Share the password with the person.' : target.email}
      icon={creating ? UserPlus : KeyRound}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={saving} onClick={submit}>{creating ? 'Create account' : 'Set password'}</Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {creating && (
          <>
            <Field label="Name" htmlFor="au-name" required><Input id="au-name" value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
            <Field label="Email" htmlFor="au-email" required><Input id="au-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
          </>
        )}
        <Field label={creating ? 'Temporary password' : 'New password'} htmlFor="au-pw" required hint="At least 6 characters">
          <Input id="au-pw" type="text" autoComplete="off" value={form.password} onChange={(e) => set('password', e.target.value)} />
        </Field>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [activity, setActivity] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    try {
      setError('');
      const [o, u, a] = await Promise.all([adminApi.overview(), adminApi.users(), adminApi.activity()]);
      setOverview(o);
      setUsers(u);
      setActivity(a);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'ADMIN') load();
  }, [user, load]);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="card">
        <EmptyState icon={ShieldCheck} title="Administrators only" message="Your account does not have access to this page." />
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const shown = users.filter(
    (u) =>
      (filter === 'all' || (filter === 'active' ? u.active : !u.active)) &&
      (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
  );

  const toggle = async (u) => {
    setBusyId(u.id);
    try {
      await adminApi.setActive(u.id, !u.active);
      toast.success(u.active ? 'Account disabled' : 'Account enabled', u.email);
      await load();
    } catch (e) {
      toast.error('Could not update the account', e.message);
    }
    setBusyId(null);
  };

  const remove = async (u) => {
    const ok = await confirm({
      title: `Delete ${u.name}?`,
      message: `This permanently deletes the account ${u.email} and its ${u.customers} customers, ${u.invoices} invoices and ${u.payments} payments.`,
      confirmLabel: 'Delete account',
    });
    if (!ok) return;
    setBusyId(u.id);
    try {
      await adminApi.remove(u.id);
      toast.success('Account deleted', u.email);
      await load();
    } catch (e) {
      toast.error('Could not delete the account', e.message);
    }
    setBusyId(null);
  };

  return (
    <>
      <PageHeader
        title="Admin"
        subtitle="Accounts and usage across PayTrack. You see counts only, never another user's customers or invoices."
        actions={<Button icon={UserPlus} onClick={() => setModal({ mode: 'create' })}>Add user</Button>}
      />
      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {overview && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard label="Accounts" value={overview.users} icon={Users} tone="blue" />
          <StatCard label="Admins" value={overview.admins} icon={ShieldCheck} tone="violet" />
          <StatCard label="Disabled" value={overview.disabledUsers} icon={UserX} tone="red" />
          <StatCard label="Money collected" value={formatINR(overview.totalCollected)} icon={IndianRupee} tone="green" sub="across all users" />
          <StatCard label="Customers" value={overview.customers} icon={Building2} tone="slate" />
          <StatCard label="Invoices" value={overview.invoices} icon={FileText} tone="amber" />
          <StatCard label="Payments" value={overview.payments} icon={Wallet} tone="green" />
          <StatCard label="New (7 days)" value={overview.newUsersLast7Days} icon={UserRoundCheck} tone="blue" />
        </div>
      )}

      <section className="card overflow-hidden">
        <header className="flex flex-col gap-3 px-5 pb-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[15px] font-bold text-slate-900">Accounts <span className="font-normal text-slate-400">({shown.length})</span></h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative sm:w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or email" aria-label="Search accounts" className="h-9 pl-9" />
            </div>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by status" className="input h-9 py-0">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] whitespace-nowrap text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-2 font-semibold">Name</th>
                <th className="px-1.5 py-2 font-semibold">Email</th>
                <th className="px-1.5 py-2 font-semibold">Status</th>
                <th className="px-1.5 py-2 font-semibold">Last login</th>
                <th className="px-1.5 py-2 text-right font-semibold">Cust.</th>
                <th className="px-1.5 py-2 text-right font-semibold">Inv.</th>
                <th className="px-1.5 py-2 text-right font-semibold">Pmts</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map((u) => {
                const protectedRow = u.role === 'ADMIN' || u.id === user.id;
                return (
                  <tr key={u.id}>
                    <td className="px-5 py-2.5 font-semibold text-slate-900">{u.name}{u.id === user.id ? ' (you)' : ''}{u.role === 'ADMIN' && <span className="ml-2"><Pill tone="blue">Admin</Pill></span>}</td>
                    <td className="px-1.5 py-2.5 text-slate-600">{u.email}</td>
                    <td className="px-1.5 py-2.5"><Pill tone={u.active ? 'green' : 'red'}>{u.active ? 'Active' : 'Disabled'}</Pill></td>
                    <td className="px-1.5 py-2.5 text-slate-600" title={`Joined ${formatDate(u.createdAt)}`}>{when(u.lastLoginAt)}</td>
                    <td className="num px-1.5 py-2.5 text-right">{u.customers}</td>
                    <td className="num px-1.5 py-2.5 text-right">{u.invoices}</td>
                    <td className="num px-1.5 py-2.5 text-right">{u.payments}</td>
                    <td className="px-2 py-2.5">
                      {!protectedRow && (
                        <div className="flex justify-end gap-1 whitespace-nowrap">
                          <Button size="sm" variant="secondary" icon={KeyRound} disabled={busyId === u.id} onClick={() => setModal({ mode: 'reset', target: u })} aria-label={`Reset password for ${u.name}`} title="Reset password" />
                          <Button size="sm" variant="secondary" icon={u.active ? Ban : CircleCheck} loading={busyId === u.id} onClick={() => toggle(u)} aria-label={u.active ? `Disable ${u.name}` : `Enable ${u.name}`} title={u.active ? 'Disable account' : 'Enable account'} />
                          <Button size="sm" variant="danger" icon={Trash2} disabled={busyId === u.id} onClick={() => remove(u)} aria-label={`Delete ${u.name}`} title="Delete account" />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {shown.length === 0 && <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-500">{users.length === 0 ? 'No accounts yet.' : 'No accounts match.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card mt-6 overflow-hidden">
        <header className="flex items-center gap-2.5 px-5 pb-2 pt-5">
          <History className="h-5 w-5 text-brand-600" />
          <h2 className="text-[15px] font-bold text-slate-900">Activity log</h2>
        </header>
        {activity.length === 0 ? (
          <p className="px-5 pb-6 pt-2 text-sm text-slate-500">Nothing yet. Account changes you make appear here.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {activity.map((a) => (
              <li key={a.id} className="flex flex-col gap-0.5 px-5 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="text-slate-700">
                  <span className="font-semibold text-slate-900">{a.admin}</span> {ACTIONS[a.action] || a.action} <span className="font-medium">{a.target}</span>
                </span>
                <span className="text-xs text-slate-500">{when(a.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {modal && (
        <UserModal
          mode={modal.mode}
          target={modal.target}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </>
  );
}
