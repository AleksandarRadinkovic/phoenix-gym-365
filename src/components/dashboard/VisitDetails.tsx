// src/components/dashboard/VisitDetails.tsx — rasklopivi spisak ulazaka i provlačenja jednog dana
import { AlertTriangle, ChevronDown } from 'lucide-react';
import type { Visit } from '@/lib/gym/visits';
import { fmtGap } from '@/lib/gym/visits';
import { fmtDate, TZ } from '@/lib/gym/time';
import { cx } from './ui';

function hms(d: Date) {
  return d.toLocaleTimeString('sr-Latn-BA', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function VisitDetails({ visits, summary }: { visits: Visit[]; summary: string }) {
  const swipes = visits.reduce((s, v) => s + v.swipes.length, 0);
  const prevOtherDay = visits[0]?.suspicious && visits[0].prev ? visits[0].prev : null;

  return (
    <details className="group mt-1.5">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs text-zinc-400 hover:text-white [&::-webkit-details-marker]:hidden">
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
        {summary}
        {swipes > visits.length ? <span className="text-zinc-500"> · {swipes} provlačenja</span> : null}
      </summary>
      <ol className="mt-2 space-y-1.5 border-l border-white/10 pl-3 text-xs">
        {prevOtherDay && (
          <li className="text-zinc-500">
            Prethodni ulazak: {fmtDate(prevOtherDay)} u {hms(prevOtherDay)}
          </li>
        )}
        {visits.map((v, i) => (
          <li key={v.start.toISOString()} className={cx(v.suspicious ? 'text-rose-300' : 'text-zinc-300')}>
            <span className="font-semibold text-white">{i + 1}. ulazak</span> u{' '}
            <span className="tabular-nums">{hms(v.start)}</span>
            {v.gapMin !== null && i > 0 ? <span className="text-zinc-400"> · {fmtGap(v.gapMin)} nakon prethodnog</span> : null}
            {v.suspicious && (
              <span className="ml-1 inline-flex items-center gap-1 text-rose-300">
                <AlertTriangle className="h-3 w-3" /> {v.reason}
              </span>
            )}
            {v.exit && (
              <span className="block text-zinc-400">
                izlaz u <span className="tabular-nums">{hms(v.exit)}</span> · nakon {fmtGap((v.exit.getTime() - v.start.getTime()) / 60_000)}
              </span>
            )}
            {(() => {
              const dups = v.swipes.slice(1).filter((x) => !v.exit || x.getTime() !== v.exit.getTime());
              return dups.length ? (
                <span className="block text-zinc-500">ponovljen sken: {dups.map(hms).join(', ')}</span>
              ) : null;
            })()}
          </li>
        ))}
      </ol>
    </details>
  );
}
