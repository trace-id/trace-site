'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';
import { Button, EASE_IN, EASE_OUT, Meter, SPRING, WindowCard } from '@/components/ui';
import { SwitchRow } from '@/components/landing/controls';
import { useSpringScore } from '@/components/landing/useSpringScore';
import { WEIGHTS } from './weights';

const REVIEW = 25;
const BLOCK = 60;
const MAX_W = 60;
const DECISION = {
  allow: { t: 'Allow', s: 'Let the action through.' },
  review: { t: 'Challenge', s: 'Ask for a code, or send to review.' },
  block: { t: 'Block', s: 'Stop the action.' },
} as const;

/** Toggle one use case's signals and watch the score move along the Allow / Challenge / Block scale. Thresholds are example values, not server defaults. */
export function DecisionLab({ signals }: { signals: string[] }) {
  const ids = [...new Set(signals)].filter((s) => s in WEIGHTS);
  const [on, setOn] = useState<Set<string>>(() => new Set(ids.slice(0, 1)));
  const raw = [...on].reduce((s, id) => s + (WEIGHTS[id] ?? 0), 0);
  const score = Math.min(100, raw);
  const shown = useSpringScore(score);
  const uid = useId();
  const decision = score >= BLOCK ? 'block' : score >= REVIEW ? 'review' : 'allow';
  const fired = [...on].sort((a, b) => (WEIGHTS[b] ?? 0) - (WEIGHTS[a] ?? 0));
  const toggle = (id: string) =>
    setOn((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <WindowCard
      title="decision lab"
      action={
        <>
          <Button variant="ghost" size="sm" onClick={() => setOn(new Set(ids))}>All</Button>
          <Button variant="ghost" size="sm" onClick={() => setOn(new Set())}>None</Button>
        </>
      }
    >
      <div className="lab">
        <div className="lab-signals">
          <span className="mono-label">Signals</span>
          <div className="lab-list">
            {ids.map((id) => (
              <SwitchRow key={id} id={`${uid}-${id}`} label={id} weight={WEIGHTS[id] ?? 0} bar={(WEIGHTS[id] ?? 0) / MAX_W} checked={on.has(id)} onChange={() => toggle(id)} />
            ))}
          </div>
          <p className="lab-note">Weights are the defaults in <code>scoring.default.json</code>. The cut-offs at {REVIEW} and {BLOCK} are examples; your app sets its own.</p>
        </div>

        <div className="lab-out" data-v={decision}>
          <div className="lab-top">
            <div className="lab-score">
              <span className="lab-num" aria-hidden="true">{Math.round(shown)}</span>
              <span className="sr-only">{score}</span>
              <small>suspectScore / 100</small>
            </div>
            <div className="lab-decision" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={decision}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT } }}
                  exit={{ opacity: 0, y: -4, transition: { duration: 0.15, ease: EASE_IN } }}
                >
                  <b className="lab-verdict">{DECISION[decision].t}</b>
                  <small>{DECISION[decision].s}</small>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="lab-ruler">
            <Meter value={shown} showLevel={false} label="Suspect score against the example cut-offs" />
            <div className="lab-bands" aria-hidden="true"><span>Allow</span><span>Challenge</span><span>Block</span></div>
          </div>
          {raw > 100 && <p className="lab-cap">Sum is {raw}; the score is capped at 100.</p>}

          <div className="lab-reasons">
            <span className="mono-label">reasons</span>
            <ul>
              <AnimatePresence initial={false} mode="popLayout">
                {fired.length === 0 && (
                  <motion.li key="none" layout className="lab-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={{ duration: 0.2 }}>
                    No signal fired. The visitor reads as an ordinary device.
                  </motion.li>
                )}
                {fired.map((id) => (
                  <motion.li
                    key={id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0, transition: { duration: 0.2, ease: EASE_OUT } }}
                    exit={{ opacity: 0, x: 8, transition: { duration: 0.15, ease: EASE_IN } }}
                    transition={{ layout: SPRING }}
                  >
                    <code>{id}</code>
                    <b>+{WEIGHTS[id]}</b>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        </div>
      </div>
    </WindowCard>
  );
}
