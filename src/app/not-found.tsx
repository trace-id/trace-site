import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false, follow: true } };

export default function NotFound() {
  return (
    <main className="frame" style={{ padding: '96px var(--tr-pad)', minHeight: '60vh' }}>
      <p className="mono-label">404</p>
      <h1 className="h-hero" style={{ margin: '12px 0 16px' }}>This page does not <span className="accent">match</span>.</h1>
      <p className="lede" style={{ maxWidth: '52ch' }}>
        The address may be mistyped or the page may have moved. Try one of these instead.
      </p>
      <p style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 28 }}>
        <Link className="arrow-link" href="/">Home</Link>
        <Link className="arrow-link" href="/docs">Documentation</Link>
        <Link className="arrow-link" href="/docs/quickstart">Quickstart</Link>
        <Link className="arrow-link" href="/use-cases">Use cases</Link>
        <Link className="arrow-link" href="/demo">Live demo</Link>
      </p>
    </main>
  );
}
