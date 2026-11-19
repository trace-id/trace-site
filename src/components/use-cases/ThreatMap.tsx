'use client';

import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Chip, CountUp, EASE_IN, EASE_OUT, WindowCard } from '@/components/ui';
import { UcIcon } from './UcIcon';
import { WEIGHTS } from './weights';

export interface ThreatCase {
  slug: string;
  title: string;
  short: string;
  icon: string;
  signals: { id: string; why: string }[];
}

/** An industry's use cases mapped to the signals that catch them, in a light window: cases on the left, signals with weights on the right. Point at a signal to see which cases share it. */
export function ThreatMap({ cases, linkable }: { cases: ThreatCase[]; linkable: string[] }) {
  const [active, setActive] = useState(cases[0]!.slug);
  const [lit, setLit] = useState<string | null>(null);
  const cur = cases.find((c) => c.slug === active) ?? cases[0]!;
  const link = new Set(linkable);

  const shared = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const c of cases) for (const s of c.signals) m.set(s.id, [...(m.get(s.id) ?? []), c.slug]);
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [cases]);
  const litCases = lit ? new Set(shared.find(([id]) => id === lit)?.[1]) : null;

  return (
    <WindowCard title="threat map">
      <div className="tm">
        <div className="tm-cases" role="group" aria-label="Use cases in this industry">
          {cases.map((c, i) => (
            <button key={c.slug} type="button" className="tm-case" aria-pressed={c.slug === active} data-lit={litCases ? litCases.has(c.slug) : undefined} onClick={() => setActive(c.slug)}>
              <span className="tm-n">{String(i + 1).padStart(2, '0')}</span>
              <UcIcon name={c.icon} size={17} />
              <span className="tm-ct"><b>{c.title}</b><small>{c.short}</small></span>
              <span className="tm-cn">{c.signals.length}<i> sig</i></span>
              {c.slug === active && <motion.span layoutId="tm-active" className="tm-ind" transition={{ type: 'spring', stiffness: 420, damping: 38, mass: 0.8 }} />}
            </button>
          ))}
        </div>

        <div className="tm-out">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={cur.slug} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT } }} exit={{ opacity: 0, transition: { duration: 0.15, ease: EASE_IN } }}>
              <div className="tm-out-head">
                <span className="mono-label">Caught by</span>
                <Link href={`/use-cases/${cur.slug}`} className="tm-link">{cur.title}<ArrowRight size={14} aria-hidden="true" /></Link>
              </div>
              <ul className="tm-sigs">
                {cur.signals.map((s, i) => {
                  const w = WEIGHTS[s.id];
                  return (
                    <li key={s.id}>
                      <div className="tm-sig-top">
                        {link.has(s.id) ? <Link href={`/docs/signals#signal-${s.id}`} className="tm-sig-name">{s.id}<ArrowUpRight size={13} aria-hidden="true" /></Link> : <span className="tm-sig-name">{s.id}</span>}
                        {w != null && <b><CountUp value={w} prefix="+" trigger="change" from={0} duration={0.4} /></b>}
                      </div>
                      {w != null && (
                        <span className="tm-scale" aria-hidden="true">
                          <motion.i initial={{ scaleX: 0 }} animate={{ scaleX: w / 60 }} transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.04 * i }} />
                        </span>
                      )}
                      <p>{s.why}</p>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="tm-shared">
        <span className="mono-label">Signals across these cases</span>
        <div>
          {shared.map(([id, slugs]) => (
            <Chip key={id} selected={lit === id} onPointerEnter={() => setLit(id)} onPointerLeave={() => setLit(null)} onFocus={() => setLit(id)} onBlur={() => setLit(null)} onClick={() => setLit(lit === id ? null : id)} aria-label={`${id}, used in ${slugs.length} of ${cases.length} cases`}>
              <span className="uc-mono">{id}</span><i className="uc-count">{slugs.length}</i>
            </Chip>
          ))}
        </div>
      </div>
    </WindowCard>
  );
}
