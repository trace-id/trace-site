'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface DemoConfig {
  apiKey: string;
  endpoint: string;
}

let pending: Promise<any> | null = null;

/**
 * Loads the browser SDK from the Trace server itself (it serves /sdk/sdk.global.js), the same way a customer site
 * without a bundler would, and returns the global it defines. Loaded once per page.
 */
export function loadSdk(endpoint: string): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('browser only'));
  const w = window as any;
  if (w.Trace?.createClient) return Promise.resolve(w.Trace);
  pending ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `${endpoint.replace(/\/+$/, '')}/sdk/sdk.global.js`;
    s.async = true;
    s.onload = () => (w.Trace?.createClient ? resolve(w.Trace) : reject(new Error('SDK did not load')));
    s.onerror = () => {
      pending = null;
      s.remove();
      reject(new Error(`Could not load the SDK from ${endpoint}`));
    };
    document.head.appendChild(s);
  });
  return pending;
}

/** The demo project's public key and the server address, from the site's own backend. */
export async function demoConfig(): Promise<DemoConfig | { error: string }> {
  try {
    const res = await fetch('/api/demo/config');
    const json = await res.json();
    if (!res.ok || !json?.apiKey) return { error: json?.error ?? 'The demo is not configured on this deployment.' };
    return json as DemoConfig;
  } catch {
    return { error: 'The demo is not configured on this deployment.' };
  }
}
