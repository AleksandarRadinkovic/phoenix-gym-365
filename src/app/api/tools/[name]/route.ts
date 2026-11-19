// src/app/api/tools/[name]/route.ts
//
// Preuzimanje skripti za DSS računar (dss_sync.py, dss_alert.py) direktno iz deploy-a,
// da se na recepciji ne mora ručno kopirati kod. Zaštićeno istom tajnom kao uvoz (IMPORT_SECRET).
//   Invoke-WebRequest https://app.phoenixgym365.com/api/tools/dss_alert.py -Headers @{Authorization="Bearer $env:IMPORT_SECRET"} -OutFile dss_alert.py

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FILES = new Set(['dss_sync.py', 'dss_alert.py', 'requirements.txt']);

export async function GET(req: NextRequest, { params }: { params: { name: string } }) {
  const secret = process.env.IMPORT_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!FILES.has(params.name)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  const body = await readFile(path.join(process.cwd(), 'tools', 'dss-sync', params.name));
  return new NextResponse(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  });
}
