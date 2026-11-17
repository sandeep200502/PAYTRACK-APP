import { useState } from 'react';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import { Field, Input } from '../components/FormField';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from '../hooks/useRouter';

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function Register() {
  const { register } = useAuth();
  const { navigate } = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Same rules as the server, so mistakes are caught before the request is sent.
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Enter your name';
    if (!EMAIL.test(form.email.trim())) e.email = 'Enter a valid email address';
    if (form.password.length < 6) e.password = 'Use at least 6 characters';
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setServerError('');
    try {
      await register(form.name.trim(), form.email, form.password);
    } catch (err) {
      setServerError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Your invoices and customers stay private to your account."
      footer={
        <>
          Already registered?{' '}
          <button type="button" className="font-semibold text-brand-600 hover:underline" onClick={() => navigate('/login')}>
            Log in
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {serverError && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{serverError}</div>}
        <Field label="Your name" htmlFor="name" required error={errors.name}>
          <Input id="name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
        </Field>
        <Field label="Email" htmlFor="email" required error={errors.email}>
          <Input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        </Field>
        <Field label="Password" htmlFor="password" required error={errors.password} hint="At least 6 characters">
          <Input id="password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" required error={errors.confirm}>
          <Input id="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
        </Field>
        <Button type="submit" loading={busy} className="w-full">Create account</Button>
      </form>
    </AuthLayout>
  );
}
