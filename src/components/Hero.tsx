'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Bot, Check, Clock, Cookie, EyeOff, Fingerprint, Lock, type LucideIcon, ScanFace, UserPlus, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { type Check as SignalCheck, useLiveVisitor } from '@/lib/use-live-visitor';
import { ToastCopy } from './landing/controls';
import { useSpringScore } from './landing/useSpringScore';
import { AnnouncementPill, Button, CopyButton, EASE_OUT, riskLevel, SegmentedControl, StatGrid, StatTile, WindowCard } from '@/components/ui';
import { InstallWidget } from './install/InstallWidget';
import { BrowserLogo, OsLogo } from './playground/logos';
import './hero.css';

const c = (id: string, name: string, state: SignalCheck['state'], text: string): SignalCheck => ({ id, name, state, text });

/** A headless bot in a VM on a hosting network, scored with the default weights (60 + 15 + 15). Example data. */
const BOT = {
  visitorId: 'Q7mZ2xKp9LwR4tVb8NcE',
  matchKind: 'new' as const,
  confidence: 1,
  suspectScore: 90,
  ms: 214,
  browser: 'HeadlessChrome 131',
  os: 'Linux',
  all: {
    incognito: c('incognito', 'Private window', 'off', 'Regular window'),
    vpn: c('vpn', 'VPN / proxy', 'off', 'Not on a VPN list'),
    bot: c('bot', 'Bot / automation', 'on', 'webdriver flag; headless user agent'),
    antiDetect: c('antiDetect', 'Anti-detect browser', 'off', 'Page, worker and iframe agree'),
    datacenterIp: c('datacenterIp', 'Datacenter IP', 'on', 'Hosting network'),
    virtualMachine: c('virtualMachine', 'Virtual machine', 'on', 'Renderer: SwiftShader'),
  } as Record<string, SignalCheck>,
  reasons: [
    { name: 'Bot / automation', pts: 60 },
    { name: 'Virtual machine', pts: 15 },
    { name: 'Datacenter IP', pts: 15 },
  ] as { name: string; pts?: number }[],
};

const ROWS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: 'incognito', label: 'Private window', Icon: EyeOff },
  { id: 'vpn', label: 'VPN', Icon: Lock },
  { id: 'bot', label: 'Bot', Icon: Bot },
  { id: 'antiDetect', label: 'Spoofing', Icon: ScanFace },
];

const LEVEL = {
  low: { user: 'low-risk', line: 'No strong signs of fraud were found.' },
  med: { user: 'questionable', line: 'Some signals are worth a second look.' },
  high: { user: 'suspicious', line: 'We detected signals of fraud risk.' },
} as const;

const rise = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.24, ease: EASE_OUT, delay: 0.04 + i * 0.04 } });

/** Placeholder with the final element's footprint, so the card never shifts when the result arrives. */
const Sk = ({ w = '60%', h = 14, className = '' }: { w?: string | number; h?: number; className?: string }) => (
  <span aria-hidden="true" className={`hx-sk ${className}`} style={{ width: w, height: h }} />
);

/** Half-ring dial: ticks, a track and an arc that fills to the score. Decorative; the number beside it carries the meaning. */
function Dial({ score, ready, level }: { score: number; ready: boolean; level: 'low' | 'med' | 'high' }) {
  const reduce = useReducedMotion();
  const R = 78;
  const cx = 100;
  const cy = 100;
  const pt = (t: number, r: number) => [cx - r * Math.cos(Math.PI * t), cy - r * Math.sin(Math.PI * t)] as const;
  const arc = `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`;
  return (
    <svg className={`hx-dial ${level}`} viewBox="0 0 200 112" aria-hidden="true" focusable="false">
      {Array.from({ length: 21 }, (_, i) => {
        const t = i / 20;
        const [x1, y1] = pt(t, R + 9);
        const [x2, y2] = pt(t, R + (i % 5 === 0 ? 16 : 13));
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="tick" />;
      })}
      <path d={arc} className="track" pathLength={1} />
      <motion.path
        d={arc}
        className="fill"
        pathLength={1}
        initial={false}
        animate={{ pathLength: ready ? Math.max(0.015, score / 100) : 0 }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 22, restDelta: 0.001 }}
      />
    </svg>
  );
}

export function Hero() {
  const live = useLiveVisitor();
  const [view, setView] = useState<'you' | 'bot'>('you');

  const bot = view === 'bot';
  const v = bot ? { ...live, ...BOT, state: 'live' as const } : live;
  const ready = v.state !== 'loading';
  const score = v.suspectScore;
  const lvl = riskLevel(score);
  const L = LEVEL[lvl];
  const liveSrc = Object.keys(live.all).length ? Object.values(live.all) : live.checks;
  const reasons: { name: string; pts?: number }[] = bot ? BOT.reasons : liveSrc.filter((x) => x.state === 'on').map((x) => ({ name: x.name }));
  const KindIcon = v.matchKind === 'token' ? Cookie : v.matchKind === 'similar' ? Fingerprint : UserPlus;
  const kind = v.matchKind === 'token' ? 'Cookie' : v.matchKind === 'similar' ? 'Device traits' : v.matchKind === 'new' ? 'First visit' : '—';
  const row = (rid: string): SignalCheck | undefined => (bot ? BOT.all[rid] : live.all[rid] ?? live.checks.find((x) => x.id === rid));
  const sample = !bot && live.state === 'sample';
  const status = bot ? 'Example data' : live.state === 'loading' ? 'Identifying this browser…' : live.state === 'live' ? `Live · ${live.host}` : 'Sample data · server unreachable';
  const tag = bot ? 'Example data' : sample ? 'Sample data' : live.state === 'live' ? 'This is real data' : 'Identifying';
  const shownScore = useSpringScore(ready ? score : 0);

  return (
    <section className="frame-section hx" aria-labelledby="hero-title">
      <div className="frame">
        <div className="hx-top">
          <motion.div {...rise(0)}>
            <AnnouncementPill tag="New" href="/docs/react-native" cta="Learn how">React Native and Expo SDK</AnnouncementPill>
          </motion.div>
          <motion.h1 id="hero-title" className="h-hero" {...rise(1)}>
            <span>Same device.</span> <span className="accent">Same ID.</span>
          </motion.h1>
          <motion.p className="lede hx-lede" {...rise(2)}>
            Open-source device identification and fraud signals, self-hosted. Recognise returning visitors across private
            windows, cleared cookies and other browsers, even when they stay anonymous.
          </motion.p>
          <motion.div className="hx-install" {...rise(3)}>
            <InstallWidget />
          </motion.div>
          <motion.div className="hx-cta" {...rise(4)}>
            <Button href="/demo" size="lg" variant="primary">Live demo</Button>
            <Button href="/docs/quickstart" size="lg" variant="secondary">Quick start</Button>
          </motion.div>
        </div>

        <motion.div className="hx-stage" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.2 }}>
          <WindowCard
            className="hx-card"
            role="region"
            aria-label={bot ? 'Example: a headless bot, identified by Trace' : 'Your browser, identified by Trace'}
            title={<span className="hx-status"><i className={`hx-dot ${!ready ? 'wait' : bot || sample ? 'idle' : 'live'}`} aria-hidden="true" />{status}</span>}
            action={
              <SegmentedControl
                size="sm"
                label="Result to show"
                value={view}
                onChange={setView}
                className="hx-seg"
                options={[{ value: 'you', label: 'Your browser' }, { value: 'bot', label: 'Example bot' }]}
              />
            }
          >
            <div className="hx-body">
              <div className="hx-left">
                <div className="hx-hello">
                  <h2 className="hx-h2">
                    Hello, visitor ID{' '}
                    {ready ? <code className="hx-id hx-in" aria-label={`Visitor ID ${v.visitorId}`}>{v.visitorId}</code> : <Sk w={176} h={20} className="hx-sk-id" />}
                  </h2>
                  {ready && <ToastCopy><CopyButton size="sm" text={v.visitorId} ariaLabel="Copy visitor ID" /></ToastCopy>}
                </div>

                <StatGrid columns={3} className="hx-stats">
                  <StatTile label="Last seen" value={ready ? <span className="hx-v hx-in"><Clock size={13} aria-hidden="true" />{sample ? 'Example' : 'Just now'}</span> : <Sk w="55%" />} />
                  <StatTile label="Matched by" value={ready ? <span className="hx-v hx-in"><KindIcon size={13} aria-hidden="true" />{kind}</span> : <Sk w="65%" />} />
                  <StatTile label="Confidence" value={ready ? <span className="hx-in">{v.matchKind === 'new' ? 'New visitor' : v.confidence.toFixed(2)}</span> : <Sk w="45%" />} />
                  <StatTile label="Browser" value={ready ? <span className="hx-v hx-in"><BrowserLogo name={v.browser} size={14} />{v.browser}</span> : <Sk w="70%" />} />
                  <StatTile label="OS" value={ready ? <span className="hx-v hx-in"><OsLogo name={v.os} size={13} />{v.os}</span> : <Sk w="40%" />} />
                  <StatTile label="Identified in" value={ready ? <span className="hx-in">{v.ms} ms</span> : <Sk w="38%" />} />
                </StatGrid>

                <ul className="hx-sig" aria-label="Signals">
                  {ROWS.map((r) => <Signal key={r.id} label={r.label} Icon={r.Icon} c={row(r.id)} ready={ready} />)}
                </ul>
              </div>

              <div className="hx-right">
                <p className="hx-tag mono-label">{tag}</p>
                <div className="hx-gauge">
                  <Dial score={score} ready={ready} level={lvl} />
                  <div className={`hx-num ${lvl}`}>
                    {ready ? <b className="hx-in">{Math.round(shownScore)}</b> : <Sk w={64} h={36} className="hx-sk-num" />}
                    <span className="mono-label">Suspect score</span>
                  </div>
                </div>
                <p className="hx-sentence">
                  {ready ? <span className="hx-in">You look like a <code className={`hx-chip ${lvl}`}>{L.user}</code> user</span> : <Sk w="72%" h={20} className="hx-sk-line" />}
                </p>
                <p className="hx-detail">{ready ? <span className="hx-in">{reasons.length ? `We detected: ${reasons.slice(0, 3).map((r) => r.name).join(', ')}.` : L.line}</span> : <Sk w="58%" h={13} className="hx-sk-line" />}</p>
                <AnimatePresence initial={false}>
                  {ready && bot && (
                    <motion.ul className="hx-why" aria-label="Score reasons" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: EASE_OUT }}>
                      {BOT.reasons.map((r) => <li key={r.name}><span>{r.name}</span><code>+{r.pts}</code></li>)}
                    </motion.ul>
                  )}
                </AnimatePresence>
                <Link href="/docs/signals" className="hx-calc">See how this is calculated</Link>
              </div>
            </div>
            <p className="sr-only" role="status">{ready ? `Visitor ID ${v.visitorId}. Suspect score ${score} of 100. You look like a ${L.user} user.` : 'Identifying'}</p>
          </WindowCard>
          <p className="hx-note mono-label">Real demo, run against a Trace test server. Accuracy figures on this page are synthetic. <Link href="/privacy#live-demo">What the demo stores</Link></p>
        </motion.div>
      </div>
    </section>
  );
}

function Signal({ label, Icon, c, ready }: { label: string; Icon: LucideIcon; c: SignalCheck | undefined; ready: boolean }) {
  const state = !ready || !c ? 'pending' : c.state;
  return (
    <li className={`sg ${state}`} title={c?.text} aria-busy={state === 'pending' || undefined}>
      <span className="sg-k"><Icon size={14} strokeWidth={1.8} aria-hidden="true" />{label}</span>
      <span className="sg-v">
        {state === 'pending' ? <span aria-hidden="true" className="hx-sk" style={{ width: '50%', height: 13 }} /> : null}
        {state === 'on' ? <X size={13} strokeWidth={2.2} aria-hidden="true" /> : state === 'off' ? <Check size={13} strokeWidth={2.2} aria-hidden="true" /> : null}
        {state === 'pending' ? null : state === 'on' ? 'Detected' : state === 'na' ? 'Not checked' : 'Not detected'}
      </span>
    </li>
  );
}
