// src/components/dashboard/Shell.tsx
// Okvir internog panela: zaglavlje, navigacija (gore na desktopu, dole na telefonu)
// i izbor perioda.

import type { ReactNode } from 'react';
import { CalendarDays, CreditCard, DoorOpen, LayoutDashboard, LogOut, Users } from 'lucide-react';
import { PRESETS, type DateRange } from '@/lib/gym/time';
import { cx } from './ui';

export type TabKey = 'pregled' | 'clanarine' | 'clanovi' | 'ulasci';

const TABS: { key: TabKey; label: string; href: string; Icon: typeof Users }[] = [
  { key: 'pregled', label: 'Pregled', href: '/dashboard', Icon: LayoutDashboard },
  { key: 'clanarine', label: 'Članarine', href: '/dashboard/clanarine', Icon: CreditCard },
  { key: 'clanovi', label: 'Članovi', href: '/dashboard/clanovi', Icon: Users },
  { key: 'ulasci', label: 'Ulasci', href: '/dashboard/ulasci', Icon: DoorOpen },
];

export function Shell({
  active,
  title,
  subtitle,
  children,
}: {
  active: TabKey;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 antialiased">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(255,107,53,0.18),transparent_65%)]" />

      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <a href="/dashboard" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#e74c3c] font-[family-name:var(--font-rajdhani)] text-xl font-bold text-white shadow-lg shadow-[#ff6b35]/30">
              P
            </div>
            <div className="leading-tight">
              <p className="font-[family-name:var(--font-rajdhani)] text-lg font-bold tracking-wide text-white">
                PHOENIX <span className="text-[#ff6b35]">GYM 365</span>
              </p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Interni panel</p>
            </div>
          </a>

          <nav className="hidden items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1 md:flex">
            {TABS.map(({ key, label, href, Icon }) => (
              <a
                key={key}
                href={href}
                className={cx(
                  'flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition',
                  key === active ? 'bg-[#ff6b35] text-white shadow shadow-[#ff6b35]/30' : 'text-zinc-400 hover:bg-white/5 hover:text-white',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </a>
            ))}
          </nav>

          <a
            href="/api/dashboard-logout"
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-sm text-zinc-400 transition hover:border-white/20 hover:text-white"
            title="Odjava"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Odjava</span>
          </a>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 pb-28 pt-5 md:pb-12">
        <div className="mb-5">
          <h1 className="font-[family-name:var(--font-rajdhani)] text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
        </div>
        {children}
      </main>

      {/* Puna (ne prozirna) pozadina i vlastiti sloj: iOS Safari inače pomjera meni dok se skrola
          i skriva/prikazuje traka preglednika. Sjena ispod popunjava prostor da se sadržaj ne vidi ispod menija. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.08] bg-[#0c0c0f] pb-[env(safe-area-inset-bottom)] shadow-[0_120px_0_0_#0c0c0f] [transform:translateZ(0)] md:hidden">
        <div className="grid grid-cols-4">
          {TABS.map(({ key, label, href, Icon }) => (
            <a
              key={key}
              href={href}
              className={cx(
                'flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition',
                key === active ? 'text-[#ff6b35]' : 'text-zinc-500',
              )}
            >
              <span className={cx('rounded-xl px-4 py-1', key === active && 'bg-[#ff6b35]/15')}>
                <Icon className="h-5 w-5" />
              </span>
              {label}
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}

/** Izbor perioda: brzi izbori + ručno od–do. Radi bez JavaScript-a (GET forma). */
export function RangeBar({
  range,
  basePath,
  keep = {},
}: {
  range: DateRange;
  basePath: string;
  keep?: Record<string, string | undefined>;
}) {
  const extra = Object.entries(keep)
    .filter(([, v]) => v)
    .map(([k, v]) => `&${k}=${encodeURIComponent(v as string)}`)
    .join('');

  return (
    <div className="mb-5 space-y-3">
      {/* Brzi izbori se skrolaju; "Od – do" je van skrol-trake da mu se padajući prozor ne odsiječe. */}
      <div className="flex items-start gap-2">
      <div className="-ml-4 flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 pl-4 [scrollbar-width:none]">
        {PRESETS.map((p) => (
          <a
            key={p.key}
            href={`${basePath}?p=${p.key}${extra}`}
            className={cx(
              'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition',
              range.preset === p.key
                ? 'border-[#ff6b35] bg-[#ff6b35] text-white shadow shadow-[#ff6b35]/30'
                : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/25',
            )}
          >
            {p.label}
          </a>
        ))}
      </div>
        <details className="group relative shrink-0">
          <summary
            className={cx(
              'flex cursor-pointer list-none items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition',
              range.preset === null
                ? 'border-[#ff6b35] bg-[#ff6b35] text-white'
                : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/25',
            )}
          >
            <CalendarDays className="h-4 w-4" />
            Od – do
          </summary>
          <form
            action={basePath}
            method="get"
            className="fixed inset-x-4 top-40 z-40 rounded-2xl border border-white/10 bg-[#141417] p-4 shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-80"
          >
            {Object.entries(keep).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-xs text-zinc-400">
                Od
                <input
                  type="date"
                  name="od"
                  defaultValue={range.from}
                  required
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white [color-scheme:dark]"
                />
              </label>
              <label className="space-y-1 text-xs text-zinc-400">
                Do
                <input
                  type="date"
                  name="do"
                  defaultValue={range.to}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white [color-scheme:dark]"
                />
              </label>
            </div>
            <button className="mt-3 w-full rounded-lg bg-[#ff6b35] py-2.5 text-sm font-bold text-white hover:bg-[#ff7d4d]">
              Prikaži
            </button>
          </form>
        </details>
      </div>
      <p className="flex items-center gap-2 text-sm text-zinc-400">
        <CalendarDays className="h-4 w-4 text-[#ff6b35]" />
        {range.label}
      </p>
    </div>
  );
}
