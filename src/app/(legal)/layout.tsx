import type { ReactNode } from 'react';
import '@/app/docs/docs.css';
import './legal.css';

/** Single-column reading layout for policy pages; reuses the docs typography. */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return <div className="docs-root legal">{children}</div>;
}
