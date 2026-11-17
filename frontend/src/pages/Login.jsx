import { useState } from 'react';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import { Field, Input } from '../components/FormField';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from '../hooks/useRouter';

export default function Login() {
  const { login } = useAuth();
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your PayTrack account."
      footer={
        <>
          New here?{' '}
          <button type="button" className="font-semibold text-brand-600 hover:underline" onClick={() => navigate('/register')}>
            Create an account
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{error}</div>}
        <Field label="Email" htmlFor="email" required>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.in" />
        </Field>
        <Field label="Password" htmlFor="password" required>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Button type="submit" loading={busy} className="w-full">Log in</Button>
      </form>
    </AuthLayout>
  );
}
