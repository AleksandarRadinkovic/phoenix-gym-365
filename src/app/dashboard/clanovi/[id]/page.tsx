// src/app/dashboard/clanovi/[id]/page.tsx — profil člana: članarine, uplate i dolasci kroz vrijeme
import { sql } from '@vercel/postgres';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarCheck, CreditCard, DoorOpen, Wallet } from 'lucide-react';
import { Shell } from '@/components/dashboard/Shell';
import { Avatar, Badge, Card, Empty, Kpi, SectionTitle, ValidityBadge, cx } from '@/components/dashboard/ui';
import { classifyRenewal, fmtKM } from '@/lib/gym/packages';
import { drainQuietly } from '@/lib/gym/sync';
import { fmtDate, fmtDateTime, fmtTime, localDay } from '@/lib/gym/time';

export const dynamic = 'force-dynamic';
// Bez Next.js keša za SQL upite (inače panel prikazuje stare brojke).
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'];

type Member = {
  dss_person_id: string;
  full_name: string | null;
  person_code: string | null;
  valid_from: string | null;
  valid_until: string | null;
  deleted: boolean;
  cards: string[] | null;
};

type Renewal = {
  id: number;
  kind: 'produzenje' | 'nova' | 'uplata';
  previous_until: string | null;
  new_until: string | null;
  renewed_at: string;
};

type Day = { day: string; first_in: string; swipes: number };

type YearStat = {
  year: number;
  visits: number;
  months: number[]; // dolasci (dani) po mjesecu
  renewals: number;
  paid: number;
};

export default async function MemberPage({ params }: { params: { id: string } }) {
  await drainQuietly();
  const id = decodeURIComponent(params.id);

  const memberRes = await sql`
    SELECT m.dss_person_id, m.full_name, m.person_code, m.valid_from, m.valid_until, m.deleted,
           (SELECT array_agg(card_number ORDER BY card_number) FROM gym_member_cards c WHERE c.dss_person_id = m.dss_person_id) AS cards
    FROM gym_members m WHERE m.dss_person_id = ${id}`;
  const member = memberRes.rows[0] as Member | undefined;
  if (!member) notFound();

  const cards = member.cards ?? [];
  const cardsJson = JSON.stringify(cards);

  const [renRes, daysRes] = await Promise.all([
    sql`
      SELECT id, kind, previous_until, new_until, renewed_at
      FROM gym_renewals WHERE dss_person_id = ${id}
      ORDER BY renewed_at DESC`,
    // Jedan red po danu dolaska (sve kartice ove osobe)
    sql`
      SELECT to_char((e.event_time AT TIME ZONE 'Europe/Sarajevo')::date, 'YYYY-MM-DD') AS day,
             min(e.event_time) AS first_in, count(*)::int AS swipes
      FROM gym_entries e
      WHERE e.card_number IN (SELECT json_array_elements_text(${cardsJson}::json))
      GROUP BY 1 ORDER BY 1 DESC`,
  ]);

  const renewals = renRes.rows as Renewal[];
  const days = daysRes.rows as Day[];

  // Godišnja statistika
  const years = new Map<number, YearStat>();
  const year = (y: number) => {
    if (!years.has(y)) years.set(y, { year: y, visits: 0, months: Array(12).fill(0), renewals: 0, paid: 0 });
    return years.get(y)!;
  };
  for (const d of days) {
    const [y, m] = d.day.split('-').map(Number);
    const s = year(y);
    s.visits++;
    s.months[m - 1]++;
  }
  for (const r of renewals) {
    const p = classifyRenewal(r);
    if (!p || p.key === 'korekcija') continue;
    const y = Number(localDay(r.renewed_at)?.slice(0, 4));
    if (!y) continue;
    const s = year(y);
    s.renewals++;
    s.paid += p.price;
  }
  const yearStats = Array.from(years.values()).sort((a, b) => b.year - a.year);
  const thisYear = new Date().getFullYear();
  const cur = years.get(thisYear) ?? { year: thisYear, visits: 0, months: Array(12).fill(0), renewals: 0, paid: 0 };
  const totalPaid = yearStats.reduce((s, y) => s + y.paid, 0);
  const maxMonth = Math.max(1, ...yearStats.flatMap((y) => y.months));
  const lastVisit = days[0]?.first_in ?? null;

  return (
    <Shell active="clanovi" title={member.full_name ?? 'Bez imena'} subtitle="Članarine, uplate i dolasci kroz vrijeme">
      <a href="/dashboard/clanovi" className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Svi članovi
      </a>

      <Card className="mb-5 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar name={member.full_name} />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-white">{member.full_name ?? 'Bez imena'}</p>
              <p className="truncate text-xs text-zinc-500">
                {cards.length ? `Kartica ${cards.join(', ')}` : 'bez kartice'}
                {member.person_code ? ` · šifra ${member.person_code}` : ''}
                {member.deleted ? ' · obrisan u DSS-u' : ''}
              </p>
            </div>
          </div>
          <div className="text-sm sm:text-right">
            <ValidityBadge until={member.valid_until} />
            <p className="mt-1 text-xs text-zinc-500">
              Zadnji dolazak: {lastVisit ? fmtDateTime(lastVisit) : '—'}
            </p>
          </div>
        </div>
      </Card>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi accent label={`Produženja ${thisYear}`} value={cur.renewals} hint="Plaćene članarine ove godine" icon={<CreditCard className="h-4 w-4" />} />
        <Kpi label={`Uplaćeno ${thisYear}`} value={fmtKM(cur.paid)} hint={`Ukupno evidentirano: ${fmtKM(totalPaid)}`} icon={<Wallet className="h-4 w-4" />} />
        <Kpi label={`Dolasci ${thisYear}`} value={cur.visits} hint="Dana kada je trenirao" icon={<DoorOpen className="h-4 w-4" />} />
        <Kpi
          label="Aktivnih mjeseci"
          value={`${cur.months.filter((x) => x > 0).length}/${new Date().getMonth() + 1}`}
          hint="Mjeseci ove godine sa bar jednim dolaskom"
          icon={<CalendarCheck className="h-4 w-4" />}
        />
      </section>

      <section className="mt-5">
        <Card className="p-4 sm:p-5">
          <SectionTitle title="Po godinama" hint="Dolasci po mjesecima (broj dana) · produženja i uplate" />
          {yearStats.length === 0 ? (
            <Empty>Nema zabilježenih dolazaka ni uplata.</Empty>
          ) : (
            <div className="space-y-5">
              {yearStats.map((y) => (
                <div key={y.year}>
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-[family-name:var(--font-rajdhani)] text-xl font-bold text-white">{y.year}</p>
                    <p className="text-xs text-zinc-400">
                      {y.visits} dolazaka · aktivan {y.months.filter((x) => x > 0).length} mj.
                      {y.renewals > 0 ? ` · ${y.renewals}× produžio · ${fmtKM(y.paid)}` : ''}
                    </p>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
                    {y.months.map((n, i) => (
                      <div
                        key={i}
                        title={`${MONTHS[i]} ${y.year}: ${n} dolazaka`}
                        className={cx(
                          'rounded-lg px-1 py-2 text-center ring-1 ring-inset',
                          n === 0 ? 'bg-white/[0.02] ring-white/[0.05]' : 'ring-[#ff6b35]/30',
                        )}
                        style={n > 0 ? { backgroundColor: `rgba(255,107,53,${0.12 + 0.5 * (n / maxMonth)})` } : undefined}
                      >
                        <p className="text-[10px] uppercase text-zinc-400">{MONTHS[i]}</p>
                        <p className={cx('text-sm font-bold tabular-nums', n ? 'text-white' : 'text-zinc-600')}>{n || '–'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <section className="mt-5 grid gap-3 lg:grid-cols-2">
        <Card>
          <div className="p-4 pb-0 sm:p-5 sm:pb-0">
            <SectionTitle title="Članarine" hint="Svako produženje, paket i iznos" />
          </div>
          {renewals.length === 0 ? (
            <Empty>Nema evidentiranih produženja.</Empty>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {renewals.map((r) => {
                const p = classifyRenewal(r);
                return (
                  <li key={r.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">{fmtDate(r.renewed_at)}</p>
                        {p && <Badge tone={p.key === 'korekcija' ? 'zinc' : 'orange'}>{p.label}</Badge>}
                        {r.kind === 'nova' && <Badge tone="blue">Nova</Badge>}
                      </div>
                      <p className="text-xs text-zinc-400">
                        {r.previous_until ? `bilo do ${fmtDate(r.previous_until)} → ` : 'važi do '}
                        <span className="text-zinc-200">{fmtDate(r.new_until)}</span>
                        {p ? ` · ${p.days} dana` : ''}
                      </p>
                    </div>
                    <p className="font-[family-name:var(--font-rajdhani)] text-lg font-bold text-emerald-400">
                      {p && p.price > 0 ? fmtKM(p.price) : '—'}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="px-4 pb-4 text-[11px] leading-relaxed text-zinc-500 sm:px-5">
            DSS ne čuva staru istoriju datuma važenja: produženja su evidentirana od povezivanja panela (7.10.2026.),
            a starije godine se vide kroz dolaske.
          </p>
        </Card>

        <Card>
          <div className="p-4 pb-0 sm:p-5 sm:pb-0">
            <SectionTitle title="Zadnji dolasci" hint={`Ukupno ${days.length} dana sa dolaskom`} />
          </div>
          {days.length === 0 ? (
            <Empty>Nema dolazaka.</Empty>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {days.slice(0, 40).map((d) => (
                <li key={d.day} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm sm:px-5">
                  <span className="text-zinc-200">{fmtDate(`${d.day}T12:00:00Z`)}</span>
                  <span className="text-zinc-400">
                    {fmtTime(d.first_in)}
                    {d.swipes > 1 ? <span className="ml-2 text-xs text-amber-300">{d.swipes}× provučena</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </Shell>
  );
}
