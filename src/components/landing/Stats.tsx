'use client';

import { CountUp, Reveal } from '@/components/ui';

const STATS = [
  { n: 26, t: 'fraud signals, each with a reason' },
  { n: 9, t: 'SDKs: browser, mobile and server' },
  { n: 1, t: 'command to self-host' },
  { n: 0, t: 'per-call fees, ever' },
];

/** Four product facts as large numerals over mono captions, in a dashed grid. */
export function Stats() {
  return (
    <section className="frame-section" aria-label="At a glance">
      <div className="frame">
        <Reveal className="dashed-grid cols-4 lp-stats" stagger={0.05}>
          {STATS.map(({ n, t }) => (
            <div key={t} className="lp-stat">
              <b><CountUp value={n} duration={0.8} /></b>
              <span>{t}</span>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
