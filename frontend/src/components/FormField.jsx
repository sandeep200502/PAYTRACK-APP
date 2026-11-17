// Label + control + error/hint, with a required indicator. Used by every form.

export function Field({ label, htmlFor, required, error, hint, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label}
          {required && <span className="ml-0.5 text-red-500" aria-hidden>*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ error, className = '', ...props }) {
  return <input className={`input ${error ? 'input-error' : ''} ${className}`} aria-invalid={!!error} {...props} />;
}

export function Select({ error, className = '', children, ...props }) {
  return (
    <select className={`input appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10 ${error ? 'input-error' : ''} ${className}`} aria-invalid={!!error} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ error, className = '', ...props }) {
  return <textarea className={`input min-h-[88px] resize-y ${error ? 'input-error' : ''} ${className}`} aria-invalid={!!error} {...props} />;
}

/** Input with a ₹ prefix. */
export function MoneyInput({ error, className = '', ...props }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-medium text-slate-400">₹</span>
      <input type="number" inputMode="decimal" min="0" step="0.01" className={`input num pl-8 ${error ? 'input-error' : ''} ${className}`} aria-invalid={!!error} {...props} />
    </div>
  );
}
