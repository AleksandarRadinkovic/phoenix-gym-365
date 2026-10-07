// src/app/dashboard/login/page.tsx
'use client';

import { useState, type FormEvent } from 'react';

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
        window.location.href = '/';
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
    <main className="min-h-screen flex items-center justify-center bg-[var(--phoenix-dark)] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 space-y-5"
      >
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-[var(--phoenix-dark)]">
            Phoenix Gym 365
          </h1>
          <p className="text-sm text-gray-500">Interni panel — prijava</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">
            Lozinka
          </label>
          <input
            id="password"
            type="password"
            autoFocus
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--phoenix-orange)]"
          />
        </div>

        {error && <p className="text-sm text-[var(--phoenix-red)]">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--phoenix-orange)] text-white font-semibold py-2.5 hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? 'Provjera...' : 'Prijavi se'}
        </button>
      </form>
    </main>
  );
}
