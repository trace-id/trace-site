'use client';

import {
  Activity, Bot, Check, Clock3, FileText, Fingerprint, Globe2, Laptop, Lock, MessageSquare, MousePointer2, Phone,
  ShieldAlert, ShoppingCart, Smartphone, Tablet, Ticket, User,
} from 'lucide-react';
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { type CSSProperties, type ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
import { IconButton, Tooltip, WindowCard } from '@/components/ui';
import './scenes.css';

export type Verdict = 'allow' | 'review' | 'block';
export interface SceneRow { a: string; b: string; verdict: Verdict; note: string }
export type SceneKind = 'graph' | 'pointer' | 'queue' | 'burst' | 'map' | 'clock' | 'seats' | 'meter' | 'evidence' | 'stack' | 'poll' | 'otp';

const V_LABEL = { allow: 'Allow', review: 'Challenge', block: 'Block' };

interface SceneCtl { paused: boolean; manual: number | null; report: (n: number) => void }
const Ctl = createContext<SceneCtl>({ paused: false, manual: null, report: () => {} });

/** Steps through the rows on a loop: 0..rows (each row appears), then holds and restarts. Starts complete for SSR and reduced motion.
 *  Pauses on hover, focus or when off screen; a step picked by hand (manual) wins over the loop. `base` offsets scenes with a lead-in step. */
function useStep(count: number, ms = 1300, base = 0): number {
  const { paused, manual, report } = useContext(Ctl);
  const [tick, setTick] = useState(count);
  const [motionOk, setMotionOk] = useState(false);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setMotionOk(true);
    setTick(1);
  }, [count]);
  useEffect(() => {
    if (!motionOk || paused) return;
    const total = count + 2;
    const t = setInterval(() => setTick((i) => (i >= total ? 1 : i + 1)), ms);
    return () => clearInterval(t);
  }, [count, ms, motionOk, paused]);
  const step = manual != null ? Math.min(manual + base, count) : Math.min(tick, count);
  useEffect(() => report(step - base), [step, base, report]);
  return step;
}

function Pill({ v }: { v: Verdict }) {
  return <span className="sc-pill" data-v={v}>{V_LABEL[v]}</span>;
}

/** The caption lives in the page's <figcaption>; the frame only carries the diagram and its running totals. */
function Frame({ title, children, foot }: { title: string; children: ReactNode; foot?: ReactNode }) {
  return (
    <div className="sc" aria-label={title} role="img">
      <div className="sc-body">{children}</div>
      {foot && <div className="sc-foot">{foot}</div>}
    </div>
  );
}

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const worst = (rows: SceneRow[]) => (rows.some((r) => r.verdict === 'block') ? 'block' : rows.some((r) => r.verdict === 'review') ? 'review' : 'allow');

/* 1. Device graph: accounts attach to one device, the device lights up as the count passes the limit. */
function GraphScene({ rows, caption }: { rows: SceneRow[]; caption: string }) {
  const step = useStep(rows.length);
  const shown = rows.slice(0, step);
  const state = shown.length ? worst(shown) : 'allow';
  // Satellites sit on an ellipse in percent of the box, so the SVG edges (viewBox 0..100) line up at any width.
  const pos = (i: number) => {
    const ang = (-90 + (360 / rows.length) * i) * (Math.PI / 180);
    return { x: 50 + Math.cos(ang) * 33, y: 50 + Math.sin(ang) * 36 };
  };
  return (
    <Frame title={caption} foot={<><span className="sc-k">accounts on device</span><b className="sc-count" data-v={state}>{shown.length}</b><span className="sc-k">limit 2</span></>}>
      <div className="sc-graph">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {rows.map((r, i) => {
            const p = pos(i);
            return <line key={i} x1={50} y1={50} x2={p.x} y2={p.y} vectorEffect="non-scaling-stroke" className="sc-edge" data-on={i < step} data-v={r.verdict} />;
          })}
        </svg>
        <div className="sc-hub" data-v={state}>
          <Laptop size={26} aria-hidden="true" />
          <span>one device</span>
          <code>deviceId Xk3p…</code>
        </div>
        {rows.map((r, i) => {
          const p = pos(i);
          const style = { '--x': `${p.x}%`, '--y': `${p.y}%` } as CSSProperties;
          return (
            <div key={i} className="sc-sat" style={style} data-on={i < step} data-v={r.verdict}>
              <User size={13} aria-hidden="true" />
              <b>{r.a}</b>
              <small>{r.b}</small>
              <Pill v={r.verdict} />
            </div>
          );
        })}
      </div>
    </Frame>
  );
}

/* 2. Pointer paths: a person's curved, uneven path vs a script's straight line and metronome keystrokes. */
function PointerScene({ rows, caption }: { rows: SceneRow[]; caption: string }) {
  const step = useStep(rows.length, 1600);
  return (
    <Frame title={caption}>
      <div className="sc-lanes">
        {rows.map((r, i) => {
          const human = r.verdict === 'allow';
          const d = human ? `M 8 ${40 + (i % 2) * 6} C 70 ${8 + i * 3}, 120 ${70 - i * 4}, 190 30 S 280 ${12 + i * 4}, 312 34` : 'M 8 34 L 312 34';
          return (
            <div key={i} className="sc-lane" data-on={i < step} data-v={r.verdict}>
              <div className="sc-lane-head">
                {human ? <User size={13} aria-hidden="true" /> : <Bot size={13} aria-hidden="true" />}
                <b>{r.a}</b>
                <small>{r.b}</small>
                <Pill v={r.verdict} />
              </div>
              <svg viewBox="0 0 320 68" aria-hidden="true">
                <path d={d} className="sc-path" pathLength={1} />
                {Array.from({ length: 9 }, (_, k) => (
                  <rect key={k} x={14 + k * 34 + (human ? (hash(r.a + k) % 14) - 7 : 0)} y={56} width={3} height={human ? 4 + (hash(r.b + k) % 7) : 7} rx={1} className="sc-key" />
                ))}
              </svg>
              <MousePointer2 className="sc-cursor" size={14} aria-hidden="true" />
              <small className="sc-note">{r.note}</small>
            </div>
          );
        })}
      </div>
    </Frame>
  );
}

/* 3. Drop queue: a countdown, then carts race in; bot carts are pulled out before checkout. */
function QueueScene({ rows, caption }: { rows: SceneRow[]; caption: string }) {
  const step = useStep(rows.length + 1, 1200, 1);
  const live = step > 0;
  return (
    <Frame title={caption} foot={<><Ticket size={14} aria-hidden="true" /><span className="sc-k">{live ? 'drop is live' : 'drop opens in 00:01'}</span></>}>
      <div className="sc-queue">
        <div className="sc-drop" data-live={live}><Clock3 size={18} aria-hidden="true" /><b>{live ? 'LIVE' : '00:01'}</b></div>
        <div className="sc-carts">
          {rows.map((r, i) => (
            <div key={i} className="sc-cart" data-on={i < step - 1} data-v={r.verdict} style={{ '--d': `${r.verdict === 'allow' ? 0.9 : 0.15}s` } as CSSProperties}>
              <ShoppingCart size={15} aria-hidden="true" />
              <b>{r.a}</b>
              <span className="sc-mono">{r.b}</span>
              <Pill v={r.verdict} />
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

/* 4. Velocity burst: bars climb per row past a dashed threshold. */
function BurstScene({ rows, caption }: { rows: SceneRow[]; caption: string }) {
  const step = useStep(rows.length, 1100);
  const bars = 16;
  return (
    <Frame title={caption} foot={<><span className="sc-k">events per visitor, 5 min</span><span className="sc-legend" /> <span className="sc-k">threshold</span></>}>
      <div className="sc-burst">
        <div className="sc-bars">
          {Array.from({ length: bars }, (_, k) => {
            const zone = Math.floor((k / bars) * rows.length);
            const on = zone < step;
            const h = 8 + Math.pow(zone + 1, 1.9) * 7 + (hash(`${k}`) % 9);
            const v = rows[zone]?.verdict ?? 'allow';
            return <i key={k} data-on={on} data-v={v} style={{ height: on ? `${Math.min(h, 96)}%` : '4%' }} />;
          })}
          <span className="sc-threshold" />
        </div>
        <div className="sc-ticks">
          {rows.map((r, i) => (
            <div key={i} data-on={i < step}>
              <Activity size={13} aria-hidden="true" />
              <span className="sc-mono">{r.a}</span>
              <span>{r.b}</span>
              <Pill v={r.verdict} />
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

/** Pin positions spread over the map so labels never overlap. */
const PIN_SPOTS: [number, number][] = [[14, 22], [56, 16], [22, 66], [62, 60], [38, 40]];

/* 5. Login map: pins drop on a dotted map; known devices glow, new ones pulse. */
function MapScene({ rows, caption }: { rows: SceneRow[]; caption: string }) {
  const step = useStep(rows.length, 1400);
  const dots = Array.from({ length: 22 * 11 }, (_, k) => k).filter((k) => (hash(`m${k}`) % 5) < 3);
  return (
    <Frame title={caption}>
      <div className="sc-map">
        <div className="sc-world" aria-hidden="true">
          {dots.map((k) => <i key={k} style={{ left: `${(k % 22) * 4.6 + 1}%`, top: `${Math.floor(k / 22) * 9 + 3}%` }} />)}
        </div>
        {rows.map((r, i) => {
          const spot = PIN_SPOTS[i % PIN_SPOTS.length]!;
          const style = { left: `${spot[0]}%`, top: `${spot[1]}%` } as CSSProperties;
          return (
            <div key={i} className="sc-pin" style={style} data-on={i < step} data-v={r.verdict}>
              <span className="sc-ripple" />
              <span className="sc-dot" />
              <div className="sc-tag"><b>{r.a}</b><small>{r.b}</small></div>
            </div>
          );
        })}
      </div>
      <div className="sc-maplist">
        {rows.map((r, i) => (
          <div key={i} data-on={i < step}>{r.a.includes('Phone') || r.a.includes('iPhone') ? <Smartphone size={13} /> : <Laptop size={13} />}<span>{r.note}</span><Pill v={r.verdict} /></div>
        ))}
      </div>
    </Frame>
  );
}

/* 6. Clock vs IP: the device's clock and the IP's country dial; a mismatch draws a warning arc. */
function ClockScene({ rows, caption }: { rows: SceneRow[]; caption: string }) {
  const step = useStep(rows.length, 1700);
  const cur = rows[Math.max(0, step - 1)]!;
  const off = (s: string) => Number((/UTC([+-]\d+)/.exec(s)?.[1]) ?? 0);
  const devAngle = off(cur.b) * 15;
  const ipAngle = cur.verdict === 'allow' ? devAngle : devAngle + 75 + (hash(cur.a) % 60);
  return (
    <Frame title={caption}>
      <div className="sc-clocks">
        <div className="sc-dial">
          <span className="sc-dial-k"><Clock3 size={13} aria-hidden="true" />Device clock</span>
          <div className="sc-face"><i className="sc-hand" style={{ transform: `rotate(${devAngle}deg)` }} />{Array.from({ length: 12 }, (_, k) => <b key={k} style={{ transform: `rotate(${k * 30}deg)` }} />)}</div>
          <code>{cur.b}</code>
        </div>
        <div className="sc-vs" data-v={cur.verdict}>{cur.verdict === 'allow' ? <Check size={18} /> : <ShieldAlert size={18} />}<small>{cur.verdict === 'allow' ? 'consistent' : 'mismatch'}</small></div>
        <div className="sc-dial">
          <span className="sc-dial-k"><Globe2 size={13} aria-hidden="true" />IP location</span>
          <div className="sc-face ip"><i className="sc-hand" style={{ transform: `rotate(${ipAngle}deg)` }} />{Array.from({ length: 12 }, (_, k) => <b key={k} style={{ transform: `rotate(${k * 30}deg)` }} />)}</div>
          <code>{cur.a}</code>
        </div>
      </div>
      <div className="sc-steps">
        {rows.map((r, i) => <span key={i} data-on={i < step} data-cur={i === step - 1} data-v={r.verdict} title={r.note} />)}
        <small>{cur.note}</small>
      </div>
    </Frame>
  );
}

/* 7. Seats: device slots fill up; the one past the limit shakes. */
function SeatsScene({ rows, caption }: { rows: SceneRow[]; caption: string }) {
  const step = useStep(rows.length, 1300);
  const icon = (s: string) => (/phone|android|iphone/i.test(s) ? Smartphone : /tablet|ipad/i.test(s) ? Tablet : Laptop);
  return (
    <Frame title={caption} foot={<><span className="sc-k">devices on this account</span><b className="sc-count" data-v={worst(rows.slice(0, step))}>{step}</b><span className="sc-k">of 5 allowed</span></>}>
      <div className="sc-seats">
        {rows.map((r, i) => {
          const I = icon(r.a);
          return (
            <div key={i} className="sc-seat" data-on={i < step} data-v={r.verdict}>
              <I size={22} aria-hidden="true" />
              <b>{r.a}</b>
              <small>{r.b}</small>
              <Pill v={r.verdict} />
            </div>
          );
        })}
        <div className="sc-seat empty"><span>+</span></div>
      </div>
    </Frame>
  );
}

/* 8. Meter: reads or credits count across windows that normally reset them; the wall slides up at the limit. */
function MeterScene({ rows, caption }: { rows: SceneRow[]; caption: string }) {
  const step = useStep(rows.length, 1400);
  const pct = Math.round((step / rows.length) * 100);
  const walled = rows.slice(0, step).some((r) => r.verdict === 'block');
  return (
    <Frame title={caption}>
      <div className="sc-meter">
        <div className="sc-ring" style={{ '--p': `${pct}` } as CSSProperties} data-v={walled ? 'block' : step && rows[step - 1]!.verdict === 'review' ? 'review' : 'allow'}>
          <b>{step}</b><small>of {rows.length}</small>
        </div>
        <div className="sc-tabs">
          {rows.map((r, i) => (
            <div key={i} className="sc-tabrow" data-on={i < step} data-cur={i === step - 1}>
              <FileText size={13} aria-hidden="true" />
              <b>{r.a}</b>
              <span className="sc-chip">{r.b}</span>
              <Pill v={r.verdict} />
            </div>
          ))}
        </div>
        <div className="sc-wall" data-on={walled}><Lock size={16} aria-hidden="true" /><b>Limit reached</b><small>Same visitor, different window</small></div>
      </div>
    </Frame>
  );
}

/* 9. Evidence: orders on a timeline; the disputed one links back to the same browser. */
function EvidenceScene({ rows, caption }: { rows: SceneRow[]; caption: string }) {
  const step = useStep(rows.length, 1500);
  const done = step >= rows.length;
  return (
    <Frame title={caption} foot={<><Fingerprint size={14} aria-hidden="true" /><span className="sc-k">{done ? 'same visitorId on every order' : 'collecting history'}</span></>}>
      <div className="sc-evidence" data-done={done}>
        {rows.map((r, i) => (
          <div key={i} className="sc-order" data-on={i < step} data-v={r.verdict}>
            <span className="sc-node" />
            <b>{r.a}</b>
            <span className="sc-chip"><Fingerprint size={12} aria-hidden="true" />{r.b}</span>
            <small>{r.note}</small>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/* 10. Stack: identities pile onto one device pedestal. */
function StackScene({ rows, caption }: { rows: SceneRow[]; caption: string }) {
  const step = useStep(rows.length, 1400);
  return (
    <Frame title={caption}>
      <div className="sc-stack">
        <div className="sc-cards">
          {rows.map((r, i) => (
            <div key={i} className="sc-idcard" data-on={i < step} data-v={r.verdict} style={{ '--i': i, '--r': `${(hash(r.a) % 9) - 4}deg` } as CSSProperties}>
              <User size={15} aria-hidden="true" />
              <span><b>{r.a}</b><small>{r.note}</small></span>
              <Pill v={r.verdict} />
            </div>
          ))}
        </div>
        <div className="sc-pedestal" data-v={worst(rows.slice(0, step))}>
          <Fingerprint size={20} aria-hidden="true" />
          <span>One device</span>
          <b>{step} {step === 1 ? 'identity' : 'identities'}</b>
        </div>
      </div>
    </Frame>
  );
}

/* 11. Poll: votes arrive; duplicates from one device are struck out and the bars correct. */
function PollScene({ rows, caption }: { rows: SceneRow[]; caption: string }) {
  const step = useStep(rows.length, 1300);
  const shown = rows.slice(0, step);
  const counted = shown.filter((r) => r.verdict === 'allow').length;
  const rejected = shown.length - counted;
  return (
    <Frame title={caption} foot={<><span className="sc-k">counted</span><b className="sc-count" data-v="allow">{counted}</b><span className="sc-k">removed</span><b className="sc-count" data-v="block">{rejected}</b></>}>
      <div className="sc-poll">
        <div className="sc-pbars">
          <div><span>Counted</span><i style={{ width: `${(counted / rows.length) * 100}%` }} data-v="allow" /></div>
          <div><span>Same device</span><i style={{ width: `${(rejected / rows.length) * 100}%` }} data-v="block" /></div>
        </div>
        <div className="sc-votes">
          {rows.map((r, i) => (
            <div key={i} data-on={i < step} data-v={r.verdict}>
              <b>{r.a}</b><span className="sc-chip">{r.b}</span><Pill v={r.verdict} />
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

/* 12. OTP: text messages queue toward numbers; pumped ones are stopped before they cost anything. */
function OtpScene({ rows, caption }: { rows: SceneRow[]; caption: string }) {
  const step = useStep(rows.length, 1200);
  const saved = rows.slice(0, step).filter((r) => r.verdict === 'block').length;
  return (
    <Frame title={caption} foot={<><MessageSquare size={14} aria-hidden="true" /><span className="sc-k">texts not sent</span><b className="sc-count" data-v="block">{saved}</b></>}>
      <div className="sc-otp">
        <div className="sc-phone"><Phone size={18} aria-hidden="true" /><span>Send code</span></div>
        <div className="sc-sms">
          {rows.map((r, i) => (
            <div key={i} className="sc-bubble" data-on={i < step} data-v={r.verdict}>
              <span className="sc-mono">{r.a}</span>
              <small>{r.b}</small>
              <Pill v={r.verdict} />
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

const SCENES: Record<SceneKind, (p: { rows: SceneRow[]; caption: string }) => ReactNode> = {
  graph: GraphScene, pointer: PointerScene, queue: QueueScene, burst: BurstScene, map: MapScene, clock: ClockScene,
  seats: SeatsScene, meter: MeterScene, evidence: EvidenceScene, stack: StackScene, poll: PollScene, otp: OtpScene,
};

export function Scene({ kind, rows, caption }: { kind: SceneKind; rows: SceneRow[]; caption: string }) {
  const S = SCENES[kind];
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [vis, setVis] = useState(false);
  const [user, setUser] = useState(false);
  const [manual, setManual] = useState<number | null>(null);
  const [cur, setCur] = useState(rows.length);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return setVis(true);
    const io = new IntersectionObserver(([e]) => setVis(!!e?.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const paused = !vis || hover || focus || user;
  const ctl: SceneCtl = { paused, manual, report: setCur };
  const pick = (n: number) => {
    setManual(n);
    setUser(true);
  };
  const resume = () => {
    setManual(null);
    setUser(false);
  };
  const shown = Math.max(1, cur);
  const row = rows[shown - 1] ?? rows[0]!;
  const playing = !(user || manual != null);
  return (
    <Ctl.Provider value={ctl}>
      <div
        ref={ref}
        className="scx"
        data-paused={vis && paused && !reduce}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
        onPointerLeave={() => setHover(false)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
      >
        <WindowCard
          title="scenario"
          tabs={rows.map((_, i) => ({ id: String(i + 1), label: `Step ${i + 1}` }))}
          activeTab={String(shown)}
          onTabChange={(id) => pick(Number(id))}
          action={
            <div className="scx-ctl" role="group" aria-label="Scene controls">
              <Tooltip content="Previous step">
                <IconButton size="sm" variant="ghost" label="Previous step" icon={<SkipBack size={13} aria-hidden="true" />} disabled={shown <= 1} onClick={() => pick(Math.max(1, shown - 1))} />
              </Tooltip>
              {!reduce && (
                <Tooltip content={playing ? 'Pause the sequence' : 'Play the sequence'}>
                  <button type="button" className="scx-play" onClick={() => (playing ? setUser(true) : resume())} aria-label={playing ? 'Pause the sequence' : 'Play the sequence'}>
                    {playing ? <Pause size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />}
                    <span>{playing ? 'Pause' : 'Play'}</span>
                  </button>
                </Tooltip>
              )}
              <Tooltip content="Next step">
                <IconButton size="sm" variant="ghost" label="Next step" icon={<SkipForward size={13} aria-hidden="true" />} disabled={shown >= rows.length} onClick={() => pick(Math.min(rows.length, shown + 1))} />
              </Tooltip>
            </div>
          }
        >
          <div className="scx-status">
            <span className="mono-label">Step {shown} of {rows.length}</span>
            <span className="scx-note">{row.note}</span>
            <Pill v={row.verdict} />
          </div>
          <S rows={rows} caption={caption} />
        </WindowCard>
      </div>
    </Ctl.Provider>
  );
}
