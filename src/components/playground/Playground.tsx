'use client';

import Link from 'next/link';
import { animate, AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ago,
  type DeviceGraph,
  explain,
  GROUPS,
  level,
  LEVEL_WORD,
  NAMES,
  TASKS,
  type TraceEvent,
} from './explain';
import { demoConfig, loadSdk } from '@/lib/load-sdk';
import { browserName, cap, osName } from '@/lib/ua';
import {
  AppWindow, ArrowRight, Bot, Check, ChevronDown, CircleDashed, Cookie, Copy, Eraser, Fingerprint, Globe, Laptop, LogIn, Loader, RotateCw, ScanFace, ShieldAlert, ShieldCheck, ShieldX, TriangleAlert, UserPlus, UserRound, Users, VenetianMask, X, Zap,
} from 'lucide-react';
import { BrowserLogo, OsLogo } from './logos';
import {
  Badge, Button, CountUp, EASE_IN, EASE_OUT, IconButton, IconTile, JsonView, Kbd, Meter, Panel, StatGrid, StatTile, Tabs, TabPanel, Tooltip, WindowCard,
} from '@/components/ui';
import { ToggleGroup, ToggleGroupItem } from '@/components/shadcn/toggle-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/shadcn/collapsible';
import { Progress } from '@/components/shadcn/progress';
import { Skeleton } from '@/components/shadcn/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/alert';
import { Input } from '@/components/shadcn/input';
import { cn } from '@/lib/utils';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Client = { get(o?: any): Promise<any>; disable(clear?: boolean): Promise<void>; enable(): void };
type StepState = 'wait' | 'run' | 'done' | 'fail' | 'skip';
type Step = { state: StepState; ms: number | null };
type Filter = 'all' | 'on' | 'off' | 'na';
type Scene = 'loading' | 'identifying' | 'data' | 'unconfigured' | 'unreachable' | 'error';
type HistoryItem = { at: number; eventId: string; visitorId: string; score: number; matchKind: string; linkedId: string | null; note: string };
type MainTab = 'id' | 'signals' | 'graph' | 'raw';
type RawTab = 'event' | 'browser' | 'graph';

const store = {
  get<T>(key: string, fallback: T): T {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : (JSON.parse(v) as T);
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
};
const session = {
  get: (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch {} },
  del: (k: string) => { try { sessionStorage.removeItem(k); } catch {} },
};
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz0123456789';

const STEPS = [
  {
    n: '01',
    name: 'Identify',
    where: 'Browser SDK → Trace server',
    body: 'The browser SDK reads device traits and asks the Trace server who this is. The browser never makes the decision.',
    href: '/docs/browser-sdk',
    link: 'Browser SDK',
  },
  {
    n: '02',
    name: 'Verify',
    where: 'Your backend, with the secret key',
    body: 'Your backend sends the event ID with its secret key and gets the trusted result back. Only a verified event should drive a decision.',
    href: '/docs/node',
    link: 'Node SDK',
  },
  {
    n: '03',
    name: 'Device graph',
    where: 'Browsers and accounts on this device',
    body: 'Trace looks up the other browsers and the accounts it has seen on the same device, and returns them as a graph.',
    href: '/docs/api',
    link: 'API reference',
  },
] as const;

/** Characters resolve left to right when a new id arrives. */
function useDecode(target: string) {
  const [shown, setShown] = useState('');
  const played = useRef(false);
  useEffect(() => {
    if (!target) return;
    // The scramble plays once per page view; later identifications swap the id in place.
    if (reduced() || played.current) { setShown(target); return; }
    let frame = 0;
    const t = setInterval(() => {
      frame++;
      const settled = Math.floor((target.length * frame) / 20);
      setShown(target.slice(0, settled) + Array.from(target.slice(settled), () => GLYPHS[(Math.random() * GLYPHS.length) | 0]).join(''));
      if (frame >= 20) { clearInterval(t); played.current = true; setShown(target); }
    }, 24);
    return () => clearInterval(t);
  }, [target]);
  return shown;
}

/** Eases a number toward its target so the score meter counts up as the marker moves. */
function useTween(target: number, seconds = 0.8) {
  const [v, setV] = useState(0);
  const last = useRef(0);
  useEffect(() => {
    if (reduced()) { setV(target); last.current = target; return; }
    const c = animate(last.current, target, { duration: seconds, ease: EASE_OUT, onUpdate: (n) => { last.current = n; setV(n); } });
    return () => c.stop();
  }, [target, seconds]);
  return v;
}

function StepMark({ s }: { s: StepState }) {
  if (s === 'done') return <span className="pg-mark is-done" aria-hidden="true"><Check size={12} strokeWidth={2.4} /></span>;
  if (s === 'run') return <span className="pg-mark is-run" aria-hidden="true"><Loader size={12} strokeWidth={2.2} /></span>;
  if (s === 'fail') return <span className="pg-mark is-fail" aria-hidden="true"><X size={12} strokeWidth={2.4} /></span>;
  return <span className="pg-mark" aria-hidden="true"><CircleDashed size={12} strokeWidth={2} /></span>;
}
const STEP_WORD: Record<StepState, string> = { wait: 'Waiting', run: 'Running', done: 'Complete', fail: 'Failed', skip: 'Skipped' };

/** Single-line value that truncates with an ellipsis; hover or focus shows the full value. */
function Trunc({ full, children, className }: { full: string; children?: ReactNode; className?: string }) {
  return (
    <Tooltip content={full}>
      <span className={cn('pg-trunc', className)} tabIndex={0}>{children ?? full}</span>
    </Tooltip>
  );
}

async function writeClipboard(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    try {
      const t = document.createElement('textarea');
      t.value = text; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(t); t.select();
      const ok = document.execCommand('copy'); t.remove(); return ok;
    } catch { return false; }
  }
}

/** Copy action: the icon swaps to a check and a toast confirms. */
function CopyAction({ text, label, ariaLabel, what }: { text: string; label?: string; ariaLabel: string; what: string }) {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const onClick = async () => {
    if (!(await writeClipboard(text))) { toast.error('Could not copy', { id: 'pg-copy' }); return; }
    setDone(true);
    toast.success('Copied', { id: 'pg-copy', description: what, duration: 1800 });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(false), 1800);
  };
  return (
    <button type="button" onClick={onClick} aria-label={label ? undefined : ariaLabel} className={cn('ui-copy pg-copy', label ? 'ui-copy-sm has-label' : 'ui-copy-md', done && 'is-done')}>
      <span className="ui-copy-icon" aria-hidden="true">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={done ? 'ok' : 'copy'} style={{ display: 'inline-flex' }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1, transition: enter }} exit={{ opacity: 0, transition: exit }}>
            {done ? <Check size={16} /> : <Copy size={16} />}
          </motion.span>
        </AnimatePresence>
      </span>
      {label && <span className="ui-copy-label">{done ? 'Copied' : label}</span>}
    </button>
  );
}

const FADE = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2, ease: EASE_OUT } } as const;
const enter = { duration: 0.22, ease: EASE_OUT };
const exit = { duration: 0.14, ease: EASE_IN };

export function Playground() {
  const client = useRef<Client | null>(null);
  const [host, setHost] = useState('');
  const [scene, setScene] = useState<Scene>('loading');
  const [problem, setProblem] = useState<{ code: string; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<Step[]>(STEPS.map(() => ({ state: 'wait' as StepState, ms: null })));
  const [browser, setBrowser] = useState<any>(null);
  const [event, setEvent] = useState<TraceEvent | null>(null);
  const [graph, setGraph] = useState<DeviceGraph | null>(null);
  const [account, setAccount] = useState('');
  const [done, setDone] = useState<Set<string>>(new Set());
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [main, setMain] = useState<MainTab>('id');
  const [rawTab, setRawTab] = useState<RawTab>('event');
  const [filter, setFilter] = useState<Filter>('all');
  const [cleared, setCleared] = useState(false);
  const [stuck, setStuck] = useState(false);
  const sentinel = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setDone(new Set(store.get<string[]>('demo.tasks', [])));
    setHistory(store.get<HistoryItem[]>('demo.history', []));
  }, []);

  // The tab strip is sticky under the site header; it gets a shadow only once the card scrolls beneath it.
  const showWindow = !(scene === 'unconfigured' || scene === 'unreachable' || (scene === 'error' && !event));
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setStuck(!e!.isIntersecting && e!.boundingClientRect.top < 0), { rootMargin: '-57px 0px 0px 0px', threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [showWindow]);

  const setStep = (i: number, state: StepState, ms: number | null = null) =>
    setSteps((s) => s.map((x, j) => (j === i ? { state, ms } : x)));

  const identify = useCallback(async (opts: { acct?: string; note?: string } = {}) => {
    if (!client.current || busy) return;
    setBusy(true);
    setProblem(null);
    setScene((s) => (s === 'data' ? 'data' : 'identifying'));
    setSteps([{ state: 'run', ms: null }, { state: 'wait', ms: null }, { state: 'wait', ms: null }]);
    const acct = (opts.acct ?? '').trim();
    let current = 0;
    try {
      const t0 = performance.now();
      const result = await client.current.get({ tags: { page: 'playground' }, ...(acct ? { linkedId: acct } : {}) });
      const t1 = performance.now();
      setStep(0, 'done', t1 - t0);
      setStep(1, 'run');
      current = 1;

      const res = await fetch('/api/demo/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId: result.eventId }) });
      const ev = (await res.json()) as TraceEvent & { message?: string; code?: string };
      const t2 = performance.now();
      if (!res.ok) throw Object.assign(new Error(ev.message || 'Verification failed'), { code: ev.code ?? `http_${res.status}` });
      setStep(1, 'done', t2 - t1);
      setStep(2, 'run');
      current = 2;

      let g: DeviceGraph | null = null;
      try {
        const gr = await fetch(`/api/demo/device?deviceId=${encodeURIComponent(ev.deviceId)}`);
        if (gr.ok) g = await gr.json();
      } catch {}
      setStep(2, g ? 'done' : 'skip', g ? performance.now() - t2 : null);

      const forgotten = session.get('demo.forgotten');
      const note = opts.note ?? (acct ? `Signed in as ${acct}` : history.length === 0 ? 'First run here' : 'Run again');
      const nextHistory = [{ at: Date.now(), eventId: ev.eventId, visitorId: ev.visitorId, score: ev.suspectScore, matchKind: ev.matchKind, linkedId: acct || null, note }, ...store.get<HistoryItem[]>('demo.history', [])].slice(0, 30);
      store.set('demo.history', nextHistory);

      const doneNow = new Set(store.get<string[]>('demo.tasks', []));
      const freshNow = new Set<string>();
      for (const task of TASKS) if (!doneNow.has(task.id) && task.ok(ev, { forgotten })) { doneNow.add(task.id); freshNow.add(task.id); }
      for (const id of freshNow) toast.success('Challenge passed', { id: `pg-task-${id}`, description: TASKS.find((t) => t.id === id)?.t });
      store.set('demo.tasks', [...doneNow]);
      setCleared(Boolean(forgotten));
      session.del('demo.forgotten');

      setBrowser(result);
      setEvent(ev);
      setGraph(g);
      setHistory(nextHistory);
      setDone(doneNow);
      setFresh(freshNow);
      setScene('data');
    } catch (err: any) {
      setStep(current, 'fail');
      const code: string = err?.code ?? 'error';
      setProblem({ code, message: err?.message ?? 'failed' });
      toast.error('Identification failed', { id: 'pg-error', description: `${code}: ${err?.message ?? 'failed'}` });
      setScene(code === 'network' || code === 'timeout' ? 'unreachable' : 'error');
    } finally {
      setBusy(false);
    }
  }, [busy, history.length]);

  const identifyRef = useRef(identify);
  identifyRef.current = identify;

  // Connect once: keys from the site's backend, the SDK from the Trace server itself.
  const connect = useCallback(async () => {
    setScene('loading');
    setProblem(null);
    const cfg = await demoConfig();
    if ('error' in cfg) {
      setProblem({ code: 'not_configured', message: cfg.error });
      setScene('unconfigured');
      return;
    }
    setHost(new URL(cfg.endpoint).host);
    try {
      const sdk = await loadSdk(cfg.endpoint);
      client.current = sdk.createClient({ apiKey: cfg.apiKey, endpoint: cfg.endpoint, timeoutMs: 8000, firstPartyCookie: true });
      void identifyRef.current();
    } catch {
      setProblem({ code: 'sdk_unreachable', message: `Could not load the SDK from ${cfg.endpoint}.` });
      setScene('unreachable');
    }
  }, []);
  useEffect(() => { void connect(); }, [connect]);

  const retry = () => (client.current ? void identify() : void connect());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'r' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      e.preventDefault();
      if (client.current) void identifyRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const forget = async () => {
    if (!client.current) return;
    if (event) session.set('demo.forgotten', event.visitorId);
    await client.current.disable(true);
    client.current.enable();
    toast('Forgot this browser', { id: 'pg-forget', description: 'Cookie and storage cleared. Identifying again.' });
    void identify({ note: 'After “Forget this browser”' });
  };

  const signIn = (e: FormEvent) => {
    e.preventDefault();
    const name = account.trim();
    if (!name) return;
    void identify({ acct: name });
  };

  const vid = useDecode(event?.visitorId ?? '');
  const lvl = event ? level(event.suspectScore) : 'low';
  const score = event?.suspectScore ?? 0;
  const scoreShown = useTween(score);
  const pts = useMemo(() => Object.fromEntries((event?.reasons ?? []).map((r) => [r.signal, r.contribution])), [event]);

  const groups = useMemo(() => {
    if (!event) return [];
    const signals = event.signals || {};
    const known = new Set(GROUPS.flatMap(([, ids]) => ids));
    const extra = Object.keys(signals).filter((id) => !known.has(id));
    const all: [string, string[]][] = extra.length ? [...GROUPS, ['Other', extra]] : GROUPS;
    return all
      .map(([title, ids]) => {
        const items = ids.filter((id) => signals[id]).map((id) => ({ id, ...explain(id, signals[id]!) }));
        return { title, items };
      })
      .filter((g) => g.items.length > 0);
  }, [event]);
  const counts = groups.flatMap((g) => g.items).reduce((c, x) => ({ ...c, [x.state]: (c[x.state] ?? 0) + 1 }), {} as Record<string, number>);
  const totalSignals = (counts.on ?? 0) + (counts.off ?? 0) + (counts.na ?? 0);

  // Device graph: browsers and accounts linked to this device.
  const nodes = useMemo(() => {
    if (!event) return [];
    const list: { kind: 'b' | 'a'; label: string; conf: number; you?: boolean; id: string }[] = [];
    const visitors = graph?.visitors ?? [{ visitorId: event.visitorId, browser: null }];
    const conf = Object.fromEntries((event.linkedVisitors || []).map((l) => [l.visitorId, l.confidence]));
    for (const v of visitors) {
      const you = v.visitorId === event.visitorId;
      list.push({ kind: 'b', id: v.visitorId, you, conf: you ? 1 : conf[v.visitorId] ?? 1, label: you ? browserName(event.attributes?.userAgent ?? '') : v.browser ? cap(v.browser) : 'Browser' });
    }
    for (const l of event.linkedVisitors || []) {
      if (!visitors.some((v) => v.visitorId === l.visitorId)) list.push({ kind: 'b', id: l.visitorId, conf: l.confidence, label: l.browser ? cap(l.browser) : 'Browser' });
    }
    for (const a of graph?.accounts ?? []) list.push({ kind: 'a', id: a.linkedId, conf: 1, label: a.linkedId });
    return list;
  }, [event, graph]);
  const browsersOnDevice = nodes.filter((n) => n.kind === 'b');
  const accountsOnDevice = nodes.filter((n) => n.kind === 'a');
  const hasGraph = browsersOnDevice.length > 1 || accountsOnDevice.length > 0;

  const attrs = event?.attributes ?? {};
  const ua: string = attrs.userAgent ?? '';
  const bName = browserName(ua);
  const os = osName(ua);
  const rawValue = rawTab === 'event' ? event : rawTab === 'browser' ? browser : graph;
  const conn: { tone: 'accent' | 'low' | 'high' | 'neutral'; label: string } =
    scene === 'loading' ? { tone: 'accent', label: 'Connecting' }
      : scene === 'unconfigured' ? { tone: 'neutral', label: 'Not configured' }
        : scene === 'unreachable' ? { tone: 'high', label: 'Unreachable' }
          : { tone: 'low', label: host || 'Connected' };
  const liveMsg = busy
    ? 'Identifying'
    : scene === 'data' && event
      ? `Identified. Visitor ${event.visitorId}, match ${event.matchKind}, suspect score ${event.suspectScore}, ${LEVEL_WORD[lvl]}. ${done.size} of ${TASKS.length} challenges done.`
      : problem?.message ?? '';

  const decision = { low: 'Allow', med: 'Challenge', high: 'Block' }[lvl];
  const DecisionIcon = event ? { low: ShieldCheck, med: ShieldAlert, high: ShieldX }[lvl] : Fingerprint;
  const KindIcon = event?.matchKind === 'token' ? Cookie : event?.matchKind === 'similar' ? Fingerprint : UserPlus;
  const TASK_ICON: Record<string, typeof Bot> = { return: RotateCw, forget: Eraser, incognito: VenetianMask, browser: AppWindow, accounts: Users, spoof: ScanFace, vpn: Globe, bot: Bot };

  const idRuns = {
    total: history.length,
    same: event ? history.filter((h) => h.visitorId === event.visitorId).length : 0,
    first: event ? history.filter((h) => h.visitorId === event.visitorId).reduce<number | null>((m, h) => (m === null || h.at < m ? h.at : m), null) : null,
  };
  const previous = history[1];
  const firstOpen = TASKS.find((t) => !done.has(t.id));
  const story = !event
    ? 'Collecting device signals…'
    : event.matchKind === 'token'
      ? cleared
        ? 'Recognised again after you cleared this site’s storage.'
        : 'Recognised by the first-party visitor cookie.'
      : event.matchKind === 'similar'
        ? cleared
          ? 'Recognised by device traits alone, after you cleared this site’s storage.'
          : 'Recognised by device traits alone: no cookie needed.'
        : 'New visitor: the first time Trace has seen this browser.';

  const FILTERS: { value: Filter; label: string; n: number }[] = [
    { value: 'all', label: 'All', n: totalSignals },
    { value: 'on', label: 'Fired', n: counts.on ?? 0 },
    { value: 'off', label: 'Clear', n: counts.off ?? 0 },
    { value: 'na', label: 'Not checked', n: counts.na ?? 0 },
  ];
  const rank = (s: string) => (s === 'on' ? 0 : s === 'na' ? 2 : 1);
  const groupsView = groups
    .map((g) => ({
      ...g,
      on: g.items.filter((x) => x.state === 'on').length,
      shown: [...g.items].sort((a, b) => rank(a.state) - rank(b.state)).filter((x) => filter === 'all' || x.state === filter),
    }))
    .filter((g) => g.shown.length > 0);
  const fired = counts.on ?? 0;

  const header = (withActions: boolean) => (
    <header className="pg-head">
      <Badge tone={conn.tone} dot mono size="sm" role="status" className="pg-conn">{conn.label}</Badge>
      <h1 className="h-hero pg-title">See Trace <span className="accent">in action</span></h1>
      <p className="lede pg-sub">
        Trace is reading your browser right now: a visitor ID, every fraud signal with its reason, and the device graph.{' '}
        <br className="pg-br" />
        Everything below is the real response from a test server, not a mock-up. <Link href="/privacy#live-demo">What the demo stores</Link>.
      </p>
      {withActions && (
        <div className="pg-actions">
          <Button size="sm" icon={<RotateCw size={16} />} loading={busy} disabled={!client.current} onClick={() => void identify()}>
            {busy ? 'Identifying' : 'Run again'}
          </Button>
          <Button size="sm" variant="secondary" icon={<Eraser size={16} />} onClick={forget} disabled={busy || !client.current || !event} title="Clear this site's cookie and storage, then identify again">
            Forget me
          </Button>
          <form onSubmit={signIn} className="pg-acct" role="search" aria-label="Act as an account">
            <LogIn size={16} aria-hidden="true" />
            <Input className="pg-acct-input" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="Act as an account…" aria-label="Account name" maxLength={64} autoComplete="off" spellCheck={false} />
            <IconButton type="submit" size="sm" label="Identify as this account" icon={<ArrowRight size={16} />} disabled={busy || !client.current || !account.trim()} />
          </form>
        </div>
      )}
    </header>
  );

  /* ---------- Problem states ---------- */
  if (scene === 'unconfigured' || scene === 'unreachable' || (scene === 'error' && !event)) {
    const title = scene === 'unconfigured' ? 'This demo isn’t connected to a Trace server.' : scene === 'unreachable' ? 'The Trace server didn’t answer.' : problem?.code === 'origin_not_allowed' ? 'The server refused this page’s origin.' : 'Something failed on the way.';
    return (
      <div className="pg">
        <section className="frame-section no-top pg-hero" aria-label="Live demo">
          <div className="frame frame-pad">
            {header(false)}
            <WindowCard className="pg-win" title="trace · demo" action={<Badge tone={conn.tone} dot mono size="sm">{conn.label}</Badge>}>
              <div className="pg-problem" role="alert">
                <IconTile icon={scene === 'unconfigured' ? <Fingerprint /> : <TriangleAlert />} size="lg" tone="ink" />
                <h2 className="h-doc">{title}</h2>
                <p className="lede">
                  {scene === 'unconfigured'
                    ? 'It needs an endpoint and a key pair. Nothing has been collected from your browser.'
                    : scene === 'unreachable'
                      ? `${host || 'The server'} may be down, or an extension may be blocking it.`
                      : problem?.code === 'origin_not_allowed'
                        ? 'Add this origin to the public key in the dashboard, then try again.'
                        : 'Trying again usually works. If not, check the server logs.'}
                </p>
                <div className="pg-actions">
                  {scene !== 'unconfigured' && <Button size="sm" icon={<RotateCw size={16} />} onClick={retry}>Try again</Button>}
                  <Button size="sm" variant="secondary" href="/docs/quickstart">{scene === 'unconfigured' ? 'Set up a server' : 'Run your own'}</Button>
                </div>
                <pre className="pg-pre">
                  {scene === 'unconfigured'
                    ? '$ ./setup.sh\n\n# then set TRACE_ENDPOINT, TRACE_PUBLIC_KEY\n# and TRACE_SECRET_KEY for this site'
                    : `code      ${problem?.code ?? 'error'}\nmessage   ${problem?.message ?? ''}\nserver    ${host || 'unknown'}`}
                </pre>
              </div>
            </WindowCard>
          </div>
        </section>
        <p className="sr-only" aria-live="polite">{liveMsg}</p>
      </div>
    );
  }

  const stat = (v: ReactNode) => (event ? v : <Skeleton className="pg-sk pg-sk-tile" aria-hidden="true" />);

  const tabItems = [
    { id: 'id' as const, label: <><span className="pg-tn">01</span> Identification</> },
    { id: 'signals' as const, label: <><span className="pg-tn">02</span> Signals</>, meta: event ? `${fired}/${totalSignals}` : undefined },
    { id: 'graph' as const, label: <><span className="pg-tn">03</span> Device graph</> },
    { id: 'raw' as const, label: <><span className="pg-tn">04</span> Raw responses</> },
  ];

  return (
    <div className={`pg${busy ? ' is-busy' : ''}`}>
      {/* Hero + the window */}
      <section className="frame-section no-top pg-hero" aria-label="Live demo">
        <div className="frame frame-pad">
          {header(true)}

          <WindowCard chrome={false} className="pg-win" aria-label="Your identification result">
            <span ref={sentinel} className="pg-sentinel" aria-hidden="true" />
            <div className={cn('ui-win-bar pg-bar', stuck && 'is-stuck')}>
              <span className="ui-win-dots" aria-hidden="true"><i /><i /><i /></span>
              <Tabs className="pg-tabs" mono idBase="pg-main" label="Demo sections" items={tabItems} value={main} onChange={setMain} />
              <div className="ui-win-action">
                <Button size="sm" variant="secondary" icon={<RotateCw size={16} />} loading={busy} disabled={!client.current} onClick={() => void identify()} aria-keyshortcuts="R" kbd="R">
                  Analyze my browser again
                </Button>
              </div>
            </div>

            <div className="pg-body">
              {/* 01 Identification */}
              <TabPanel idBase="pg-main" id="id" value={main}>
                <motion.div {...FADE} className="pg-id">
                  <Panel padding="none" className="pg-card" aria-label="Your unique visitor ID data">
                    <div className="pg-card-bar"><span>Your unique visitor ID data</span><span className="mono-label">{event ? event.matchKind === 'new' ? 'New visitor' : 'Returning visitor' : 'Reading…'}</span></div>
                    <div className="pg-vid">
                      <span className="mono-label">Your browser’s visitor ID</span>
                      <div className="pg-vid-row">
                        {event ? <code className="pg-vid-code" aria-live="off">{vid}</code> : <Skeleton className="pg-sk pg-sk-vid" role="status" aria-label="Reading visitor ID" />}
                        {event && <CopyAction text={event.visitorId} ariaLabel="Copy visitor ID" what="Visitor ID" />}
                      </div>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.p key={event ? `${event.matchKind}${cleared}` : 'pending'} className="pg-story" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0, transition: enter }} exit={{ opacity: 0, transition: exit }}>
                          {event && <KindIcon size={16} aria-hidden="true" />}
                          {story}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                    <div className="pg-tiles">
                      <StatGrid columns={3}>
                        <StatTile label="Last seen" value={stat(previous ? ago(previous.at) : 'Just now, first visit')} />
                        <StatTile label="Visit history" value={stat(`${idRuns.total} in this browser`)} />
                        <StatTile label="Confidence" value={stat(event?.matchKind === 'new' ? 'New visitor' : event ? <CountUp value={Math.round(event.confidence * 100)} suffix="%" trigger="change" duration={0.7} /> : null)} />
                        <StatTile label="Browser" value={stat(<span className="pg-with"><BrowserLogo name={bName} size={16} />{bName}</span>)} />
                        <StatTile label="IP address" mono value={stat(event?.ip?.address ? <Trunc full={event.ip.address} /> : 'Not stored')} />
                        <StatTile label="Operating system" value={stat(<span className="pg-with"><OsLogo name={os} size={16} />{os}</span>)} />
                        <StatTile label="Visits that kept this ID" value={stat(`${idRuns.same} of ${idRuns.total}`)} />
                        <StatTile label="First seen" value={stat(idRuns.first ? ago(idRuns.first) : '—')} />
                        <StatTile label="Browsers on this device" value={stat(<CountUp value={browsersOnDevice.length} trigger="change" duration={0.6} />)} />
                      </StatGrid>
                    </div>
                  </Panel>

                  <Panel padding="none" className={`pg-card pg-decide ${event ? lvl : ''}`} aria-label="What your backend decides">
                    <div className="pg-card-bar"><span>What your backend decides</span><span className="mono-label">Thresholds: 25 and 60</span></div>
                    <div className="pg-decide-grid">
                      <div className="pg-decide-l">
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.p key={event ? decision : 'pending'} className="pg-word" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: enter }} exit={{ opacity: 0, transition: exit }}>
                            <DecisionIcon size={24} strokeWidth={1.8} aria-hidden="true" />
                            {event ? decision : 'Checking'}
                          </motion.p>
                        </AnimatePresence>
                        <Meter value={event ? scoreShown : 0} label="Suspect score" />
                        <p className="pg-cover">
                          {event ? <><b>{counts.on ?? 0}</b> fired · <b>{counts.off ?? 0}</b> clear · <b>{counts.na ?? 0}</b> not checked on this server</> : 'Checking 26 signals…'}
                        </p>
                      </div>
                      <div className="pg-decide-r">
                        <h2 className="mono-label">Why this score</h2>
                        <ul className="pg-reasons">
                          <AnimatePresence initial={false} mode="popLayout">
                            {(event?.reasons ?? []).map((r, i) => (
                              <motion.li key={`${event?.eventId}-${r.signal}`} layout="position" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0, transition: { ...enter, delay: 0.15 + i * 0.04 } }} exit={{ opacity: 0, transition: exit }}>
                                <TriangleAlert size={16} aria-hidden="true" /><span>{NAMES[r.signal] ?? r.signal}</span><code>+{r.contribution}</code>
                              </motion.li>
                            ))}
                            {event && event.reasons.length === 0 && (
                              <motion.li key={`${event.eventId}-clean`} className="is-clean" layout="position" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0, transition: { ...enter, delay: 0.15 } }} exit={{ opacity: 0, transition: exit }}>
                                <Check size={16} strokeWidth={2.4} aria-hidden="true" /><span>No signal fired</span><code>0</code>
                              </motion.li>
                            )}
                            {!event && [0, 1].map((k) => <li key={`w${k}`} className="is-wait" aria-hidden={k ? true : undefined}>{k === 0 ? <span>Waiting for the first identification</span> : <Skeleton className="pg-sk pg-sk-line" />}</li>)}
                          </AnimatePresence>
                        </ul>
                        <button type="button" className="arrow-link pg-linkbtn" onClick={() => setMain('signals')}>See all {totalSignals || 26} signals</button>
                      </div>
                    </div>
                  </Panel>
                </motion.div>
              </TabPanel>

              {/* 02 Signals */}
              <TabPanel idBase="pg-main" id="signals" value={main}>
                <motion.div {...FADE} className="pg-sig">
                  <div className="pg-sig-head">
                    <p>
                      {event ? (fired ? `${fired} signal${fired === 1 ? '' : 's'} fired on this visit.` : 'Every signal came back clear for this visit.') : 'Waiting for the first identification.'}{' '}
                      Signals marked “not checked” need data this test server doesn’t have, such as GeoIP.
                    </p>
                    {event && (
                      <ToggleGroup type="single" value={filter} onValueChange={(v) => { if (v) setFilter(v as Filter); }} aria-label="Filter signals" className="pg-tg">
                        {FILTERS.map((f) => (
                          <ToggleGroupItem key={f.value} value={f.value} className="pg-tg-item">
                            {filter === f.value && <motion.span layoutId="pg-tg-pill" className="pg-tg-pill" transition={reduced() ? { duration: 0 } : { duration: 0.22, ease: EASE_OUT }} />}
                            <span className="pg-tg-label">{f.label}<span className="pg-n">{f.n}</span></span>
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    )}
                  </div>
                  {!event ? (
                    <div className="pg-skel" role="status" aria-label="Reading signals">{[0, 1, 2, 3, 4, 5].map((k) => <Skeleton key={k} className="pg-sk pg-sk-row" />)}</div>
                  ) : (
                    <motion.div key={filter} {...FADE} className="dashed-grid cols-2 is-padded pg-groups">
                      {groupsView.map((g) => (
                        <section key={g.title} className="pg-group" aria-label={g.title}>
                          <h3><span>{g.title}</span><small className="mono-label">{g.on ? `${g.on} fired` : 'all clear'}</small></h3>
                          <ul>
                            {g.shown.map((x) => (
                              <li key={x.id}>
                                <Collapsible className={`pg-sigrow is-${x.state}`} defaultOpen={x.state === 'on'} disabled={!x.text}>
                                  <CollapsibleTrigger className="pg-sig-trig">
                                    <span className="pg-sig-ic" aria-hidden="true">{x.state === 'on' ? <TriangleAlert size={16} /> : x.state === 'off' ? <Check size={16} /> : <CircleDashed size={16} />}</span>
                                    <b className="pg-sig-name">{NAMES[x.id] ?? x.id}</b>
                                    <span className={cn('pg-state', x.state === 'na' && 'is-na')}>{x.state === 'on' ? (pts[x.id] ? `Fired +${pts[x.id]}` : 'Fired') : x.state === 'off' ? 'Clear' : 'Not checked'}</span>
                                    <ChevronDown size={16} className="pg-chev" aria-hidden="true" />
                                  </CollapsibleTrigger>
                                  {x.text && <CollapsibleContent className="pg-sig-body"><p>{x.text}</p></CollapsibleContent>}
                                </Collapsible>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ))}
                    </motion.div>
                  )}
                  {event && groupsView.length === 0 && <p className="pg-empty-line">No signals in this view.</p>}
                  <Link className="arrow-link" href="/docs/signals">How each signal works, and its false positives</Link>
                </motion.div>
              </TabPanel>

              {/* 03 Device graph */}
              <TabPanel idBase="pg-main" id="graph" value={main}>
                <motion.div {...FADE} className="pg-graph">
                  <div className="pg-sig-head">
                    <p>{browsersOnDevice.length} browser{browsersOnDevice.length === 1 ? '' : 's'} and {accountsOnDevice.length} account{accountsOnDevice.length === 1 ? '' : 's'} linked to this device.</p>
                  </div>
                  <div className="dashed-grid cols-3 is-padded pg-gcols">
                    <section aria-label="Browsers on this device">
                      <h3 className="mono-label">Browsers</h3>
                      <ul className="pg-nodes">
                        {browsersOnDevice.map((b) => (
                          <li key={b.id} className={b.you ? 'is-you' : undefined}>
                            <BrowserLogo name={b.label} size={16} /><Trunc full={b.you ? `${b.label} (you)` : b.label} />{!b.you && <code title="Match confidence">{b.conf.toFixed(2)}</code>}
                          </li>
                        ))}
                        {!event && <li className="is-wait" aria-hidden="true"><Skeleton className="pg-sk pg-sk-line" /></li>}
                      </ul>
                    </section>
                    <section aria-label="This device" className="pg-gdev">
                      <h3 className="mono-label">This device</h3>
                      <IconTile icon={<Laptop />} size="lg" />
                      {event ? <Trunc full={event.deviceId} className="pg-did" /> : <Skeleton className="pg-sk pg-sk-line" aria-hidden="true" />}
                      {event && <CopyAction label="Copy device ID" ariaLabel="Copy device ID" text={event.deviceId} what="Device ID" />}
                    </section>
                    <section aria-label="Accounts on this device">
                      <h3 className="mono-label">Accounts</h3>
                      <ul className="pg-nodes">
                        {accountsOnDevice.map((a) => (
                          <li key={a.id}><UserRound size={16} aria-hidden="true" /><Trunc full={a.label} /></li>
                        ))}
                        {event && accountsOnDevice.length === 0 && <li className="is-wait">No accounts yet</li>}
                      </ul>
                    </section>
                  </div>
                  {event && !hasGraph && (
                    <div className="pg-empty">
                      <GraphSketch />
                      <p className="pg-hint">
                        Only this browser has been seen on this device so far. Open this page in another browser on this computer, or act as an account with the field above, and Trace links them here.
                      </p>
                    </div>
                  )}
                </motion.div>
              </TabPanel>

              {/* 04 Raw responses */}
              <TabPanel idBase="pg-main" id="raw" value={main}>
                <motion.div {...FADE} className="pg-raw">
                  <div className="pg-raw-bar">
                    <Tabs variant="boxed" idBase="pg-raw" label="Response source" value={rawTab} onChange={setRawTab} items={[{ id: 'event', label: 'Verified event' }, { id: 'browser', label: 'Browser result' }, { id: 'graph', label: 'Device graph' }]} />
                    {rawValue ? <CopyAction label="Copy" ariaLabel="Copy JSON" text={JSON.stringify(rawValue, null, 2)} what="JSON response" /> : null}
                  </div>
                  {(['event', 'browser', 'graph'] as const).map((k) => (
                    <TabPanel key={k} idBase="pg-raw" id={k} value={rawTab}>
                      {rawValue ? <JsonView value={rawValue} lineNumbers maxHeight={440} label={`${k} response JSON`} /> : <p className="pg-empty-line">Not available for this run.</p>}
                    </TabPanel>
                  ))}
                  <p className="pg-hint">What your code receives. The verified event is the only one a decision should be based on.</p>
                </motion.div>
              </TabPanel>
            </div>

            <div className="pg-foot">
              <span className="pg-foot-l">{event ? <Trunc full={event.visitorId}>{`[visitor id: ${event.visitorId}]`}</Trunc> : ''}</span>
              <span className="pg-foot-c">This is a real demo on a test server. Production data will look different.</span>
              <span className="pg-foot-r">{event ? `${bName} on ${os}` : ''}</span>
            </div>
          </WindowCard>
          {scene === 'error' && problem && (
            <Alert variant="destructive" className="pg-alert">
              <TriangleAlert size={16} aria-hidden="true" />
              <div className="pg-alert-t">
                <AlertTitle>Identification failed</AlertTitle>
                <AlertDescription><code>{problem.code}</code> {problem.message}</AlertDescription>
              </div>
              <Button size="sm" variant="secondary" icon={<RotateCw size={16} />} onClick={retry}>Retry</Button>
            </Alert>
          )}
        </div>
      </section>

      {/* Steps */}
      <section className="frame-section is-white pg-steps" aria-labelledby="pg-steps-h">
        <div className="frame">
          <h2 id="pg-steps-h" className="sr-only">What just happened</h2>
          <ol className="dashed-grid cols-3 pg-step-grid">
            {STEPS.map((s, i) => {
              const st = steps[i]!;
              return (
                <li key={s.n} className={`pg-step is-${st.state}`}>
                  <p className="mono-label pg-step-l">Step {s.n} <span>{s.name}</span></p>
                  <div className="pg-step-meta">
                    <StepMark s={st.state} />
                    <span className="mono-label is-lower">{STEP_WORD[st.state]}</span>
                    <code className="pg-ms">{st.ms !== null ? <><CountUp value={Math.round(st.ms)} trigger="change" duration={0.5} /> ms</> : '–'}</code>
                  </div>
                  <p>{s.body}</p>
                  <p className="mono-label is-lower pg-where">{s.where}</p>
                  <Link className="arrow-link" href={s.href}>{s.link}</Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Challenges */}
      <section className="frame-section is-tint pg-quest" aria-labelledby="quest-h">
        <div className="frame frame-pad">
          <header className="pg-sec-head">
            <p className="mono-label is-lower pg-eyebrow"><Zap size={16} aria-hidden="true" />Challenges</p>
            <h2 id="quest-h" className="h-section">Try to <span className="accent">fool it</span></h2>
            <p className="lede">Each of these is how fraudsters try to look like a new person. Do one, press <Kbd>R</Kbd>, and watch the ID hold.</p>
            <div className="pg-prog">
              <span className="pg-prog-n"><CountUp value={done.size} trigger="change" duration={0.6} /> of {TASKS.length}</span>
              <Progress className="pg-prog-bar" value={(done.size / TASKS.length) * 100} aria-label="Challenges done" aria-valuetext={`${done.size} of ${TASKS.length} challenges done`} />
            </div>
            </header>
        </div>
        <div className="frame">
          <ol className="dashed-grid cols-4 pg-q-grid">
            {TASKS.map((t) => {
              const Icon = TASK_ICON[t.id] ?? Zap;
              const ok = done.has(t.id);
              const isNext = t.id === firstOpen?.id;
              const isFresh = fresh.has(t.id);
              return (
                <li key={t.id} className={`pg-q${ok ? ' is-done' : ''}${isNext ? ' is-next' : ''}${isFresh ? ' is-fresh' : ''}`}>
                  <div className="pg-q-top">
                    <IconTile icon={<Icon />} tone={ok ? 'accent' : 'ink'} />
                    <Badge tone={ok ? 'low' : isNext ? 'accent' : 'neutral'} mono size="sm" icon={ok ? <AnimatedCheck /> : undefined}>
                      {ok ? (isFresh ? 'Just passed' : 'Passed') : isNext ? 'Next' : 'Not yet'}
                    </Badge>
                  </div>
                  <h3>{t.t}</h3>
                  <p>{t.h}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* History */}
      <section className="frame-section is-white pg-hist" aria-labelledby="hist-h">
        <div className="frame frame-pad">
          <Panel padding="none" className="pg-card">
            <div className="pg-card-bar"><h2 id="hist-h">This browser over time</h2><span className="mono-label">{history.length} visit{history.length === 1 ? '' : 's'} kept in this browser</span></div>
            {history.length > 0 ? (
              <div className="pg-hist-body">
                <div className="pg-strip" aria-hidden="true">
                  <AnimatePresence initial={false}>
                    {[...history].reverse().map((h) => {
                      const other = Boolean(event && h.visitorId !== event.visitorId);
                      return <motion.i key={h.eventId} layout="position" className={h.matchKind} title={`${h.note} · ${ago(h.at)}`} initial={{ opacity: 0, scaleY: 0.2 }} animate={{ opacity: other ? 0.4 : 1, scaleY: 1 }} transition={{ duration: 0.25, ease: EASE_OUT }} />;
                    })}
                  </AnimatePresence>
                </div>
                <div className="pg-legend"><span><i className="token" />Cookie</span><span><i className="similar" />Device traits</span><span><i className="new" />New ID</span></div>
                <ol className="pg-runs">
                  {history.slice(0, 5).map((h) => (
                    <li key={h.eventId}>
                      <span className="pg-kind">{h.matchKind === 'token' ? 'Cookie' : h.matchKind === 'similar' ? 'Device traits' : 'New ID'}</span>
                      <Trunc full={h.note} className="pg-note" />
                      <small>{ago(h.at)}</small>
                      <Badge tone={level(h.score)} mono size="sm">{h.score} · {LEVEL_WORD[level(h.score)]}</Badge>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <p className="pg-hint pg-pad">Each visit lands here.</p>
            )}
          </Panel>
        </div>
      </section>

      <p className="sr-only" aria-live="polite">{liveMsg}</p>
    </div>
  );
}

/** Original line drawing: one device with two empty slots for other browsers and accounts. */
function GraphSketch() {
  return (
    <svg className="pg-sketch" viewBox="0 0 176 88" width="176" height="88" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="64" y="26" width="48" height="32" rx="4" className="pg-sk-solid" />
      <path d="M58 62h60" className="pg-sk-solid" />
      <circle cx="20" cy="22" r="10" strokeDasharray="3 4" />
      <circle cx="156" cy="66" r="10" strokeDasharray="3 4" />
      <path d="M30 24l32 10M146 64l-32-10" strokeDasharray="3 4" />
      <circle cx="88" cy="42" r="2" fill="currentColor" stroke="none" className="pg-sk-solid" />
    </svg>
  );
}

function AnimatedCheck() {
  return (
    <motion.svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2, ease: EASE_OUT }}>
      <motion.path d="M3 8.5l3.2 3.2L13 4.8" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.1 }} />
    </motion.svg>
  );
}
