'use client';

import { useEffect, useState } from 'react';
import { explain, NAMES, type SignalResult } from '@/components/playground/explain';
import { demoConfig, loadSdk } from './load-sdk';
import { browserName, osName } from './ua';

export interface Check {
  id: string;
  name: string;
  state: 'on' | 'off' | 'na';
  text: string;
}

export interface LiveVisitor {
  state: 'loading' | 'live' | 'sample';
  visitorId: string;
  deviceId: string;
  matchKind: 'new' | 'token' | 'similar' | null;
  confidence: number;
  suspectScore: number;
  ms: number;
  browser: string;
  os: string;
  host: string;
  /** Four signal results for the hero: anything detected first, then the usual suspects. */
  checks: Check[];
  /** Every signal result, by id. */
  all: Record<string, Check>;
}

const SAMPLE: Omit<LiveVisitor, 'state'> = {
  visitorId: 'v8f3k2m9q7x1d4w6zQa2',
  deviceId: 'd2n7p4r8t1k6m3q9sXb5',
  matchKind: 'similar',
  confidence: 0.98,
  suspectScore: 12,
  ms: 312,
  browser: 'Chrome 131',
  os: 'macOS',
  host: 'id.example.com',
  all: {},
  checks: [
    { id: 'incognito', name: 'Private window', state: 'on', text: 'Detected by storageQuota' },
    { id: 'bot', name: 'Bot / automation', state: 'off', text: 'No automation traces' },
    { id: 'vpn', name: 'VPN / proxy', state: 'off', text: 'IP in DE fits UTC +1' },
    { id: 'crossBrowser', name: 'Same device, other browser', state: 'on', text: '1 other browser (firefox)' },
  ],
};

const PREFERRED = ['bot', 'vpn', 'antiDetect', 'crossBrowser', 'incognito', 'tampering', 'datacenterIp'];

function pickChecks(signals: Record<string, SignalResult> | undefined): Check[] {
  if (!signals) return [];
  const ids = Object.keys(signals);
  const detected = ids.filter((id) => signals[id]!.detected);
  const rest = PREFERRED.filter((id) => signals[id] && !signals[id]!.detected && signals[id]!.details?.available !== false);
  return [...new Set([...detected, ...rest])].slice(0, 4).map((id) => ({ id, name: NAMES[id] ?? id, ...explain(id, signals[id]!) }));
}

/** Identifies the person reading the page with the same SDK customers use, then reads the verified event through the
 *  site's backend (the secret key stays there). Falls back to labelled sample data. */
export function useLiveVisitor(): LiveVisitor {
  const [v, setV] = useState<LiveVisitor>({ ...SAMPLE, state: 'loading' });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await demoConfig();
        if ('error' in cfg) throw new Error(cfg.error);
        const sdk = await loadSdk(cfg.endpoint);
        const client = sdk.createClient({ apiKey: cfg.apiKey, endpoint: cfg.endpoint, timeoutMs: 8000, firstPartyCookie: true });
        const t0 = performance.now();
        const r = await client.get({ tags: { page: 'landing' } });
        const ms = Math.round(performance.now() - t0);
        let ev: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
          const res = await fetch('/api/demo/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId: r.eventId }) });
          if (res.ok) ev = await res.json();
        } catch {}
        if (cancelled) return;
        setV({
          state: 'live',
          visitorId: r.visitorId,
          deviceId: r.deviceId ?? r.visitorId,
          matchKind: ev?.matchKind ?? null,
          confidence: ev?.confidence ?? r.confidence ?? 1,
          suspectScore: ev?.suspectScore ?? r.suspectScore ?? 0,
          ms,
          browser: browserName(navigator.userAgent),
          os: osName(navigator.userAgent),
          host: new URL(cfg.endpoint).host,
          checks: pickChecks(ev?.signals),
          all: Object.fromEntries(Object.entries((ev?.signals ?? {}) as Record<string, SignalResult>).map(([id, r]) => [id, { id, name: NAMES[id] ?? id, ...explain(id, r) }])),
        });
      } catch {
        if (!cancelled) setV({ ...SAMPLE, state: 'sample' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return v;
}

export const shortId = (id: string, n = 8) => (id.length > n + 4 ? `${id.slice(0, n)}…` : id);
