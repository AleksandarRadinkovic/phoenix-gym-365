// src/app/api/import-entries/route.ts
//
// Jednokratni uvoz STARIH ulazaka (od početka DSS evidencije) direktno sa DSS računara:
//   python dss_sync.py --backfill
// Ide mimo Vercel KV reda (stotine hiljada zapisa bi potrošile KV limit).
// Zaštićeno tajnom IMPORT_SECRET (Vercel env) — ista vrijednost se postavlja na DSS računaru.
// Duplikati se preskaču (ON CONFLICT po dss_record_id), pa je ponovno slanje bezbjedno.

import { NextRequest, NextResponse } from 'next/server';
import { saveEntries, type AccessEntry } from '@/lib/gym/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_BATCH = 5000;

export async function POST(req: NextRequest) {
  const secret = process.env.IMPORT_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { entries?: AccessEntry[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
  const entries = Array.isArray(body.entries) ? body.entries : [];
  if (entries.length > MAX_BATCH) {
    return NextResponse.json({ error: `max ${MAX_BATCH} po zahtjevu` }, { status: 413 });
  }

  for (let i = 0; i < entries.length; i += 1000) {
    await saveEntries(entries.slice(i, i + 1000));
  }
  return NextResponse.json({ saved: entries.length });
}
