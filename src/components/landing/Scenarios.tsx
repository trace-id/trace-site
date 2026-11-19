'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpCircle, Check, Cookie, Database, Eraser, EyeOff, Fingerprint, Link2, type LucideIcon, Pause, Play, RotateCw, UserPlus, VenetianMask, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BrowserLogo } from '@/components/playground/logos';
import { Badge, EASE_OUT, IconButton, StatGrid, StatTile, Tooltip, WindowCard } from '@/components/ui';

const VID = 'v8f3k2m9q7x1d4w6zQa2';
const DEV = 'd2n7p4r8t1k6m3q9sXb5';

interface Scenario {
  id: string;
  tab: string;
  title: string;
  Icon: LucideIcon | null;
  browser: string;
  private?: boolean;
  visitorId: string;
  match: 'new' | 'token' | 'similar';
  confidence: number | null;
  cookie: boolean;
  storage: boolean;
  note: string;
}

const SCENARIOS: Scenario[] = [
  { id: 'first', tab: 'First visit', title: 'First visit', Icon: UserPlus, browser: 'Chrome 131', visitorId: VID, match: 'new', confidence: null, cookie: false, storage: false, note: 'A visitor ID is issued and a first-party cookie set.' },
  { id: 'return', tab: 'Comes back', title: 'Comes back', Icon: RotateCw, browser: 'Chrome 131', visitorId: VID, match: 'token', confidence: 1, cookie: true, storage: true, note: 'The cookie is still there: an exact match.' },
  { id: 'private', tab: 'Private window', title: 'Private window', Icon: VenetianMask, browser: 'Chrome 131', private: true, visitorId: VID, match: 'similar', confidence: 0.97, cookie: false, storage: false, note: 'Nothing stored, so the device traits match. Same ID.' },
  { id: 'cleared', tab: 'Cookies cleared', title: 'Cookies cleared', Icon: Eraser, browser: 'Chrome 131', visitorId: VID, match: 'similar', confidence: 0.98, cookie: false, storage: false, note: 'Everything stored is gone. The traits are not.' },
  { id: 'update', tab: 'Updated', title: 'Browser updated', Icon: ArrowUpCircle, browser: 'Chrome 132', visitorId: VID, match: 'token', confidence: 1, cookie: true, storage: true, note: 'Version traits changed; the rest of the device agrees.' },
  { id: 'firefox', tab: 'Other browser', title: 'Another browser', Icon: null, browser: 'Firefox 133', visitorId: 'v5h2j8k4l1m9n3b7cRt0', match: 'new', confidence: null, cookie: false, storage: false, note: 'New browser, new visitor ID, same device ID (0.94).' },
];

const DWELL = 3800;
const MATCH: Record<Scenario['match'], { label: string; Icon: LucideIcon }> = {
  new: { label: 'New visitor', Icon: UserPlus },
  token: { label: 'Cookie', Icon: Cookie },
  similar: { label: 'Device traits', Icon: Fingerprint },
};

/** Pick a situation in the window header; the browser state and Trace's result show what happens to the ID. Example values. */
export function Scenarios() {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  const reduce = useReducedMotion();
  const s = SCENARIOS[i]!;
  const same = s.visitorId === VID;
  const M = MATCH[s.match];
  const conf = s.confidence ?? 0;

  useEffect(() => {
    if (!auto || reduce) return;
    const t = setTimeout(() => setI((n) => (n + 1) % SCENARIOS.length), DWELL);
    return () => clearTimeout(t);
  }, [i, auto, reduce]);

  const layers = [
    { k: 'Cookie', Icon: Cookie, on: s.cookie, v: s.cookie ? 'present' : 'gone' },
    { k: 'Storage', Icon: Database, on: s.storage, v: s.storage ? 'present' : 'gone' },
    { k: 'Private mode', Icon: EyeOff, on: !!s.private, v: s.private ? 'on' : 'off', warn: true },
    { k: 'Device traits', Icon: Fingerprint, on: true, v: 'matched' },
  ];

  return (
    <WindowCard
      className="sc"
      title="trace.get()"
      tabs={SCENARIOS.map((x) => ({ id: x.id, label: x.tab }))}
      activeTab={s.id}
      onTabChange={(id) => { setI(SCENARIOS.findIndex((x) => x.id === id)); setAuto(false); }}
      action={!reduce ? <Tooltip content={auto ? 'Pause the walkthrough' : 'Play the walkthrough'}><IconButton size="sm" variant="ghost" icon={auto ? <Pause size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />} onClick={() => setAuto((a) => !a)} label={auto ? 'Pause the walkthrough' : 'Play the walkthrough'} /></Tooltip> : undefined}
    >
      <div className="sc-body" aria-live="polite">
        <div className={`sc-browser${s.private ? ' is-private' : ''}`}>
          <BrowserLogo name={s.browser} size={16} />
          <b>{s.browser}</b>
          {s.private && <Badge size="sm" mono icon={<VenetianMask size={12} />}>Private window</Badge>}
          <code>yourapp.com/signup</code>
        </div>

        <ul className="sc-layers" aria-label="What survived">
          {layers.map(({ k, Icon, on, v, warn }) => (
            <li key={k} className={on ? (warn ? 'warn' : 'on') : 'off'}>
              <span className="k"><Icon size={14} strokeWidth={1.8} aria-hidden="true" />{k}</span>
              <span className="v">
                {warn ? null : on ? <Check size={12} strokeWidth={2.4} aria-hidden="true" /> : <X size={12} strokeWidth={2.4} aria-hidden="true" />}
                {v}
              </span>
            </li>
          ))}
        </ul>

        <div className="sc-stage">
        <AnimatePresence initial={false} mode="popLayout">
        <motion.div key={s.id} className="sc-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.2, ease: EASE_OUT }}>
          <StatGrid columns={2}>
            <StatTile mono tone={same ? 'accent' : 'default'} label="Visitor ID" value={<span className="sc-id">{s.visitorId}{same ? <Badge tone="low" size="sm" icon={<Check size={11} strokeWidth={3} />}>Same ID</Badge> : <Badge tone="accent" size="sm">New ID</Badge>}</span>} />
            <StatTile mono label="Device ID" value={<span className="sc-id">{DEV}<Badge tone="low" size="sm" icon={<Link2 size={11} strokeWidth={2.5} />}>Same device</Badge></span>} />
          </StatGrid>

          <div className="sc-match">
            <div className="sc-match-h">
              <span className="sc-kind"><M.Icon size={14} strokeWidth={1.9} aria-hidden="true" />{M.label}</span>
              <span className="sc-conf">{s.confidence === null ? 'no match yet' : <>confidence <b>{s.confidence.toFixed(2)}</b></>}</span>
            </div>
            <div className="sc-ruler" role="meter" aria-label="Match confidence" aria-valuemin={0} aria-valuemax={1} aria-valuenow={conf} aria-valuetext={s.confidence === null ? 'No match yet' : s.confidence.toFixed(2)}>
              <motion.i initial={false} animate={{ scaleX: conf }} transition={reduce ? { duration: 0 } : { duration: 0.35, ease: EASE_OUT }} />
            </div>
            <div className="sc-ticks" aria-hidden="true"><span>0</span><span>0.5</span><span>1</span></div>
          </div>
          <p className="sc-note">{s.note}</p>
        </motion.div>
        </AnimatePresence>
        </div>
      </div>
    </WindowCard>
  );
}
