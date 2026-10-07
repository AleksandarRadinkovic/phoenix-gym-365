// src/lib/gym/time.ts
// Sve datume u panelu računamo i prikazujemo po bosanskom vremenu.

export const TZ = 'Europe/Sarajevo';

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export type PresetKey = 'danas' | 'juce' | '7d' | '30d' | 'mjesec';

export const PRESETS: { key: PresetKey; label: string }[] = [
  { key: 'danas', label: 'Danas' },
  { key: 'juce', label: 'Juče' },
  { key: '7d', label: '7 dana' },
  { key: '30d', label: '30 dana' },
  { key: 'mjesec', label: 'Ovaj mjesec' },
];

export type DateRange = {
  from: string; // YYYY-MM-DD (lokalno)
  to: string; // YYYY-MM-DD (lokalno, uključivo)
  preset: PresetKey | null;
  days: number;
  label: string;
};

export function todayLocal(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

export function diffDays(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function shortDay(day: string): string {
  const [, m, d] = day.split('-');
  return `${d}.${m}.`;
}

export function longDay(day: string): string {
  const [y, m, d] = day.split('-');
  return `${d}.${m}.${y}.`;
}

export function parseRange(sp: Record<string, string | string[] | undefined>): DateRange {
  const today = todayLocal();
  const p = first(sp.p) as PresetKey | undefined;
  let od = first(sp.od);
  let dO = first(sp.do);

  if (od && ISO_DAY.test(od)) {
    if (!dO || !ISO_DAY.test(dO)) dO = od;
    if (od > dO) [od, dO] = [dO, od];
    if (diffDays(od, dO) > 366) od = addDays(dO, -366);
    return build(od, dO, null);
  }

  switch (p) {
    case 'juce': {
      const y = addDays(today, -1);
      return build(y, y, 'juce');
    }
    case '7d':
      return build(addDays(today, -6), today, '7d');
    case '30d':
      return build(addDays(today, -29), today, '30d');
    case 'mjesec':
      return build(`${today.slice(0, 7)}-01`, today, 'mjesec');
    default:
      return build(today, today, 'danas');
  }
}

function build(from: string, to: string, preset: PresetKey | null): DateRange {
  const days = diffDays(from, to) + 1;
  const presetLabel = PRESETS.find((x) => x.key === preset)?.label;
  const label =
    from === to
      ? `${presetLabel ? presetLabel + ' · ' : ''}${longDay(from)}`
      : `${presetLabel ? presetLabel + ' · ' : ''}${shortDay(from)} – ${longDay(to)}`;
  return { from, to, preset, days, label };
}

/** Isti broj dana neposredno prije zadanog perioda (za poređenje). */
export function previousRange(r: DateRange): DateRange {
  const to = addDays(r.from, -1);
  const from = addDays(to, -(r.days - 1));
  return build(from, to, null);
}

export function rangeQuery(r: DateRange): string {
  return r.preset ? `p=${r.preset}` : `od=${r.from}&do=${r.to}`;
}

type D = Date | string | null | undefined;

function toDate(v: D): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function fmtDate(v: D): string {
  const d = toDate(v);
  if (!d) return '—';
  return d.toLocaleDateString('sr-Latn-BA', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function fmtTime(v: D): string {
  const d = toDate(v);
  if (!d) return '—';
  return d.toLocaleTimeString('sr-Latn-BA', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
}

export function fmtDateTime(v: D): string {
  const d = toDate(v);
  if (!d) return '—';
  return `${fmtDate(d)} ${fmtTime(d)}`;
}

/** Kalendarski dan (YYYY-MM-DD) po bosanskom vremenu. */
export function localDay(v: D): string | null {
  const d = toDate(v);
  if (!d) return null;
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/** Kalendarski dani od danas do datuma (0 = danas, 1 = sutra, -1 = juče). */
export function daysFromNow(v: D): number | null {
  const day = localDay(v);
  if (!day) return null;
  return diffDays(todayLocal(), day);
}

export function isPast(v: D): boolean {
  const d = toDate(v);
  return !!d && d.getTime() < Date.now();
}

/** "danas", "juče", "prije 5 dana" */
export function agoLabel(v: D): string {
  const n = daysFromNow(v);
  if (n === null) return '—';
  if (n >= 0) return 'danas';
  if (n === -1) return 'juče';
  return `prije ${-n} dana`;
}

export function dayDiff(a: D, b: D): number | null {
  const x = toDate(a);
  const y = toDate(b);
  if (!x || !y) return null;
  return Math.round((y.getTime() - x.getTime()) / 86_400_000);
}
