// app/api/sync-entries/route.ts
//
// Prazni Vercel KV red (koji puni dss_sync.py sa DSS racunara) i upisuje
// ulaske u Postgres bazu (Vercel Postgres / Neon).
//
// Prije prve upotrebe:
//   1. Vercel dashboard -> Storage -> Create Database -> Postgres (Neon) ->
//      povezi sa ovim projektom (env varijable se same ubace: POSTGRES_URL i sl.)
//   2. Pokreni schema.sql jednom (Vercel dashboard -> ta baza -> Query, ili psql)
//   3. npm install @vercel/postgres @vercel/kv
//   4. Postavi CRON_SECRET env varijablu (bilo koji dugi random string)
//
// Pokretanje: Vercel Cron (vidi vercel.json) nekoliko puta dnevno.

import { kv } from "@vercel/kv";
import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

const QUEUE_KEY = process.env.KV_QUEUE_KEY ?? "gym:access:queue";
const MAX_PER_RUN = 500;

type AccessEntry = {
  record_id: number;
  card_number: string | null;
  event_time: string | null;
  door_name: string | null;
  enter_or_exit: number | null;
  first_name: string | null;
  last_name: string | null;
  person_name: string | null;
  person_code: string | null;
  synced_at: string;
};

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

let processed = 0;
  const errors: string[] = [];

for (let i = 0; i < MAX_PER_RUN; i++) {
  const raw = await kv.lpop<string>(QUEUE_KEY);
  if (!raw) break;

  try {
    const entry: AccessEntry =
      typeof raw === "string" ? JSON.parse(raw) : (raw as unknown as AccessEntry);
    await saveEntryToDb(entry);
    processed++;
  } catch (err) {
    errors.push(`record_id=${(raw as any)?.record_id ?? "?"}: ${String(err)}`);
  }
}

return NextResponse.json({ processed, errors });
}

async function saveEntryToDb(entry: AccessEntry) {
  await sql`
  INSERT INTO gym_entries (
  dss_record_id, card_number, event_time, door_name,
  direction, person_name, person_code
  ) VALUES (
  ${entry.record_id},
  ${entry.card_number},
  ${entry.event_time},
  ${entry.door_name},
  ${entry.enter_or_exit},
  ${entry.person_name},
  ${entry.person_code}
  )
  ON CONFLICT (dss_record_id) DO NOTHING
  `;
}
