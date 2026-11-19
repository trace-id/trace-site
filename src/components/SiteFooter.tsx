import Link from 'next/link';
import type { CSSProperties } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Lockup } from './Logo';
import { CopyButton } from './ui';
import { ToastCopy } from './landing/controls';
import './site-footer.css';

/** Light footer: dashed top rule, brand column + four link columns with mono labels, small print. */
export function SiteFooter({ githubUrl }: { githubUrl: string }) {
  return (
    <footer className="site-footer">
      <div className="frame">
        <div className="dashed-grid sf-grid" style={{ '--cols': 5 } as CSSProperties}>
          <div className="sf-about">
            <Link href="/" className="brand" aria-label="Trace home">
              <Lockup />
            </Link>
            <p>Open-source device identification and fraud signals, on your own servers.</p>
            <div className="sf-run">
              <span className="mono-label">Start in one command</span>
              <div className="sf-cmd">
                <code>
                  <span aria-hidden="true">$ </span>./setup.sh
                </code>
                <ToastCopy><CopyButton text="./setup.sh" ariaLabel="Copy ./setup.sh" size="sm" /></ToastCopy>
              </div>
            </div>
          </div>
          <nav className="sf-col" aria-labelledby="sf-start">
            <h2 id="sf-start" className="mono-label">Start</h2>
            <Link href="/demo">Live demo</Link>
            <Link href="/use-cases">Use cases</Link>
            <Link href="/docs/quickstart">Quickstart</Link>
            <Link href="/docs/integration">SDKs</Link>
          </nav>
          <nav className="sf-col" aria-labelledby="sf-ref">
            <h2 id="sf-ref" className="mono-label">Reference</h2>
            <Link href="/docs/signals">Signals</Link>
            <Link href="/docs/api">REST API</Link>
            <Link href="/docs/agents">MCP server</Link>
            <a href="/llms.txt">llms.txt</a>
          </nav>
          <nav className="sf-col" aria-labelledby="sf-trust">
            <h2 id="sf-trust" className="mono-label">Trust</h2>
            <Link href="/docs/accuracy">Accuracy method</Link>
            <Link href="/docs/privacy">What Trace reads</Link>
            <Link href="/docs/security-checklist">Security checklist</Link>
            <Link href="/security">Report a vulnerability</Link>
            <Link href="/license">Licensing</Link>
          </nav>
          <nav className="sf-col" aria-labelledby="sf-project">
            <h2 id="sf-project" className="mono-label">Project</h2>
            <a href={githubUrl} target="_blank" rel="noopener noreferrer">
              GitHub <ArrowUpRight size={13} aria-hidden="true" />
            </a>
            <Link href="/docs/self-hosting">Self-hosting</Link>
            <Link href="/docs/configuration">Configuration</Link>
          </nav>
        </div>
        <div className="sf-print">
          <span className="sf-status"><i aria-hidden="true" />Pre-release · built in the open</span>
          <span>Server AGPL-3.0 · SDKs MIT</span>
          <span>Your data stays on your servers.</span>
          <nav className="sf-legal" aria-label="Legal">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/cookies">Cookies</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
