'use client';

import { AnimatePresence, motion } from 'motion/react';
import { RotateCcw, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { GROUPS, NAMES } from '@/components/playground/explain';
import { Badge, Button, ENTER, EXIT, Eyebrow, Meter, riskLevel, SPRING, WindowCard } from '@/components/ui';
import { FilterToggle, SwitchRow } from './controls';
import { useSpringScore } from './useSpringScore';

/** Default weights from scoring.default.json in the Trace repository. The score is their sum, capped at 100. */
const WEIGHTS: Record<string, number> = {
  bot: 60, replayedRequest: 50, antiDetect: 40, ipBlocklist: 40, tor: 30, tlsMismatch: 30, automatedInput: 30, tamperedRequest: 30, tampering: 25, multiAccount: 25, flaggedNetwork: 15, emulator: 30, rootedDevice: 20,
  vpn: 20, velocity: 20, aiAgent: 20, proxy: 20, datacenterIp: 15, virtualMachine: 15, crossBrowser: 15, highActivity: 15, accountSharing: 10,
  rareDevice: 10, incognito: 5, devtools: 5, privacyBrowser: 5,
};
const MAX_W = 60;

const PRESETS: { name: string; on: string[] }[] = [
  { name: 'Regular visitor', on: [] },
  { name: 'Private window', on: ['incognito'] },
  { name: 'VPN shopper', on: ['vpn', 'crossBrowser'] },
  { name: 'Multi-accounter', on: ['multiAccount', 'antiDetect', 'vpn'] },
  { name: 'Headless bot', on: ['bot', 'virtualMachine', 'datacenterIp'] },
];

const DECISION = {
  low: { word: 'Allow', Icon: ShieldCheck, tone: 'low' },
  med: { word: 'Challenge', Icon: ShieldAlert, tone: 'med' },
  high: { word: 'Block', Icon: ShieldX, tone: 'high' },
} as const;

/** The score as an instrument: switch signals on, the reading moves along the scale and every reason is itemised. */
export function ScoreSim() {
  const [on, setOn] = useState<Set<string>>(new Set(PRESETS[4]!.on));

  const reasons = useMemo(() => [...on].map((id) => ({ id, w: WEIGHTS[id]! })).sort((a, b) => b.w - a.w), [on]);
  const total = reasons.reduce((n, r) => n + r.w, 0);
  const score = Math.min(100, total);
  const level = riskLevel(score);
  const D = DECISION[level];
  const shown = useSpringScore(score);
  const uid = useId();
  const presetName = PRESETS.find((p) => p.on.length === on.size && p.on.every((x) => on.has(x)))?.name;

  const toggle = (id: string) => setOn((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <WindowCard
      className="ss"
      title="score.simulate"
      action={on.size > 0 ? <Button size="sm" variant="ghost" icon={<RotateCcw size={13} />} onClick={() => setOn(new Set())}>Reset</Button> : undefined}
    >
      <div className="ss-body">
        <div className="ss-left">
          <div className="ss-presets" role="group" aria-label="Examples">
            <Eyebrow>Start from</Eyebrow>
            <FilterToggle
              label="Example visitors"
              value={presetName ?? ''}
              onChange={(name) => setOn(new Set(PRESETS.find((p) => p.name === name)?.on ?? []))}
              options={PRESETS.map((p) => ({ value: p.name, label: p.name }))}
            />
          </div>
          <div className="ss-groups">
            {GROUPS.map(([g, ids]) => (
              <fieldset key={g}>
                <legend className="mono-label">{g}</legend>
                <div className="ss-switches">
                  {ids.map((id) => (
                    <SwitchRow key={id} id={`${uid}-${id}`} label={NAMES[id]} weight={WEIGHTS[id]!} checked={on.has(id)} onChange={() => toggle(id)} mono={false} />
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </div>

        <div className="ss-right">
          <div className="ss-head">
            <Eyebrow variant="upper">Suspect score</Eyebrow>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={level} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0, transition: ENTER }} exit={{ opacity: 0, transition: EXIT }}>
                <Badge tone={D.tone} icon={<D.Icon size={13} />}>{D.word}</Badge>
              </motion.span>
            </AnimatePresence>
          </div>
          <div className={`ss-num ${level}`}>
            <b>{Math.round(shown)}</b>
            <span>/ 100</span>
          </div>
          <Meter value={shown} label="Suspect score" className="ss-meter" />
          <p className="ss-legend" aria-hidden="true"><span>Allow 0–24</span><span>Challenge 25–59</span><span>Block 60+</span></p>

          <ol className="ss-reasons" aria-label="Score reasons">
            {reasons.length === 0 && <li className="none">No signal fired. Nothing added.</li>}
            <AnimatePresence initial={false} mode="popLayout">
              {reasons.map((r) => (
                <motion.li key={r.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: EXIT }} transition={SPRING}>
                  <span className="ss-name">{NAMES[r.id]}</span>
                  <span className="ss-bar" aria-hidden="true"><motion.i initial={{ scaleX: 0 }} animate={{ scaleX: r.w / MAX_W }} transition={SPRING} /></span>
                  <code>+{r.w}</code>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
          {total > 100 && <p className="ss-cap">Contributions add up to {total}; the score caps at 100, and every reason is still reported.</p>}
          <p className="ss-foot">Default weights from <code>scoring.default.json</code>. Tune them, or learn them from your own outcomes.</p>
          <p className="sr-only" role="status">Suspect score {score} of 100. Decision: {D.word}. {reasons.length} signals on.</p>
        </div>
      </div>
    </WindowCard>
  );
}
