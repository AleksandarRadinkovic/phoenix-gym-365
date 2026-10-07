// src/lib/gym/sync.ts
//
// Prazni Vercel KV redove koje puni dss_sync.py sa DSS računara:
//   - gym:access:queue  -> ulasci (gym_entries)
//   - gym:members:queue -> osobe + važenje kartice (gym_members, gym_member_cards)
// Kad se nekome datum važenja pomjeri naprijed, upisuje se produženje (gym_renewals).
//
// DSS šalje lokalna vremena bez zone (npr. "2026-10-07T15:02:45"), pa ih
// uvijek tumačimo kao Europe/Sarajevo.

import 'server-only';
import { kv } from '@vercel/kv';
import { sql } from '@vercel/postgres';

export const ENTRY_QUEUE = process.env.KV_QUEUE_KEY ?? 'gym:access:queue';
export const MEMBER_QUEUE = process.env.KV_MEMBER_QUEUE_KEY ?? 'gym:members:queue';

type AccessEntry = {
  record_id: number;
  card_number: string | null;
  event_time: string | null;
  door_name: string | null;
  enter_or_exit: number | null;
  person_name: string | null;
  person_code: string | null;
};

type MemberMessage = {
  dss_person_id: string | number;
  person_code?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  cards?: string[] | null;
  valid_from?: string | null;
  valid_until?: string | null;
  dss_updated_at?: string | null;
  baseline?: boolean;
  deleted?: boolean;
};

export type DrainResult = {
  entries: number;
  members: number;
  renewals: number;
  errors: string[];
};

function parse<T>(raw: unknown): T {
  return (typeof raw === 'string' ? JSON.parse(raw) : raw) as T;
}

async function popBatch(key: string, count: number): Promise<unknown[]> {
  const res = (await kv.lpop(key, count)) as unknown;
  if (res == null) return [];
  return Array.isArray(res) ? res : [res];
}

function cleanTs(v: string | null | undefined): string | null {
  if (!v) return null;
  const s = String(v).trim();
  if (!s || s.startsWith('0000') || s === 'None') return null;
  return s;
}

/** Upis više ulazaka jednim upitom. */
async function saveEntries(list: AccessEntry[]) {
  if (list.length === 0) return;
  const json = JSON.stringify(
    list.map((e) => ({
      record_id: e.record_id,
      card_number: e.card_number,
      event_time: cleanTs(e.event_time),
      door_name: e.door_name,
      direction: e.enter_or_exit,
      person_name: e.person_name,
      person_code: e.person_code,
    })),
  );
  await sql`
    INSERT INTO gym_entries (
      dss_record_id, card_number, event_time, door_name,
      direction, person_name, person_code, tz_fixed
    )
    SELECT (x->>'record_id')::bigint,
           x->>'card_number',
           (x->>'event_time')::timestamp AT TIME ZONE 'Europe/Sarajevo',
           x->>'door_name',
           (x->>'direction')::smallint,
           x->>'person_name',
           x->>'person_code',
           true
    FROM json_array_elements(${json}::json) AS x
    ON CONFLICT (dss_record_id) DO NOTHING
  `;
}

async function saveMember(m: MemberMessage): Promise<number> {
  const id = String(m.dss_person_id);

  if (m.deleted) {
    await sql`DELETE FROM gym_member_cards WHERE dss_person_id = ${id}`;
    await sql`UPDATE gym_members SET deleted = true, updated_at = now() WHERE dss_person_id = ${id}`;
    return 0;
  }

  const name =
    (m.full_name && m.full_name.trim()) ||
    [m.first_name, m.last_name].filter(Boolean).join(' ').trim() ||
    null;
  const code = m.person_code ?? null;
  const from = cleanTs(m.valid_from);
  const until = cleanTs(m.valid_until);
  const changedAt = cleanTs(m.dss_updated_at);
  const baseline = m.baseline === true;
  const cards = (m.cards ?? []).map((c) => String(c).trim()).filter(Boolean);

  // Jedan upit: upiši/ažuriraj osobu i, ako je važenje pomjereno naprijed,
  // zabilježi produženje (ili novu članarinu za novu osobu).
  const res = await sql`
    WITH prev AS (
      SELECT valid_until FROM gym_members WHERE dss_person_id = ${id}
    ),
    up AS (
      INSERT INTO gym_members (dss_person_id, person_code, full_name, valid_from, valid_until, deleted, updated_at)
      VALUES (
        ${id}, ${code}, ${name},
        ${from}::timestamp AT TIME ZONE 'Europe/Sarajevo',
        ${until}::timestamp AT TIME ZONE 'Europe/Sarajevo',
        false, now()
      )
      ON CONFLICT (dss_person_id) DO UPDATE SET
        person_code = EXCLUDED.person_code,
        full_name = EXCLUDED.full_name,
        valid_from = EXCLUDED.valid_from,
        valid_until = EXCLUDED.valid_until,
        deleted = false,
        updated_at = now()
      RETURNING valid_until
    ),
    ins AS (
      INSERT INTO gym_renewals (dss_person_id, full_name, person_code, kind, previous_until, new_until, renewed_at)
      SELECT ${id}, ${name}, ${code}, 'produzenje', prev.valid_until, up.valid_until,
             COALESCE(${changedAt}::timestamp AT TIME ZONE 'Europe/Sarajevo', now())
      FROM up, prev
      WHERE up.valid_until IS NOT NULL
        AND prev.valid_until IS NOT NULL
        AND up.valid_until > prev.valid_until + interval '1 hour'
      UNION ALL
      SELECT ${id}, ${name}, ${code}, 'nova', NULL, up.valid_until,
             COALESCE(${changedAt}::timestamp AT TIME ZONE 'Europe/Sarajevo', now())
      FROM up
      WHERE NOT ${baseline}::boolean
        AND up.valid_until IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM prev WHERE prev.valid_until IS NOT NULL)
      RETURNING 1
    )
    SELECT count(*)::int AS n FROM ins
  `;

  if (cards.length > 0) {
    const cardsJson = JSON.stringify(cards);
    await sql`
      DELETE FROM gym_member_cards
      WHERE dss_person_id = ${id}
        AND card_number NOT IN (SELECT json_array_elements_text(${cardsJson}::json))
    `;
    await sql`
      INSERT INTO gym_member_cards (card_number, dss_person_id)
      SELECT DISTINCT json_array_elements_text(${cardsJson}::json), ${id}
      ON CONFLICT (card_number) DO UPDATE SET dss_person_id = EXCLUDED.dss_person_id
    `;
  } else {
    await sql`DELETE FROM gym_member_cards WHERE dss_person_id = ${id}`;
  }

  return (res.rows[0] as { n: number } | undefined)?.n ?? 0;
}

export async function drainQueues(
  opts: { maxEntries?: number; maxMembers?: number; budgetMs?: number } = {},
): Promise<DrainResult> {
  const maxEntries = opts.maxEntries ?? 500;
  const maxMembers = opts.maxMembers ?? 1000;
  const deadline = Date.now() + (opts.budgetMs ?? 40_000);
  const result: DrainResult = { entries: 0, members: 0, renewals: 0, errors: [] };

  // Članovi prvo, da novi ulasci odmah imaju ime i važenje.
  // Male serije + vremenski budžet: ništa se ne skida iz reda ako nema vremena da se upiše.
  let left = maxMembers;
  while (left > 0 && Date.now() < deadline) {
    const batch = await popBatch(MEMBER_QUEUE, Math.min(20, left));
    if (batch.length === 0) break;
    left -= batch.length;
    for (const raw of batch) {
      try {
        result.renewals += await saveMember(parse<MemberMessage>(raw));
        result.members++;
      } catch (err) {
        result.errors.push(`member: ${String(err)}`);
        await deadLetter(raw);
      }
    }
  }

  left = maxEntries;
  while (left > 0 && Date.now() < deadline) {
    const batch = await popBatch(ENTRY_QUEUE, Math.min(200, left));
    if (batch.length === 0) break;
    left -= batch.length;
    const parsed = batch.map((raw) => parse<AccessEntry>(raw));
    try {
      await saveEntries(parsed);
      result.entries += parsed.length;
    } catch {
      // jedan loš zapis ne smije oboriti cijelu seriju
      for (let i = 0; i < parsed.length; i++) {
        try {
          await saveEntries([parsed[i]]);
          result.entries++;
        } catch (err) {
          result.errors.push(`entry ${parsed[i]?.record_id}: ${String(err)}`);
          await deadLetter(batch[i]);
        }
      }
    }
  }

  return result;
}

async function deadLetter(raw: unknown) {
  try {
    await kv.rpush('gym:failed', typeof raw === 'string' ? raw : JSON.stringify(raw));
  } catch {
    // ignore
  }
}

/**
 * Za stranice panela: povuci ono što je tek stiglo, ali nikad ne ruši i ne usporava prikaz.
 * Veće količine (npr. prvo slanje svih osoba) prazni cron.
 */
export async function drainQuietly() {
  try {
    const pendingMembers = Number((await kv.llen(MEMBER_QUEUE)) ?? 0);
    await drainQueues({ maxEntries: 1000, maxMembers: pendingMembers > 40 ? 0 : 40, budgetMs: 4_000 });
  } catch {
    // prikaz radi i bez svježe sinhronizacije
  }
}
