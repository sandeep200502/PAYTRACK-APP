import { Logo } from './Sidebar';

/** Shared frame for the Login and Register pages: brand panel on the left, form on the right. */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-[#0c1a33] p-12 text-slate-300 lg:flex">
        <Logo />
        <div>
          <h2 className="text-3xl font-extrabold leading-tight text-white">Know who owes you, and get paid faster.</h2>
          <ul className="mt-6 space-y-3 text-sm text-slate-400">
            <li>Create invoices and track every payment</li>
            <li>See overdue money by age at a glance</li>
            <li>Send friendly or firm reminders in one click</li>
          </ul>
        </div>
        <p className="text-xs text-slate-500">Smart Invoice &amp; Payment Tracker for small businesses</p>
      </div>
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo dark={false} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
          <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>
        </div>
      </div>
    </div>
  );
}
