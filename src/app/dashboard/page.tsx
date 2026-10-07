// src/app/dashboard/page.tsx
import { sql } from '@vercel/postgres';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type EntryRow = {
  dss_record_id: number;
  card_number: string | null;
  event_time: string | null;
  door_name: string | null;
  direction: number | null;
  person_name: string | null;
  person_code: string | null;
};

type Period = 'day' | 'week' | 'month';

const PERIOD_LABEL: Record<Period, string> = {
  day: 'Danas',
  week: 'Sedmica',
  month: 'Mjesec',
};

const PERIOD_INTERVAL: Record<Period, string> = {
  day: '24 hours',
  week: '7 days',
  month: '30 days',
};

const PERIOD_DAYS: Record<Period, number> = {
  day: 1,
  week: 7,
  month: 30,
};

function parsePeriod(value: string | string[] | undefined): Period {
  const v = Array.isArray(value) ? value[0] : value;
  if (v === 'week' || v === 'month') return v;
  return 'day';
}

function directionBadge(direction: number | null) {
  if (direction === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5">
        Ulaz
      </span>
    );
  }
  if (direction === 1) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-200 text-gray-600 text-xs font-semibold px-2 py-0.5">
        Izlaz
      </span>
    );
  }
  return <span className="text-xs text-gray-400">—</span>;
}

function formatTime(value: string | null, period: Period) {
  if (!value) return '—';
  const date = new Date(value);
  if (period === 'day') {
    return date.toLocaleString('sr-Latn-BA', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleString('sr-Latn-BA', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const period = parsePeriod(searchParams?.period);
  const interval = PERIOD_INTERVAL[period];

  const [entriesResult, countResult, uniqueResult] = await Promise.all([
    sql<EntryRow>`
      SELECT dss_record_id, card_number, event_time, door_name, direction, person_name, person_code
      FROM gym_entries
      WHERE event_time >= NOW() - ${interval}::interval
      ORDER BY event_time DESC
      LIMIT 300
    `,
    sql`SELECT COUNT(*)::int AS count FROM gym_entries WHERE event_time >= NOW() - ${interval}::interval`,
    sql`SELECT COUNT(DISTINCT card_number)::int AS count FROM gym_entries WHERE event_time >= NOW() - ${interval}::interval AND direction = 0`,
  ]);

  const entries = entriesResult.rows;
  const totalCount = (countResult.rows[0] as { count: number } | undefined)?.count ?? 0;
  const uniqueMembers = (uniqueResult.rows[0] as { count: number } | undefined)?.count ?? 0;
  const days = PERIOD_DAYS[period];
  const avgPerDay = days > 1 ? Math.round((totalCount / days) * 10) / 10 : totalCount;

  return (
    <main className="min-h-screen bg-[var(--phoenix-light)] pb-10">
      <header className="sticky top-0 z-10 bg-[var(--phoenix-dark)] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-lg font-bold leading-tight">Phoenix Gym 365</h1>
          <p className="text-xs text-gray-300">Interni panel — ulasci</p>
        </div>
        <a
          href="/api/dashboard-logout"
          className="text-xs text-gray-300 hover:text-white underline whitespace-nowrap"
        >
          Odjava
        </a>
      </header>

      <nav className="px-3 pt-3">
        <div className="grid grid-cols-3 gap-1.5 bg-white rounded-xl shadow p-1">
          {(['day', 'week', 'month'] as Period[]).map((p) => {
            const active = p === period;
            return (
              <Link
                key={p}
                href={`/dashboard?period=${p}`}
                className={`text-center text-sm font-semibold rounded-lg py-2 transition ${
                  active
                    ? 'bg-[var(--phoenix-orange)] text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {PERIOD_LABEL[p]}
              </Link>
            );
          })}
        </div>
      </nav>

      <section className="px-3 pt-3 grid grid-cols-3 gap-2">
        <StatCard label="Ulasci" value={totalCount} />
        <StatCard label="Članovi" value={uniqueMembers} />
        <StatCard
          label={period === 'day' ? 'Trenutno' : 'Prosjek/dan'}
          value={avgPerDay}
        />
      </section>

      <section className="px-3 pt-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
          Ko je ušao — {PERIOD_LABEL[period].toLowerCase()}
        </h2>
        <div className="bg-white rounded-xl shadow divide-y divide-gray-100">
          {entries.map((entry) => (
            <div
              key={entry.dss_record_id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[var(--phoenix-dark)] truncate">
                  {entry.person_name ?? (
                    <span className="text-gray-400">Nepoznata kartica</span>
                  )}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {entry.door_name ?? '—'}
                  {entry.card_number ? ` · ${entry.card_number}` : ''}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {directionBadge(entry.direction)}
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {formatTime(entry.event_time, period)}
                </span>
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">
              Nema zapisa za odabrani period.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl shadow px-2 py-3 flex flex-col items-center text-center">
      <p className="text-[11px] text-gray-500 leading-tight">{label}</p>
      <p className="text-xl sm:text-2xl font-bold text-[var(--phoenix-dark)] leading-tight">
        {value}
      </p>
    </div>
  );
}
