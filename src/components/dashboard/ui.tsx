// src/components/dashboard/ui.tsx
// Mali UI gradivni blokovi za interni panel (server komponente, bez JS-a).

import type { ReactNode } from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { daysFromNow, fmtDate, isPast } from '@/lib/gym/time';

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-white/[0.07] bg-white/[0.03] shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div>
        <h2 className="font-[family-name:var(--font-rajdhani)] text-lg font-bold uppercase tracking-wide text-white">
          {title}
        </h2>
        {hint && <p className="text-xs text-zinc-500">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function Delta({ value, label = 'vs prethodni period' }: { value: number | null; label?: string }) {
  if (value === null || !Number.isFinite(value)) {
    return <span className="text-[11px] text-zinc-500">nema poređenja</span>;
  }
  const rounded = Math.round(value);
  const Icon = rounded > 0 ? TrendingUp : rounded < 0 ? TrendingDown : Minus;
  const tone = rounded > 0 ? 'text-emerald-400' : rounded < 0 ? 'text-rose-400' : 'text-zinc-400';
  return (
    <span className={cx('inline-flex items-center gap-1 text-[11px] font-semibold', tone)}>
      <Icon className="h-3.5 w-3.5" />
      {rounded > 0 ? '+' : ''}
      {rounded}% <span className="font-normal text-zinc-500">{label}</span>
    </span>
  );
}

export function Kpi({
  label,
  value,
  hint,
  delta,
  deltaLabel,
  icon,
  accent,
  href,
}: {
  label: string;
  value: ReactNode;
  hint: string;
  delta?: number | null;
  deltaLabel?: string;
  icon?: ReactNode;
  accent?: boolean;
  href?: string;
}) {
  const inner = (
    <div
      className={cx(
        'relative h-full overflow-hidden rounded-2xl border p-3.5 sm:p-5 transition',
        accent
          ? 'border-[#ff6b35]/40 bg-gradient-to-br from-[#ff6b35]/25 via-[#ff6b35]/10 to-transparent'
          : 'border-white/[0.07] bg-white/[0.03]',
        href && 'hover:border-[#ff6b35]/50',
      )}
    >
      {accent && <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#ff6b35]/30 blur-3xl" />}
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[11px] font-medium uppercase tracking-wider text-zinc-400 sm:text-xs">{label}</p>
        {icon && <span className={cx('hidden rounded-lg p-1.5 sm:inline-flex', accent ? 'bg-[#ff6b35]/20 text-[#ff8a5c]' : 'bg-white/5 text-zinc-400')}>{icon}</span>}
      </div>
      <p className="mt-2 font-[family-name:var(--font-rajdhani)] text-3xl sm:text-5xl font-bold leading-none text-white tabular-nums">
        {value}
      </p>
      <p className="mt-2 text-xs leading-snug text-zinc-400">{hint}</p>
      {delta !== undefined && (
        <div className="mt-2">
          <Delta value={delta} label={deltaLabel} />
        </div>
      )}
    </div>
  );
  return href ? (
    <a href={href} className="block h-full">
      {inner}
    </a>
  ) : (
    inner
  );
}

type Tone = 'green' | 'amber' | 'red' | 'zinc' | 'orange' | 'blue';

const TONES: Record<Tone, string> = {
  green: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  amber: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  red: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
  zinc: 'bg-white/5 text-zinc-400 ring-white/10',
  orange: 'bg-[#ff6b35]/15 text-[#ff9a73] ring-[#ff6b35]/40',
  blue: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
};

export function Badge({ tone = 'zinc', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset', TONES[tone])}>
      {children}
    </span>
  );
}

/** Status članarine na osnovu datuma "važi do". */
export function ValidityBadge({ until, compact }: { until: Date | string | null | undefined; compact?: boolean }) {
  if (!until) return <Badge tone="zinc">{compact ? '?' : 'nema podatka o važenju'}</Badge>;
  if (isPast(until)) return <Badge tone="red">isteklo {fmtDate(until)}</Badge>;
  const d = Math.max(0, daysFromNow(until) ?? 0);
  if (d <= 7) return <Badge tone="amber">ističe {d === 0 ? 'danas' : `za ${d} ${d === 1 ? 'dan' : 'dana'}`} · {fmtDate(until)}</Badge>;
  return <Badge tone="green">važi do {fmtDate(until)}</Badge>;
}

export function Avatar({ name }: { name: string | null | undefined }) {
  const initials =
    (name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || '?';
  return (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 font-[family-name:var(--font-rajdhani)] text-sm font-bold text-zinc-200 ring-1 ring-white/10">
      {initials}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-4 py-10 text-center text-sm text-zinc-500">{children}</div>;
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{children}</div>
  );
}

/** Jednostavan stubičasti grafikon (CSS, bez biblioteke). */
export function Bars({
  data,
  height = 140,
  unit = '',
  labelEvery = 1,
}: {
  data: { label: string; value: number; title?: string; highlight?: boolean }[];
  height?: number;
  unit?: string;
  labelEvery?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="flex items-end gap-[3px] sm:gap-1" style={{ height }}>
        {data.map((d, i) => {
          const h = Math.max(d.value > 0 ? 4 : 2, Math.round((d.value / max) * height));
          return (
            <div key={i} className="group relative flex h-full flex-1 items-end" title={d.title ?? `${d.label}: ${d.value}${unit}`}>
              <div
                className={cx(
                  'w-full rounded-t-md transition-all',
                  d.value === 0
                    ? 'bg-white/5'
                    : d.highlight
                      ? 'bg-gradient-to-t from-[#e74c3c] to-[#ff8a5c]'
                      : 'bg-gradient-to-t from-[#ff6b35]/40 to-[#ff6b35]/80 group-hover:to-[#ff8a5c]',
                )}
                style={{ height: h }}
              />
              <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
                {d.value}
                {unit}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-[3px] sm:gap-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-zinc-500 tabular-nums">
            {i % labelEvery === 0 ? d.label : ''}
          </div>
        ))}
      </div>
    </div>
  );
}

export function pct(cur: number, prev: number): number | null {
  if (prev <= 0) return null;
  return ((cur - prev) / prev) * 100;
}
