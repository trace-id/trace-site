import type { ReactNode } from 'react';
import { DocsShell } from '@/components/docs/DocsNav';
import './docs.css';

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="docs-root">
      <DocsShell>{children}</DocsShell>
    </div>
  );
}
