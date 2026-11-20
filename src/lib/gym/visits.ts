// src/lib/gym/visits.ts
//
// Od pojedinačnih provlačenja kartice pravi ULASKE i označava sumnjive.
// Ista pravila koristi i skripta za upozorenje na recepciji (tools/dss-sync/dss_alert.py).
//
//   - Sva provlačenja u roku od DUP_SECONDS od početka ulaska su isti ulazak
//     (vrata nisu pročitala karticu iz prve, pa je provučena ponovo).
//   - Ulazak je SUMNJIV ako je prethodni ulazak iste osobe:
//       a) u istom "danu teretane" (dan traje od 05:00 do 05:00), ili
//       b) prije manje od MIN_GAP_HOURS sati (npr. 23:00 pa 07:00).
//   - Provlačenje kartice kojoj je članarina već istekla nije ulazak (vrata ne puštaju).

import { TZ, fmtTime } from './time';

export const DUP_SECONDS = 120;
export const MIN_GAP_HOURS = 10;
export const DAY_START_HOUR = 5;

export type Visit = {
  start: Date;
  swipes: Date[];
  /** redni broj ulaska u danu teretane (1, 2, 3…) */
  n: number;
  gymDay: string;
  suspicious: boolean;
  /** prethodni ulazak iste osobe (ako postoji) */
  prev: Date | null;
  /** minuta od prethodnog ulaska */
  gapMin: number | null;
  reason: string | null;
};

const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });

/** Dan teretane (YYYY-MM-DD): ulazak u 00:30 pripada prethodnom danu. */
export function gymDay(d: Date): string {
  return dayFmt.format(new Date(d.getTime() - DAY_START_HOUR * 3_600_000));
}

/** "3 h 12 min", "45 min" */
export function fmtGap(min: number): string {
  const m = Math.round(min);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

/** Sva provlačenja jedne osobe -> ulasci (od najstarijeg). */
export function buildVisits(times: (Date | string)[], validUntil?: Date | string | null): Visit[] {
  const exp = validUntil ? new Date(validUntil).getTime() : null;
  const sorted = times
    .map((t) => (t instanceof Date ? t : new Date(t)))
    .filter((t) => !Number.isNaN(t.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  const visits: Visit[] = [];
  for (const t of sorted) {
    const last = visits[visits.length - 1];
    if (last && (t.getTime() - last.start.getTime()) / 1000 < DUP_SECONDS) {
      last.swipes.push(t);
      continue;
    }
    const day = gymDay(t);
    const prev = last ? last.start : null;
    const gapMin = prev ? (t.getTime() - prev.getTime()) / 60_000 : null;
    const sameDay = !!last && last.gymDay === day;
    const tooSoon = gapMin !== null && gapMin < MIN_GAP_HOURS * 60;
    // Kartica sa isteklom članarinom: vrata je ne puštaju, to nije stvarni drugi ulazak.
    const expired = exp !== null && t.getTime() > exp;
    const suspicious = !!prev && !expired && (sameDay || tooSoon);
    const n = sameDay && last ? last.n + 1 : 1;
    let reason: string | null = null;
    if (suspicious && prev && gapMin !== null) {
      reason = sameDay
        ? `${n}. ulazak istog dana · ${fmtGap(gapMin)} nakon ulaska u ${fmtTime(prev)}`
        : `samo ${fmtGap(gapMin)} nakon ulaska u ${fmtTime(prev)} prethodnog dana`;
    }
    visits.push({ start: t, swipes: [t], n, gymDay: day, suspicious, prev, gapMin, reason });
  }
  return visits;
}
