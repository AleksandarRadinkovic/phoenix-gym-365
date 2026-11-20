// src/app/dashboard/ulasci/page.tsx — ko je ušao i do kada mu važi kartica
import { sql } from '@vercel/postgres';
import { AlertTriangle, DoorOpen, HelpCircle, Search, ShieldAlert } from 'lucide-react';
import { RangeBar, Shell } from '@/components/dashboard/Shell';
import { Avatar, Badge, Card, Empty, Kpi, ValidityBadge } from '@/components/dashboard/ui';
import { VisitDetails } from '@/components/dashboard/VisitDetails';
import { drainQuietly } from '@/lib/gym/sync';
import { fmtDate, fmtTime, parseRange, rangeQuery } from '@/lib/gym/time';
import { buildVisits, type Visit } from '@/lib/gym/visits';

export const dynamic = 'force-dynamic';
// Bez Next.js keša za SQL upite (inače panel prikazuje stare brojke).
export const fetchCache = 'force-no-store';
export const revalidate = 0;

type Sp = { [k: string]: string | string[] | undefined };

type Swipe = {
  card_number: string;
  event_time: string;
  name: string | null;
  dss_person_id: string | null;
  valid_until: string | null;
};

type DayRow = {
  key: string;
  day: string;
  card_number: string;
  name: string | null;
  dss_person_id: string | null;
  valid_until: string | null;
  visits: Visit[];
  first_in: Date;
  suspicious: boolean;
};

function one(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? '';
}

export default async function EntriesPage({ searchParams }: { searchParams: Sp }) {
  await drainQuietly();
  const r = parseRange(searchParams);
  const q = one(searchParams.q).trim().slice(0, 60);
  const onlySuspicious = one(searchParams.sumnjivo) === '1';
  const like = `%${q}%`;

  // Sva provlačenja u periodu (dan teretane traje do 05:00 sljedećeg jutra)
  // + dan ranije, da se vidi prethodni ulazak (npr. 23:00 pa 07:00).
  const res = await sql`
    SELECT e.card_number, e.event_time,
           COALESCE(m.full_name, e.person_name) AS name, m.dss_person_id, m.valid_until
    FROM gym_entries e
    LEFT JOIN gym_member_cards c ON c.card_number = e.card_number
    LEFT JOIN gym_members m ON m.dss_person_id = c.dss_person_id
    WHERE e.card_number IS NOT NULL AND e.card_number <> ''
      AND e.event_time >= (${r.from}::date - 1)::timestamp AT TIME ZONE 'Europe/Sarajevo'
      AND e.event_time < ((${r.to}::date + 1)::timestamp + interval '5 hours') AT TIME ZONE 'Europe/Sarajevo'
      AND (${q} = '' OR COALESCE(m.full_name, e.person_name) ILIKE ${like} OR e.card_number ILIKE ${like})
    ORDER BY e.event_time`;

  // Po osobi (ili kartici bez osobe) -> ulasci -> redovi po danu teretane
  const byPerson = new Map<string, Swipe[]>();
  for (const x of res.rows as Swipe[]) {
    const k = x.dss_person_id ? `p:${x.dss_person_id}` : `c:${x.card_number}`;
    byPerson.set(k, [...(byPerson.get(k) ?? []), x]);
  }
  let rows: DayRow[] = [];
  for (const [k, list] of Array.from(byPerson.entries())) {
    const info = list[list.length - 1];
    const visits = buildVisits(list.map((x) => x.event_time), info.valid_until);
    const days = new Map<string, Visit[]>();
    for (const v of visits) {
      if (v.gymDay < r.from || v.gymDay > r.to) continue;
      days.set(v.gymDay, [...(days.get(v.gymDay) ?? []), v]);
    }
    for (const [day, vs] of Array.from(days.entries())) {
      rows.push({
        key: `${k}-${day}`,
        day,
        card_number: list.find((x) => new Date(x.event_time).getTime() === vs[0].start.getTime())?.card_number ?? info.card_number,
        name: info.name,
        dss_person_id: info.dss_person_id,
        valid_until: info.valid_until,
        visits: vs,
        first_in: vs[0].start,
        suspicious: vs.some((v) => v.suspicious),
      });
    }
  }
  rows.sort((a, b) => b.first_in.getTime() - a.first_in.getTime());
  const suspiciousCount = rows.filter((x) => x.suspicious).length;
  if (onlySuspicious) rows = rows.filter((x) => x.suspicious);
  const total = rows.length;
  rows = rows.slice(0, 600);

  const unknown = rows.filter((x) => !x.name).length;
  const expiredIn = rows.filter((x) => x.valid_until && new Date(x.valid_until).getTime() < x.first_in.getTime()).length;

  const groups = new Map<string, DayRow[]>();
  for (const x of rows) groups.set(x.day, [...(groups.get(x.day) ?? []), x]);

  const qs = (extra: Record<string, string>) => {
    const p = new URLSearchParams(rangeQuery(r));
    if (q) p.set('q', q);
    for (const [k, v] of Object.entries(extra)) if (v) p.set(k, v);
    return `/dashboard/ulasci?${p.toString()}`;
  };

  return (
    <Shell active="ulasci" title="Ulasci" subtitle="Ko je ušao, kada, i do kada mu važi kartica">
      <RangeBar range={r} basePath="/dashboard/ulasci" keep={{ q, sumnjivo: onlySuspicious ? '1' : undefined }} />

      <form action="/dashboard/ulasci" method="get" className="mb-4">
        {r.preset ? <input type="hidden" name="p" value={r.preset} /> : null}
        {!r.preset ? <input type="hidden" name="od" value={r.from} /> : null}
        {!r.preset ? <input type="hidden" name="do" value={r.to} /> : null}
        {onlySuspicious ? <input type="hidden" name="sumnjivo" value="1" /> : null}
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-[#ff6b35]/60">
          <Search className="h-5 w-5 text-zinc-500" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Traži osobu ili karticu…"
            className="w-full bg-transparent text-base text-white placeholder:text-zinc-500 focus:outline-none"
          />
        </label>
      </form>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi accent label="Dolasci" value={total} hint="Član jednom po danu" icon={<DoorOpen className="h-4 w-4" />} />
        <a href={qs({ sumnjivo: onlySuspicious ? '' : '1' })} className="block">
          <Kpi
            label="Sumnjivi"
            value={suspiciousCount}
            hint={onlySuspicious ? 'Prikazani samo sumnjivi · klik za sve' : 'Više ulazaka isti dan ili <10 h · klik za spisak'}
            icon={<ShieldAlert className="h-4 w-4" />}
          />
        </a>
        <Kpi label="Istekla" value={expiredIn} hint="Provučena istekla kartica" icon={<AlertTriangle className="h-4 w-4" />} />
        <Kpi label="Nepoznate" value={unknown} hint="Kartica bez osobe" icon={<HelpCircle className="h-4 w-4" />} />
      </section>

      <div className="mt-5 space-y-5">
        {rows.length === 0 && (
          <Card>
            <Empty>Nema ulazaka u odabranom periodu.</Empty>
          </Card>
        )}
        {Array.from(groups.entries()).map(([day, items]) => (
          <section key={day}>
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {fmtDate(`${day}T12:00:00Z`)} · {items.length} dolazaka
            </p>
            <Card>
              <ul className="divide-y divide-white/[0.05]">
                {items.map((x) => {
                  const expired = x.valid_until && new Date(x.valid_until).getTime() < x.first_in.getTime();
                  const last = x.visits[x.visits.length - 1];
                  const summary =
                    x.visits.length > 1
                      ? `${x.visits.length} ulaska: ${x.visits.map((v) => fmtTime(v.start)).join(', ')}`
                      : x.suspicious
                        ? 'detalji ulaska'
                        : x.visits[0].swipes.length > 1
                          ? 'detalji provlačenja'
                          : '';
                  return (
                    <li key={x.key} className={`flex items-start gap-3 px-4 py-3 sm:px-5 ${x.suspicious ? 'bg-rose-500/[0.06]' : ''}`}>
                      <div className="w-12 shrink-0 pt-1 text-center">
                        <p className="font-[family-name:var(--font-rajdhani)] text-xl font-bold leading-none text-white tabular-nums">
                          {fmtTime(x.first_in)}
                        </p>
                      </div>
                      <Avatar name={x.name} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {x.dss_person_id ? (
                            <a href={`/dashboard/clanovi/${encodeURIComponent(x.dss_person_id)}`} className="truncate font-semibold text-white hover:text-[#ff8a5c]">
                              {x.name ?? 'Bez imena'}
                            </a>
                          ) : (
                            <p className={x.name ? 'truncate font-semibold text-white' : 'truncate font-semibold text-zinc-500'}>
                              {x.name ?? 'Nepoznata kartica'}
                            </p>
                          )}
                          {x.suspicious && <Badge tone="red">⚠ sumnjivo{x.visits.length > 1 ? ` · ${x.visits.length} ulaska` : ''}</Badge>}
                        </div>
                        <p className="truncate text-xs text-zinc-500">
                          Kartica {x.card_number}
                          {x.visits.length > 1 ? ` · zadnji ulazak ${fmtTime(last.start)}` : ''}
                        </p>
                        {summary && <VisitDetails visits={x.visits} summary={summary} />}
                        <div className="mt-1.5 sm:hidden">
                          {expired ? <Badge tone="red">kartica istekla {fmtDate(x.valid_until)}</Badge> : <ValidityBadge until={x.valid_until} />}
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        {expired ? <Badge tone="red">kartica istekla {fmtDate(x.valid_until)}</Badge> : <ValidityBadge until={x.valid_until} />}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </section>
        ))}
      </div>
      {total > 600 && <p className="mt-3 text-xs text-zinc-500">Prikazano zadnjih 600 od {total} dolazaka — suzi period ili pretragu.</p>}
      <p className="mt-6 text-xs leading-relaxed text-zinc-500">
        Dan teretane traje od 05:00 do 05:00 (ulazak u 00:30 pripada prethodnom danu). Provlačenja u roku od 2 minute su isti
        ulazak. Sumnjivo je ako ista osoba uđe više puta istog dana teretane ili manje od 10 sati nakon prethodnog ulaska
        (npr. 23:00 pa 07:00). Provlačenje istekle kartice ne broji se kao sumnjivo.
      </p>
    </Shell>
  );
}
