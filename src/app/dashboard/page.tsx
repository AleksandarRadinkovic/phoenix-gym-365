// src/app/dashboard/page.tsx — Pregled
import { sql } from '@vercel/postgres';
import { Activity, AlertTriangle, CreditCard, Flame, ShieldCheck, Users } from 'lucide-react';
import { RangeBar, Shell } from '@/components/dashboard/Shell';
import { Avatar, Badge, Bars, Card, Empty, Kpi, Notice, SectionTitle, ValidityBadge, pct } from '@/components/dashboard/ui';
import { drainQuietly } from '@/lib/gym/sync';
import {
  agoLabel,
  dayDiff,
  fmtDate,
  fmtDateTime,
  parseRange,
  previousRange,
  rangeQuery,
  shortDay,
  todayLocal,
} from '@/lib/gym/time';

export const dynamic = 'force-dynamic';
// Bez Next.js keša za SQL upite (inače panel prikazuje stare brojke).
export const fetchCache = 'force-no-store';
export const revalidate = 0;

type Sp = { [k: string]: string | string[] | undefined };

export default async function OverviewPage({ searchParams }: { searchParams: Sp }) {
  await drainQuietly();

  const r = parseRange(searchParams);
  const prev = previousRange(r);
  const isToday = r.from === r.to && r.to === todayLocal();

  const [cur, before, daily, hourly, renewals, members, expiring, latestRenewals] = await Promise.all([
    sql`
      SELECT count(*)::int AS visits, count(DISTINCT card_number)::int AS people
      FROM (
        SELECT DISTINCT card_number, (event_time AT TIME ZONE 'Europe/Sarajevo')::date AS d
        FROM gym_entries
        WHERE card_number IS NOT NULL AND card_number <> ''
          AND event_time >= ${r.from}::date::timestamp AT TIME ZONE 'Europe/Sarajevo'
          AND event_time < (${r.to}::date + 1)::timestamp AT TIME ZONE 'Europe/Sarajevo'
      ) s`,
    // Prethodni period iste dužine; ako period uključuje danas, poredi do istog doba dana.
    sql`
      SELECT count(*)::int AS visits, count(DISTINCT card_number)::int AS people
      FROM (
        SELECT DISTINCT card_number, (event_time AT TIME ZONE 'Europe/Sarajevo')::date AS d
        FROM gym_entries
        WHERE card_number IS NOT NULL AND card_number <> ''
          AND event_time >= ${prev.from}::date::timestamp AT TIME ZONE 'Europe/Sarajevo'
          AND event_time < LEAST(
            (${prev.to}::date + 1)::timestamp AT TIME ZONE 'Europe/Sarajevo',
            now() - make_interval(days => ${r.days}::int)
          )
      ) s`,
    sql`
      SELECT to_char(g.d, 'YYYY-MM-DD') AS day, COALESCE(v.visits, 0)::int AS visits
      FROM generate_series(${r.from}::date, ${r.to}::date, interval '1 day') AS g(d)
      LEFT JOIN (
        SELECT (event_time AT TIME ZONE 'Europe/Sarajevo')::date AS d, count(DISTINCT card_number) AS visits
        FROM gym_entries
        WHERE card_number IS NOT NULL AND card_number <> ''
          AND event_time >= ${r.from}::date::timestamp AT TIME ZONE 'Europe/Sarajevo'
          AND event_time < (${r.to}::date + 1)::timestamp AT TIME ZONE 'Europe/Sarajevo'
        GROUP BY 1
      ) v ON v.d = g.d::date
      ORDER BY 1`,
    // Sat prvog dolaska svakog člana u danu -> kad je gužva
    sql`
      SELECT h::int AS hour, count(*)::int AS c FROM (
        SELECT card_number, (event_time AT TIME ZONE 'Europe/Sarajevo')::date AS d,
               extract(hour FROM min(event_time AT TIME ZONE 'Europe/Sarajevo')) AS h
        FROM gym_entries
        WHERE card_number IS NOT NULL AND card_number <> ''
          AND event_time >= ${r.from}::date::timestamp AT TIME ZONE 'Europe/Sarajevo'
          AND event_time < (${r.to}::date + 1)::timestamp AT TIME ZONE 'Europe/Sarajevo'
        GROUP BY 1, 2
      ) s GROUP BY 1 ORDER BY 1`,
    sql`
      SELECT kind, count(*)::int AS c,
             COALESCE(sum(GREATEST(0, extract(epoch FROM new_until - COALESCE(previous_until, renewed_at)) / 86400)), 0)::int AS days
      FROM gym_renewals
      WHERE renewed_at >= ${r.from}::date::timestamp AT TIME ZONE 'Europe/Sarajevo'
        AND renewed_at < (${r.to}::date + 1)::timestamp AT TIME ZONE 'Europe/Sarajevo'
      GROUP BY kind`,
    sql`
      SELECT count(*)::int AS total,
             count(*) FILTER (WHERE valid_until >= now())::int AS active,
             count(*) FILTER (WHERE valid_until >= now() AND valid_until < now() + interval '7 days')::int AS expiring
      FROM gym_members WHERE NOT deleted`,
    sql`
      SELECT m.dss_person_id, m.full_name, m.valid_until,
             (SELECT max(e.event_time) FROM gym_entries e
                JOIN gym_member_cards c ON c.card_number = e.card_number
               WHERE c.dss_person_id = m.dss_person_id) AS last_visit
      FROM gym_members m
      WHERE NOT m.deleted AND m.valid_until >= now() AND m.valid_until < now() + interval '7 days'
      ORDER BY m.valid_until ASC
      LIMIT 8`,
    sql`
      SELECT id, full_name, kind, previous_until, new_until, renewed_at
      FROM gym_renewals
      WHERE renewed_at >= ${r.from}::date::timestamp AT TIME ZONE 'Europe/Sarajevo'
        AND renewed_at < (${r.to}::date + 1)::timestamp AT TIME ZONE 'Europe/Sarajevo'
      ORDER BY renewed_at DESC
      LIMIT 6`,
  ]);

  const c = cur.rows[0] as { visits: number; people: number };
  const b = before.rows[0] as { visits: number; people: number };
  const ren = Object.fromEntries(renewals.rows.map((x) => [x.kind as string, x as { c: number; days: number }]));
  const renCount = (ren.produzenje?.c ?? 0) + (ren.uplata?.c ?? 0);
  const newCount = ren.nova?.c ?? 0;
  const mem = members.rows[0] as { total: number; active: number; expiring: number };
  const membersReady = mem.total > 0;
  const q = rangeQuery(r);
  const deltaLabel = isToday ? 'vs juče do ovog sata' : r.days === 1 ? 'vs dan prije' : `vs prethodnih ${r.days} dana`;

  const dailyData = (daily.rows as { day: string; visits: number }[]).map((d, i, arr) => ({
    label: shortDay(d.day),
    value: d.visits,
    highlight: i === arr.length - 1,
  }));

  const hourMap = new Map((hourly.rows as { hour: number; c: number }[]).map((h) => [h.hour, h.c]));
  const hours = Array.from({ length: 24 }, (_, h) => h).filter((h) => h >= 5 || (hourMap.get(h) ?? 0) > 0);
  const perDay = (n: number) => (r.days > 1 ? Math.round((n / r.days) * 10) / 10 : n);
  const hourlyRaw = hours.map((h) => ({ label: String(h), value: perDay(hourMap.get(h) ?? 0), title: `${h}–${h + 1}h` }));
  const peak = hourlyRaw.reduce((a, x) => (x.value > a.value ? x : a), { label: '-', value: 0, title: '' });
  const hourlyData = hourlyRaw.map((x) => ({ ...x, highlight: peak.value > 0 && x.label === peak.label }));

  return (
    <Shell active="pregled" title="Pregled" subtitle="Dolasci, članarine i gužva u teretani">
      <RangeBar range={r} basePath="/dashboard" />

      {!membersReady && (
        <div className="mb-5">
          <Notice>
            Podaci o članarinama (važenje kartica i produženja) još nisu stigli sa DSS računara. Pojaviće se ovdje
            čim se tamo ažurira skripta za sinhronizaciju.
          </Notice>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          accent
          label="Dolasci"
          value={c.visits}
          hint={isToday ? 'Članova koji su danas ušli (svako se broji jednom po danu)' : 'Svaki član se broji jednom po danu'}
          delta={pct(c.visits, b.visits)}
          deltaLabel={deltaLabel}
          icon={<Activity className="h-4 w-4" />}
          href={`/dashboard/ulasci?${q}`}
        />
        {r.days > 1 ? (
          <Kpi
            label="Različitih članova"
            value={c.people}
            hint="Koliko različitih osoba je treniralo u periodu"
            delta={pct(c.people, b.people)}
            deltaLabel={deltaLabel}
            icon={<Users className="h-4 w-4" />}
          />
        ) : (
          <Kpi
            label="Ističe uskoro"
            value={membersReady ? mem.expiring : '—'}
            hint={membersReady ? 'Članarine koje ističu u narednih 7 dana' : 'Čeka podatke sa DSS-a'}
            icon={<Users className="h-4 w-4" />}
            href="/dashboard/clanovi?s=istice"
          />
        )}
        <Kpi
          label="Produženja"
          value={membersReady ? renCount : '—'}
          hint={membersReady ? `Produžene članarine u periodu${newCount ? ` · +${newCount} ${newCount === 1 ? 'nova' : 'novih'}` : ''}` : 'Čeka podatke sa DSS-a'}
          icon={<CreditCard className="h-4 w-4" />}
          href={`/dashboard/clanarine?${q}`}
        />
        <Kpi
          label="Aktivne članarine"
          value={membersReady ? mem.active : '—'}
          hint={membersReady ? `Važe danas · ${mem.expiring} ističe u narednih 7 dana` : 'Čeka podatke sa DSS-a'}
          icon={<ShieldCheck className="h-4 w-4" />}
          href="/dashboard/clanovi?s=aktivni"
        />
      </section>

      <section className="mt-5 grid gap-3 lg:grid-cols-5">
        {r.days > 1 && (
          <Card className="p-4 sm:p-5 lg:col-span-3">
            <SectionTitle title="Dolasci po danu" hint="Broj članova koji su ušli svaki dan" />
            <Bars data={dailyData} height={160} labelEvery={r.days > 20 ? 5 : r.days > 10 ? 2 : 1} />
          </Card>
        )}
        <Card className={r.days > 1 ? 'p-4 sm:p-5 lg:col-span-2' : 'p-4 sm:p-5 lg:col-span-5'}>
          <SectionTitle
            title="Gužva po satu"
            hint={r.days > 1 ? 'Prosječan broj dolazaka po satu (po danu)' : 'Kada su članovi dolazili'}
            action={
              peak.value > 0 ? (
                <Badge tone="orange">
                  <Flame className="h-3 w-3" /> najviše {peak.label}–{Number(peak.label) + 1}h
                </Badge>
              ) : undefined
            }
          />
          <Bars data={hourlyData} height={160} labelEvery={2} />
        </Card>
      </section>

      <section className="mt-5 grid gap-3 lg:grid-cols-2">
        <Card>
          <div className="p-4 pb-0 sm:p-5 sm:pb-0">
            <SectionTitle
              title="Produžili članarinu"
              hint={r.label}
              action={
                <a href={`/dashboard/clanarine?${q}`} className="text-xs font-semibold text-[#ff6b35] hover:underline">
                  Sve →
                </a>
              }
            />
          </div>
          {latestRenewals.rows.length === 0 ? (
            <Empty>{membersReady ? 'Nema produženja u ovom periodu.' : 'Čeka podatke sa DSS-a.'}</Empty>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {latestRenewals.rows.map((x) => {
                const added = dayDiff(x.previous_until ?? x.renewed_at, x.new_until);
                return (
                  <li key={x.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <Avatar name={x.full_name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">{x.full_name ?? 'Bez imena'}</p>
                      <p className="truncate text-xs text-zinc-400">
                        {x.kind === 'nova' ? 'Nova članarina' : x.previous_until ? `bilo do ${fmtDate(x.previous_until)}` : 'Članarina'} → važi do{' '}
                        <span className="text-zinc-200">{fmtDate(x.new_until)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      {added !== null && added > 0 && (
                        <p className="font-[family-name:var(--font-rajdhani)] text-lg font-bold text-emerald-400">+{added} d</p>
                      )}
                      <p className="text-[11px] text-zinc-500">{x.kind === 'uplata' ? `od ${fmtDate(x.renewed_at)}` : fmtDateTime(x.renewed_at)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="p-4 pb-0 sm:p-5 sm:pb-0">
            <SectionTitle
              title="Ističe uskoro"
              hint="Članarine koje ističu u narednih 7 dana"
              action={
                <a href="/dashboard/clanovi?s=istice" className="text-xs font-semibold text-[#ff6b35] hover:underline">
                  Svi →
                </a>
              }
            />
          </div>
          {expiring.rows.length === 0 ? (
            <Empty>{membersReady ? 'Niko ne ističe u narednih 7 dana.' : 'Čeka podatke sa DSS-a.'}</Empty>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {expiring.rows.map((m) => {
                return (
                  <li key={m.dss_person_id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <Avatar name={m.full_name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">{m.full_name ?? 'Bez imena'}</p>
                      <p className="truncate text-xs text-zinc-500">
                        {m.last_visit ? `zadnji dolazak: ${agoLabel(m.last_visit)}` : 'nema dolazaka'}
                      </p>
                    </div>
                    <ValidityBadge until={m.valid_until} />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>

      {!membersReady && (
        <p className="mt-6 flex items-center gap-2 text-xs text-zinc-500">
          <AlertTriangle className="h-3.5 w-3.5" /> Imena i važenje kartica se popunjavaju nakon sinhronizacije osoba sa DSS-a.
        </p>
      )}
    </Shell>
  );
}
