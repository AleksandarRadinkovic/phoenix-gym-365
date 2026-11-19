// src/app/dashboard/clanarine/page.tsx — ko je produžio / uplatio članarinu
import { sql } from '@vercel/postgres';
import { CreditCard, UserPlus, Wallet } from 'lucide-react';
import { RangeBar, Shell } from '@/components/dashboard/Shell';
import { Avatar, Badge, Bars, Card, Empty, Kpi, Notice, SectionTitle, ValidityBadge } from '@/components/dashboard/ui';
import { PACKAGE_LABEL, PACKAGE_ORDER, classifyRenewal, fmtKM, summarize } from '@/lib/gym/packages';
import { drainQuietly } from '@/lib/gym/sync';
import { dayDiff, fmtDate, fmtTime, localDay, parseRange } from '@/lib/gym/time';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'];

export const dynamic = 'force-dynamic';
// Bez Next.js keša za SQL upite (inače panel prikazuje stare brojke).
export const fetchCache = 'force-no-store';
export const revalidate = 0;

type Sp = { [k: string]: string | string[] | undefined };

type Row = {
  id: number;
  dss_person_id: string;
  full_name: string | null;
  kind: 'produzenje' | 'nova' | 'uplata';
  previous_until: string | null;
  new_until: string | null;
  renewed_at: string;
  current_until: string | null;
  cards: string | null;
};

export default async function RenewalsPage({ searchParams }: { searchParams: Sp }) {
  await drainQuietly();
  const r = parseRange(searchParams);

  const year = new Date().getFullYear();
  const [list, ready, yearRes] = await Promise.all([
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
    // Sve uplate ove godine (za prihod po mjesecima)
    sql`
      SELECT previous_until, new_until, renewed_at
      FROM gym_renewals
      WHERE renewed_at >= make_date(${year}::int, 1, 1)::timestamp AT TIME ZONE 'Europe/Sarajevo'`,
  ]);

  const rows = list.rows as Row[];
  const membersReady = (ready.rows[0] as { n: number }).n > 0;
  const renewals = rows.filter((x) => x.kind !== 'nova');
  const fresh = rows.filter((x) => x.kind === 'nova');
  const sum = summarize(rows);

  // Prihod po mjesecima ove godine
  const monthly = Array(12).fill(0) as number[];
  for (const x of yearRes.rows as Pick<Row, 'previous_until' | 'new_until' | 'renewed_at'>[]) {
    const p = classifyRenewal(x);
    const day = localDay(x.renewed_at);
    if (!p || !day || Number(day.slice(0, 4)) !== year) continue;
    monthly[Number(day.slice(5, 7)) - 1] += p.price;
  }
  const yearTotal = monthly.reduce((a, b) => a + b, 0);
  const thisMonth = new Date().getMonth();

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
        <Kpi accent label="Prihod" value={fmtKM(sum.total)} hint={`${sum.count} plaćenih članarina (po cjenovniku)`} icon={<Wallet className="h-4 w-4" />} />
        <Kpi label="Produženja" value={renewals.length} hint="Postojeći članovi" icon={<CreditCard className="h-4 w-4" />} />
        <Kpi label="Nove" value={fresh.length} hint="Novi članovi" icon={<UserPlus className="h-4 w-4" />} />
      </section>

      {sum.count > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {PACKAGE_ORDER.filter((k) => sum.byKey[k].count > 0).map((k) => (
            <span key={k} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300">
              <span className="font-semibold text-white">{PACKAGE_LABEL[k]}</span> · {sum.byKey[k].count}×
              {sum.byKey[k].total > 0 ? <span className="text-emerald-400"> · {fmtKM(sum.byKey[k].total)}</span> : null}
            </span>
          ))}
        </div>
      )}

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
                  const pkg = classifyRenewal(x);
                  return (
                    <li key={x.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                      <a href={`/dashboard/clanovi/${encodeURIComponent(x.dss_person_id)}`} className="group flex min-w-0 flex-1 items-center gap-3">
                        <Avatar name={x.full_name} />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-semibold text-white group-hover:text-[#ff8a5c]">{x.full_name ?? 'Bez imena'}</p>
                            {x.kind === 'nova' ? <Badge tone="blue">Nova</Badge> : x.kind === 'uplata' ? <Badge tone="zinc">Članarina</Badge> : <Badge tone="orange">Produženje</Badge>}
                            {pkg && <Badge tone={pkg.key === 'korekcija' ? 'zinc' : 'green'}>{pkg.label}</Badge>}
                          </div>
                          {x.cards && <p className="truncate text-xs text-zinc-500">Kartica {x.cards}</p>}
                        </div>
                      </a>

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
                          <p className="text-[11px] text-zinc-500">
                            {x.kind === 'uplata' ? `počinje ${fmtDate(x.renewed_at)}` : `evidentirano u ${fmtTime(x.renewed_at)}`}
                          </p>
                        </div>
                        <div className="min-w-[64px] text-right">
                          {pkg && (
                            <p className="font-[family-name:var(--font-rajdhani)] text-2xl font-bold leading-none text-emerald-400">
                              {pkg.price > 0 ? fmtKM(pkg.price) : `+${pkg.days} d`}
                            </p>
                          )}
                          {pkg && pkg.price > 0 && <p className="mt-0.5 text-[11px] text-zinc-500">+{pkg.days} dana</p>}
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

      <section className="mt-6">
        <Card className="p-4 sm:p-5">
          <SectionTitle title={`Prihod ${year}`} hint={`Po mjesecima, po cjenovniku · ukupno ${fmtKM(yearTotal)}`} />
          <Bars
            data={monthly.map((v, i) => ({ label: MONTHS[i], value: v, title: `${MONTHS[i]}: ${fmtKM(v)}`, highlight: i === thisMonth }))}
            height={150}
            unit=" KM"
          />
        </Card>
      </section>

      <p className="mt-6 text-xs leading-relaxed text-zinc-500">
        Iznos se računa po cjenovniku prema broju plaćenih dana: ~30 dana = mjesečna 60 KM, ~60 dana = 2 mjeseca 120 KM,
        ~90 dana = tromjesečna 165 KM, ~365 dana = godišnja 600 KM. Pomjeranje manje od 20 dana je „korekcija” i ne
        ulazi u prihod.
        Produženje se bilježi kada se u DSS-u osobi pomjeri datum važenja kartice unaprijed (vrijeme unosa u DSS-u,
        u panelu najviše nekoliko minuta kasnije). Stavke označene „Članarina“ su uplate od prije povezivanja panela
        (7.10.2026.) — pročitane iz DSS-a prema danu početka članarine.
      </p>
    </Shell>
  );
}
