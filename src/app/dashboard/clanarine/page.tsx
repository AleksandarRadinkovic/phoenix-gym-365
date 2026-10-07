// src/app/dashboard/clanarine/page.tsx — ko je produžio / uplatio članarinu
import { sql } from '@vercel/postgres';
import { CalendarPlus, CreditCard, UserPlus } from 'lucide-react';
import { RangeBar, Shell } from '@/components/dashboard/Shell';
import { Avatar, Badge, Card, Empty, Kpi, Notice, ValidityBadge } from '@/components/dashboard/ui';
import { drainQuietly } from '@/lib/gym/sync';
import { dayDiff, fmtDate, fmtTime, parseRange } from '@/lib/gym/time';

export const dynamic = 'force-dynamic';

type Sp = { [k: string]: string | string[] | undefined };

type Row = {
  id: number;
  dss_person_id: string;
  full_name: string | null;
  kind: 'produzenje' | 'nova';
  previous_until: string | null;
  new_until: string | null;
  renewed_at: string;
  current_until: string | null;
  cards: string | null;
};

export default async function RenewalsPage({ searchParams }: { searchParams: Sp }) {
  await drainQuietly();
  const r = parseRange(searchParams);

  const [list, ready] = await Promise.all([
    sql`
      SELECT g.id, g.dss_person_id, COALESCE(m.full_name, g.full_name) AS full_name, g.kind,
             g.previous_until, g.new_until, g.renewed_at, m.valid_until AS current_until,
             (SELECT string_agg(card_number, ', ') FROM gym_member_cards c WHERE c.dss_person_id = g.dss_person_id) AS cards
      FROM gym_renewals g
      LEFT JOIN gym_members m ON m.dss_person_id = g.dss_person_id
      WHERE g.renewed_at >= ${r.from}::date::timestamp AT TIME ZONE 'Europe/Sarajevo'
        AND g.renewed_at < (${r.to}::date + 1)::timestamp AT TIME ZONE 'Europe/Sarajevo'
      ORDER BY g.renewed_at DESC
      LIMIT 500`,
    sql`SELECT count(*)::int AS n FROM gym_members`,
  ]);

  const rows = list.rows as Row[];
  const membersReady = (ready.rows[0] as { n: number }).n > 0;
  const renewals = rows.filter((x) => x.kind === 'produzenje');
  const fresh = rows.filter((x) => x.kind === 'nova');
  const addedDays = rows.reduce((s, x) => s + Math.max(0, dayDiff(x.previous_until ?? x.renewed_at, x.new_until) ?? 0), 0);

  // grupisanje po danu (lokalno)
  const groups = new Map<string, Row[]>();
  for (const x of rows) {
    const key = fmtDate(x.renewed_at);
    groups.set(key, [...(groups.get(key) ?? []), x]);
  }

  return (
    <Shell active="clanarine" title="Članarine" subtitle="Ko je produžio ili kupio članarinu — prema promjeni važenja kartice u DSS-u">
      <RangeBar range={r} basePath="/dashboard/clanarine" />

      {!membersReady && (
        <div className="mb-5">
          <Notice>
            Još nema podataka o važenju kartica sa DSS računara. Kad se skripta tamo ažurira, svaka promjena datuma
            važenja će se ovdje pojaviti kao produženje.
          </Notice>
        </div>
      )}

      <section className="grid grid-cols-3 gap-3">
        <Kpi accent label="Produženja" value={renewals.length} hint="Postojeći članovi" icon={<CreditCard className="h-4 w-4" />} />
        <Kpi label="Nove" value={fresh.length} hint="Novi članovi" icon={<UserPlus className="h-4 w-4" />} />
        <Kpi label="Dani" value={addedDays} hint="Ukupno dodatih dana" icon={<CalendarPlus className="h-4 w-4" />} />
      </section>

      <div className="mt-5 space-y-5">
        {rows.length === 0 && (
          <Card>
            <Empty>Nema produženja u odabranom periodu.</Empty>
          </Card>
        )}
        {Array.from(groups.entries()).map(([day, items]) => (
          <section key={day}>
            {groups.size > 1 && (
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {day} · {items.length}
              </p>
            )}
            <Card>
              <ul className="divide-y divide-white/[0.05]">
                {items.map((x) => {
                  const added = dayDiff(x.previous_until ?? x.renewed_at, x.new_until);
                  return (
                    <li key={x.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <Avatar name={x.full_name} />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-semibold text-white">{x.full_name ?? 'Bez imena'}</p>
                            {x.kind === 'nova' ? <Badge tone="blue">Nova</Badge> : <Badge tone="orange">Produženje</Badge>}
                          </div>
                          {x.cards && <p className="truncate text-xs text-zinc-500">Kartica {x.cards}</p>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <div className="text-sm">
                          <p className="text-zinc-400">
                            {x.previous_until ? (
                              <>
                                <span className="line-through decoration-zinc-600">{fmtDate(x.previous_until)}</span>
                                <span className="mx-1.5 text-zinc-600">→</span>
                              </>
                            ) : (
                              <span className="mr-1.5">važi do</span>
                            )}
                            <span className="font-semibold text-white">{fmtDate(x.new_until)}</span>
                          </p>
                          <p className="text-[11px] text-zinc-500">evidentirano u {fmtTime(x.renewed_at)}</p>
                        </div>
                        <div className="min-w-[64px] text-right">
                          {added !== null && added > 0 && (
                            <p className="font-[family-name:var(--font-rajdhani)] text-2xl font-bold leading-none text-emerald-400">
                              +{added}
                              <span className="ml-0.5 text-xs font-semibold text-emerald-500/80">dana</span>
                            </p>
                          )}
                          {x.current_until && x.new_until && dayDiff(x.new_until, x.current_until) !== 0 && (
                            <div className="mt-1">
                              <ValidityBadge until={x.current_until} compact />
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </section>
        ))}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-zinc-500">
        Produženje se bilježi kada se u DSS-u osobi pomjeri datum važenja kartice unaprijed. Vrijeme je ono kada je
        promjena stigla u panel (najviše nekoliko minuta nakon unosa).
      </p>
    </Shell>
  );
}
