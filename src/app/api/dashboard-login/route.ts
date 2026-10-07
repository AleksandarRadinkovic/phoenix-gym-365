// src/app/api/dashboard-login/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({ password: '' }));
  const password = typeof body?.password === 'string' ? body.password : '';

  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected || password !== expected) {
    return NextResponse.json({ error: 'invalid' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('gym_dash_auth', expected, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 dana
  });
  return response;
}
