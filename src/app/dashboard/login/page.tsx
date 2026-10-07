// src/app/dashboard/login/page.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { Lock } from 'lucide-react';

export default function DashboardLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/dashboard-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        window.location.href = '/dashboard';
      } else {
        setError('Pogrešna lozinka.');
      }
    } catch {
      setError('Greška pri povezivanju. Pokušaj ponovo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090b] px-4 text-zinc-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_top,rgba(255,107,53,0.25),transparent_65%)]" />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm space-y-6 rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#ff6b35] to-[#e74c3c] font-[family-name:var(--font-rajdhani)] text-2xl font-bold text-white shadow-lg shadow-[#ff6b35]/40">
            P
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-rajdhani)] text-2xl font-bold tracking-wide text-white">
              PHOENIX <span className="text-[#ff6b35]">GYM 365</span>
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Interni panel</p>
          </div>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-300">Lozinka</span>
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-3 focus-within:border-[#ff6b35]/70">
            <Lock className="h-4 w-4 text-zinc-500" />
            <input
              id="password"
              type="password"
              autoFocus
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent py-3 text-base text-white focus:outline-none"
            />
          </div>
        </label>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#e74c3c] py-3 font-bold text-white shadow-lg shadow-[#ff6b35]/30 transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? 'Provjera…' : 'Prijavi se'}
        </button>
      </form>
    </main>
  );
}
