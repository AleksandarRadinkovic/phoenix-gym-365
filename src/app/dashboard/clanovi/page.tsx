// src/app/dashboard/clanovi/page.tsx — svi članovi, važenje kartice, zadnji dolazak
import { sql } from '@vercel/postgres';
import { Search } from 'lucide-react';
import { Shell } from '@/components/dashboard/Shell';
import { Avatar, Card, Empty, Notice, ValidityBadge, cx } from '@/components/dashboard/ui';
import { drainQuietly } from '@/lib/gym/sync';
import { agoLabel, fmtDate, fmtDateTime } from '@/lib/gym/time';

export const dynamic = 'force-dynamic';
// Bez Next.js keša za SQL upite (inače panel prikazuje stare brojke).
export const fetchCache = 'force-no-store';
export const revalidate = 0;

type Sp = { [k: string]: string | string[] | undefined };
type Status = 'svi' | 'aktivni' | 'istice' | 'istekli';

const STATUSES: { key: Status; label: string }[] = [
  { key: 'aktivni', label: 'Aktivni' },
  { key: 'istice', label: 'Ističe (7 dana)' },
  { key: 'istekli', label: 'Istekli' },
  { key: 'svi', label: 'Svi' },
];

type Row = {
  dss_person_id: string;
  full_name: string | null;
  person_code: string | null;
  valid_from: string | null;
  valid_until: string | null;
  cards: string | null;
  last_visit: string | null;
  visits30: number | null;
};

function one(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? '';
}

export default async function MembersPage({ searchParams }: { searchParams: Sp }) {
  await drainQuietly();
  const q = one(searchParams.q).trim().slice(0, 60);
  const sRaw = one(searchParams.s) as Status;
  const s: Status = STATUSES.some((x) => x.key === sRaw) ? sRaw : 'aktivni';
  const like = `%${q}%`;

  const [list, counts] = await Promise.all([
    sql`
      SELECT m.dss_person_id, m.full_name, m.person_code, m.valid_from, m.valid_until,
             cards.list AS cards, v.last_visit, v.visits30
      FROM gym_members m
      LEFT JOIN LATERAL (
        SELECT string_agg(card_number, ', ') AS list, array_agg(card_number) AS arr
        FROM gym_member_cards c WHERE c.dss_person_id = m.dss_person_id
      ) cards ON true
      LEFT JOIN LATERAL (
        SELECT max(e.event_time) AS last_visit,
               count(DISTINCT (e.event_time AT TIME ZONE 'Europe/Sarajevo')::date)
                 FILTER (WHERE e.event_time >= now() - interval '30 days')::int AS visits30
        FROM gym_entries e WHERE e.card_number = ANY(cards.arr)
      ) v ON true
      WHERE NOT m.deleted
        AND (${q} = '' OR m.full_name ILIKE ${like} OR m.person_code ILIKE ${like} OR cards.list ILIKE ${like})
        AND (
          ${s} = 'svi'
          OR (${s} = 'aktivni' AND m.valid_until >= now())
          OR (${s} = 'istice' AND m.valid_until >= now() AND m.valid_until < now() + interval '7 days')
          OR (${s} = 'istekli' AND m.valid_until < now())
        )
      ORDER BY
        CASE WHEN ${s} = 'istice' THEN m.valid_until END ASC,
        CASE WHEN ${s} = 'istekli' THEN m.valid_until END DESC,
        v.last_visit DESC NULLS LAST,
        m.full_name ASC
      LIMIT 300`,
    sql`
      SELECT count(*)::int AS svi,
             count(*) FILTER (WHERE valid_until >= now())::int AS aktivni,
             count(*) FILTER (WHERE valid_until >= now() AND valid_until < now() + interval '7 days')::int AS istice,
             count(*) FILTER (WHERE valid_until < now())::int AS istekli
      FROM gym_members WHERE NOT deleted`,
  ]);

  const rows = list.rows as Row[];
  const cnt = counts.rows[0] as Record<Status, number>;
  const membersReady = cnt.svi > 0;

  return (
    <Shell active="clanovi" title="Članovi" subtitle="Važenje kartice i dolasci svakog člana">
      <form action="/dashboard/clanovi" method="get" className="mb-4">
        <input type="hidden" name="s" value={s} />
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-[#ff6b35]/60">
          <Search className="h-5 w-5 text-zinc-500" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Traži po imenu, šifri ili broju kartice…"
            className="w-full bg-transparent text-base text-white placeholder:text-zinc-500 focus:outline-none"
          />
        </label>
      </form>

      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {STATUSES.map((x) => (
          <a
            key={x.key}
            href={`/dashboard/clanovi?s=${x.key}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
            className={cx(
              'flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition',
              s === x.key ? 'border-[#ff6b35] bg-[#ff6b35] text-white' : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/25',
            )}
          >
            {x.label}
            <span className={cx('rounded-full px-1.5 text-[11px]', s === x.key ? 'bg-white/20' : 'bg-white/10 text-zinc-400')}>
              {cnt[x.key]}
            </span>
          </a>
        ))}
      </div>

      {!membersReady && (
        <div className="mb-5">
          <Notice>Lista članova se puni sa DSS računara nakon ažuriranja skripte za sinhronizaciju.</Notice>
        </div>
      )}

      <Card>
        {rows.length === 0 ? (
          <Empty>{q ? `Nema rezultata za „${q}”.` : 'Nema članova u ovoj grupi.'}</Empty>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {rows.map((m) => {
              return (
                <li key={m.dss_person_id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={m.full_name} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{m.full_name ?? 'Bez imena'}</p>
                      <p className="truncate text-xs text-zinc-500">
                        {m.cards ? `Kartica ${m.cards}` : 'bez kartice'}
                        {m.person_code ? ` · šifra ${m.person_code}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs sm:flex sm:items-center sm:gap-6">
                    <div>
                      <p className="text-zinc-500">Važi</p>
                      <p className="text-zinc-200">
                        {m.valid_from ? `${fmtDate(m.valid_from)} – ` : ''}
                        {fmtDate(m.valid_until)}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Zadnji dolazak</p>
                      <p className="text-zinc-200" title={fmtDateTime(m.last_visit)}>
                        {m.last_visit ? agoLabel(m.last_visit) : '—'}
                        {m.visits30 ? <span className="text-zinc-500"> · {m.visits30}× u 30 d</span> : null}
                      </p>
                    </div>
                    <div className="col-span-2 sm:col-span-1 sm:min-w-[170px] sm:text-right">
                      <ValidityBadge until={m.valid_until} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      {rows.length === 300 && <p className="mt-3 text-xs text-zinc-500">Prikazano prvih 300 — suzi pretragu.</p>}
    </Shell>
  );
}
