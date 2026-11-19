// src/lib/gym/packages.ts
//
// Paketi članarine i cijene. DSS ne čuva iznos uplate, pa paket prepoznajemo po
// tome koliko je dana dodato na važenje kartice. Cijene se mijenjaju samo ovdje.

export type PackageKey = 'mjesecna' | 'dvomjesecna' | 'tromjesecna' | 'godisnja' | 'ostalo' | 'korekcija';

export type PackageInfo = {
  key: PackageKey;
  label: string;
  price: number; // KM (procjena za 'ostalo')
  days: number;
};

export const PRICES = {
  mjesecna: 60,
  tromjesecna: 165,
  godisnja: 600,
} as const;

export const PACKAGE_ORDER: PackageKey[] = ['mjesecna', 'dvomjesecna', 'tromjesecna', 'godisnja', 'ostalo', 'korekcija'];

export const PACKAGE_LABEL: Record<PackageKey, string> = {
  mjesecna: 'Mjesečna',
  dvomjesecna: '2 mjeseca',
  tromjesecna: 'Tromjesečna',
  godisnja: 'Godišnja',
  ostalo: 'Ostalo',
  korekcija: 'Korekcija',
};

/** Paket prema broju dodatih dana. */
export function classifyDays(days: number): PackageInfo {
  const d = Math.round(days);
  let key: PackageKey;
  let price: number;
  if (d < 20) {
    // ispravka datuma u DSS-u, ne uplata
    key = 'korekcija';
    price = 0;
  } else if (d <= 45) {
    key = 'mjesecna';
    price = PRICES.mjesecna;
  } else if (d <= 75) {
    key = 'dvomjesecna';
    price = PRICES.mjesecna * 2;
  } else if (d <= 135) {
    key = 'tromjesecna';
    price = PRICES.tromjesecna;
  } else if (d >= 300 && d <= 420) {
    key = 'godisnja';
    price = PRICES.godisnja;
  } else {
    // neobična dužina: procjena po mjesečnoj cijeni
    key = 'ostalo';
    price = Math.round(d / 30) * PRICES.mjesecna;
  }
  return { key, label: key === 'ostalo' ? `${d} dana` : PACKAGE_LABEL[key], price, days: d };
}

type D = Date | string | null | undefined;

function ms(v: D): number | null {
  if (!v) return null;
  const t = (v instanceof Date ? v : new Date(v)).getTime();
  return Number.isNaN(t) ? null : t;
}

/**
 * Koliko je dana plaćeno jednim produženjem.
 * Ako je stara članarina još važila, broji se od starog datuma isteka;
 * ako je već bila istekla (ili je nova/uplata), od dana uplate.
 */
export function paidDays(r: { previous_until: D; new_until: D; renewed_at: D }): number | null {
  const end = ms(r.new_until);
  const paidAt = ms(r.renewed_at);
  if (end === null || paidAt === null) return null;
  const prev = ms(r.previous_until);
  const start = prev !== null && prev > paidAt ? prev : paidAt;
  const days = (end - start) / 86_400_000;
  return days > 0 ? Math.round(days) : null;
}

export function classifyRenewal(r: { previous_until: D; new_until: D; renewed_at: D }): PackageInfo | null {
  const d = paidDays(r);
  return d === null ? null : classifyDays(d);
}

export function fmtKM(n: number): string {
  return `${Math.round(n).toLocaleString('sr-Latn-BA')} KM`;
}

export type PackageSummary = {
  total: number;
  count: number;
  byKey: Record<PackageKey, { count: number; total: number }>;
};

export function summarize(rows: { previous_until: D; new_until: D; renewed_at: D }[]): PackageSummary {
  const byKey = Object.fromEntries(PACKAGE_ORDER.map((k) => [k, { count: 0, total: 0 }])) as PackageSummary['byKey'];
  let total = 0;
  let count = 0;
  for (const r of rows) {
    const p = classifyRenewal(r);
    if (!p) continue;
    byKey[p.key].count++;
    byKey[p.key].total += p.price;
    if (p.key !== 'korekcija') {
      count++;
      total += p.price;
    }
  }
  return { total, count, byKey };
}
