// src/app/api/sync-entries/route.ts
//
// Vercel Cron (vidi vercel.json) poziva ovu rutu i prazni KV redove koje puni
// dss_sync.py sa DSS računara: ulaske i osobe/važenje kartica.
// Logika je u src/lib/gym/sync.ts (koriste je i stranice panela).

import { NextRequest, NextResponse } from 'next/server';
import { drainQueues } from '@/lib/gym/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const result = await drainQueues({ maxEntries: 5000, maxMembers: 5000, budgetMs: 45_000 });
  return NextResponse.json({ processed: result.entries, ...result });
}
