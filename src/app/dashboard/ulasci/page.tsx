// src/app/dashboard/ulasci/page.tsx — ko je ušao i do kada mu važi kartica
import { sql } from '@vercel/postgres';
import { AlertTriangle, DoorOpen, HelpCircle, Search } from 'lucide-react';
import { RangeBar, Shell } from '@/components/dashboard/Shell';
import { Avatar, Badge, Card, Empty, Kpi, ValidityBadge } from '@/components/dashboard/ui';
import { drainQuietly } from '@/lib/gym/sync';
import { fmtDate, fmtTime, parseRange } from '@/lib/gym/time';

export const dynamic = 'force-dynamic';

type Sp = { [k: string]: string | string[] | undefined };

type Row = {
  card_number: string;
  day: string;
  first_in: string;
  last_swipe: string;
  swipes: number;
  name: string | null;
  dss_person_id: string | null;
  valid_until: string | null;
};

function one(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? '';
}

export default async function EntriesPage({ searchParams }: { searchParams: Sp }) {
  await drainQuietly();
  const r = parseRange(searchParams);
  const q = one(searchParams.q).trim().slice(0, 60);
  const like = `%${q}%`;

  // Jedan red = jedan član u jednom danu (prvi ulaz + broj provlačenja)
  const res = await sql`
    WITH v AS (
      SELECT e.card_number,
             to_char((e.event_time AT TIME ZONE 'Europe/Sarajevo')::date, 'YYYY-MM-DD') AS day,
             min(e.event_time) AS first_in,
             max(e.event_time) AS last_swipe,
             count(*)::int AS swipes,
             max(e.person_name) AS pname
      FROM gym_entries e
      WHERE e.card_number IS NOT NULL AND e.card_number <> ''
        AND e.event_time >= ${r.from}::date::timestamp AT TIME ZONE 'Europe/Sarajevo'
        AND e.event_time < (${r.to}::date + 1)::timestamp AT TIME ZONE 'Europe/Sarajevo'
      GROUP BY 1, 2
    )
    SELECT v.card_number, v.day, v.first_in, v.last_swipe, v.swipes,
           COALESCE(m.full_name, v.pname) AS name, m.dss_person_id, m.valid_until
    FROM v
    LEFT JOIN gym_member_cards c ON c.card_number = v.card_number
    LEFT JOIN gym_members m ON m.dss_person_id = c.dss_person_id
    WHERE (${q} = '' OR COALESCE(m.full_name, v.pname) ILIKE ${like} OR v.card_number ILIKE ${like})
    ORDER BY v.first_in DESC
    LIMIT 600`;

  const rows = res.rows as Row[];
  const unknown = rows.filter((x) => !x.name).length;
  const expiredIn = rows.filter((x) => x.valid_until && new Date(x.valid_until).getTime() < new Date(x.first_in).getTime()).length;

  const groups = new Map<string, Row[]>();
  for (const x of rows) groups.set(x.day, [...(groups.get(x.day) ?? []), x]);

  return (
    <Shell active="ulasci" title="Ulasci" subtitle="Ko je ušao, kada, i do kada mu važi kartica">
      <RangeBar range={r} basePath="/dashboard/ulasci" keep={{ q }} />

      <form action="/dashboard/ulasci" method="get" className="mb-4">
        {r.preset ? <input type="hidden" name="p" value={r.preset} /> : null}
        {!r.preset ? <input type="hidden" name="od" value={r.from} /> : null}
        {!r.preset ? <input type="hidden" name="do" value={r.to} /> : null}
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

      <section className="grid grid-cols-3 gap-3">
        <Kpi accent label="Dolasci" value={rows.length} hint="Član jednom po danu" icon={<DoorOpen className="h-4 w-4" />} />
        <Kpi label="Istekla" value={expiredIn} hint="Ušli sa isteklom karticom" icon={<AlertTriangle className="h-4 w-4" />} />
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
                  const expired = x.valid_until && new Date(x.valid_until).getTime() < new Date(x.first_in).getTime();
                  return (
                    <li key={`${x.card_number}-${x.day}`} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                      <div className="w-12 shrink-0 text-center">
                        <p className="font-[family-name:var(--font-rajdhani)] text-xl font-bold leading-none text-white tabular-nums">
                          {fmtTime(x.first_in)}
                        </p>
                      </div>
                      <Avatar name={x.name} />
                      <div className="min-w-0 flex-1">
                        <p className={x.name ? 'truncate font-semibold text-white' : 'truncate font-semibold text-zinc-500'}>
                          {x.name ?? 'Nepoznata kartica'}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          Kartica {x.card_number}
                          {x.swipes > 1 ? ` · ${x.swipes}× provučena, zadnje ${fmtTime(x.last_swipe)}` : ''}
                        </p>
                        <div className="mt-1.5 sm:hidden">
                          {expired ? <Badge tone="red">ušao sa isteklom karticom</Badge> : <ValidityBadge until={x.valid_until} />}
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        {expired ? <Badge tone="red">ušao sa isteklom karticom</Badge> : <ValidityBadge until={x.valid_until} />}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </section>
        ))}
      </div>
      {rows.length === 600 && <p className="mt-3 text-xs text-zinc-500">Prikazano zadnjih 600 dolazaka — suzi period ili pretragu.</p>}
    </Shell>
  );
}
