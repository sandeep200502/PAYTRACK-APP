// All Recharts visualisations. Each takes already-computed data from utils/analytics.

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatINR, formatINRCompact } from '../utils/format';
import { ChartTooltip, Legend } from './ChartCard';
import EmptyState from './EmptyState';
import { ChartColumn } from 'lucide-react';

const AXIS = { fontSize: 12, fill: '#64748b' };
const GRID = '#eef1f6';

const NoData = ({ message = 'Data will appear here once you create invoices.' }) => (
  <EmptyState compact icon={ChartColumn} title="Nothing to chart yet" message={message} />
);

/** Invoiced vs collected by month (area). */
export function RevenueChart({ data, height = 280 }) {
  if (!data.some((d) => d.invoiced || d.collected)) return <NoData />;
  return (
    <div>
      <Legend items={[{ label: 'Collected', color: '#2554ea' }, { label: 'Invoiced', color: '#94a3b8' }]} />
      <div style={{ height }} className="mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="gCollected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2554ea" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#2554ea" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="month" tick={AXIS} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={formatINRCompact} width={56} />
            <Tooltip content={<ChartTooltip formatter={formatINR} />} cursor={{ stroke: '#cbd5e1', strokeDasharray: 4 }} />
            <Area type="monotone" dataKey="invoiced" name="Invoiced" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 4" fill="transparent" dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="collected" name="Collected" stroke="#2554ea" strokeWidth={2.5} fill="url(#gCollected)" dot={{ r: 3, fill: '#2554ea', strokeWidth: 0 }} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Donut of invoice status (count), with amount breakdown list. */
export function StatusDonut({ data, height = 200, metric = 'count' }) {
  const rows = data.filter((d) => d.count > 0);
  const total = rows.reduce((s, d) => s + d[metric], 0);
  if (!total) return <NoData />;
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey={metric} nameKey="name" innerRadius="66%" outerRadius="100%" paddingAngle={2} stroke="#fff" strokeWidth={2} cornerRadius={4}>
              {rows.map((d) => (
                <Cell key={d.status} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip formatter={(v, p) => (metric === 'count' ? `${v} · ${formatINR(p.payload.amount)}` : formatINR(v))} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="num text-2xl font-bold text-slate-900">{metric === 'count' ? total : formatINRCompact(total)}</div>
            <div className="text-[11px] font-medium text-slate-500">{metric === 'count' ? 'invoices' : 'total'}</div>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-2.5">
        {data.map((d) => (
          <li key={d.status} className="flex items-center gap-2.5 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: d.color }} />
            <span className="text-slate-600">{d.name}</span>
            <span className="num ml-auto font-semibold text-slate-900">{d.count}</span>
            <span className="num w-20 text-right text-xs text-slate-500">{formatINRCompact(d.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Expected incoming cash by due-date bucket. */
export function CashFlowChart({ data, height = 200 }) {
  if (!data.some((d) => d.amount)) return <NoData message="No open invoices, so nothing is expected right now." />;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={formatINRCompact} width={56} />
          <Tooltip content={<ChartTooltip formatter={formatINR} />} cursor={{ fill: '#f1f5f9' }} />
          <Bar dataKey="amount" name="Expected" radius={[6, 6, 0, 0]} maxBarSize={56}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Aging buckets as horizontal bars. */
export function AgingChart({ data, height = 200 }) {
  if (!data.some((d) => d.amount)) return <NoData message="No overdue invoices. Every customer is within terms." />;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }} barCategoryGap="24%">
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} tickFormatter={formatINRCompact} />
          <YAxis type="category" dataKey="label" tick={AXIS} axisLine={false} tickLine={false} width={80} />
          <Tooltip content={<ChartTooltip formatter={(v, p) => `${formatINR(v)} · ${p.payload.count} inv`} />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="amount" name="Outstanding" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {data.map((d) => (
              <Cell key={d.key} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Invoiced vs collected grouped bars (reports). */
export function InvoicedVsCollected({ data, height = 280 }) {
  if (!data.some((d) => d.invoiced || d.collected)) return <NoData />;
  return (
    <div>
      <Legend items={[{ label: 'Invoiced', color: '#bfd3fe' }, { label: 'Collected', color: '#2554ea' }]} />
      <div style={{ height }} className="mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }} barGap={3} barCategoryGap="24%">
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="month" tick={AXIS} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={formatINRCompact} width={56} />
            <Tooltip content={<ChartTooltip formatter={formatINR} />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="invoiced" name="Invoiced" fill="#bfd3fe" radius={[4, 4, 0, 0]} maxBarSize={26} />
            <Bar dataKey="collected" name="Collected" fill="#2554ea" radius={[4, 4, 0, 0]} maxBarSize={26} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Payment method split (donut + list). */
export function MethodsChart({ data, height = 180 }) {
  const rows = data.filter((d) => d.amount > 0);
  const total = rows.reduce((s, d) => s + d.amount, 0);
  if (!total) return <NoData message="Record a payment to see how customers pay you." />;
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="amount" nameKey="name" innerRadius="60%" outerRadius="100%" paddingAngle={2} stroke="#fff" strokeWidth={2} cornerRadius={4}>
              {rows.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip formatter={formatINR} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-3">
        {data.map((d) => (
          <li key={d.name}>
            <div className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
              <span className="text-slate-600">{d.name}</span>
              <span className="num ml-auto font-semibold text-slate-900">{formatINR(d.amount)}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full" style={{ width: `${total ? (d.amount / total) * 100 : 0}%`, background: d.color }} />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {d.count} payment{d.count === 1 ? '' : 's'} · {total ? Math.round((d.amount / total) * 100) : 0}%
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Top customers: billed split into paid vs outstanding (stacked horizontal). */
export function TopCustomersChart({ data, height = 260 }) {
  if (!data.length) return <NoData />;
  return (
    <div>
      <Legend items={[{ label: 'Paid', color: '#16a34a' }, { label: 'Outstanding', color: '#f59e0b' }]} />
      <div style={{ height }} className="mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.map((d) => ({ ...d, paidPart: d.billed - d.outstanding }))} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }} barCategoryGap="26%">
            <CartesianGrid stroke={GRID} horizontal={false} />
            <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} tickFormatter={formatINRCompact} />
            <YAxis type="category" dataKey="name" tick={{ ...AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={118} />
            <Tooltip content={<ChartTooltip formatter={formatINR} />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="paidPart" name="Paid" stackId="a" fill="#16a34a" maxBarSize={22} />
            <Bar dataKey="outstanding" name="Outstanding" stackId="a" fill="#f59e0b" radius={[0, 5, 5, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
