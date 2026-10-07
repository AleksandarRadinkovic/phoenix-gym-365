// src/app/api/dashboard-logout/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL('/dashboard/login', req.url);
  const response = NextResponse.redirect(url);
  response.cookies.delete('gym_dash_auth');
  return response;
}
