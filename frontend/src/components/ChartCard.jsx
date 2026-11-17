export default function ChartCard({ title, subtitle, action, children, className = '', bodyClass = '' }) {
  return (
    <section className={`card flex flex-col ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 pb-2 pt-5">
        <div>
          <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className={`flex-1 px-5 pb-5 ${bodyClass}`}>{children}</div>
    </section>
  );
}

/** Tooltip body shared by all charts, so they look like one system. */
export function ChartTooltip({ active, payload, label, formatter = (v) => v, labelFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs shadow-pop">
      {(label || labelFormatter) && <p className="mb-1.5 font-semibold text-slate-900">{labelFormatter ? labelFormatter(label, payload) : label}</p>}
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={p.dataKey + p.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.payload?.fill || p.color || p.fill }} />
            <span className="text-slate-500">{p.name}</span>
            <span className="num ml-auto pl-4 font-semibold text-slate-900">{formatter(p.value, p)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Legend({ items }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
