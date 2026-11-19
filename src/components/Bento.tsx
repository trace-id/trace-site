import { Bot, Boxes, Fingerprint, Gauge, Globe, type LucideIcon, ScanFace, Server, Users, Webhook } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Eyebrow, IconTile, Reveal } from '@/components/ui';
import { Brand } from './brand';
import './bento.css';

function Cell({ href, title, text, icon: Icon, children }: { href: string; title: string; text: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <Link href={href} className="bx">
      <IconTile icon={<Icon />} />
      <h3>{title}</h3>
      <p>{text}</p>
      <div className="bx-mini" aria-hidden="true">{children}</div>
    </Link>
  );
}

/** Everything Trace does, one compact card each, in a dashed grid, with a tiny picture of the real output. Example values throughout. */
export function Bento() {
  return (
    <section className="frame-section" aria-labelledby="bento-title">
      <div className="frame">
        <Reveal className="bx-head">
          <Eyebrow icon={<Boxes />}>The whole stack</Eyebrow>
          <h2 id="bento-title" className="h-section">Everything a fraud check needs, <span className="accent">in one service</span>.</h2>
          <p className="lede">Identification, network and automation signals, scores with reasons, and the plumbing to act on them. One call from the browser, one verified read on your server.</p>
        </Reveal>

        <div className="dashed-grid cols-4 bx-grid">
          <Cell href="/docs/accuracy" title="Device identification" icon={Fingerprint} text="One visitor ID through private windows, cleared storage and updates.">
            <ul className="m-rows">
              <li><span>Chrome</span><code>token</code></li>
              <li><span>Chrome, private</span><code>similar 0.97</code></li>
              <li><span>Firefox</span><code>linked 0.94</code></li>
              <li className="sum"><span>3 sessions</span><b>1 device</b></li>
            </ul>
          </Cell>
          <Cell href="/docs/signals#ip-intelligence" title="IP intelligence" icon={Globe} text="VPN exits, Tor, hosting networks and your own blocklist.">
            <ul className="m-kv">
              <li><span>country</span><code>US</code></li>
              <li><span>asn</span><code>64501</code></li>
              <li><span>datacenterIp</span><code className="t">true</code></li>
              <li><span>vpn</span><code>false</code></li>
            </ul>
          </Cell>
          <Cell href="/docs/signals" title="Bot detection" icon={Bot} text="Webdriver flags, headless browsers, robotic input and TLS mismatches.">
            <ul className="m-kv">
              <li><span>navigator.webdriver</span><code className="t">true</code></li>
              <li><span>user agent</span><code className="t">Headless</code></li>
              <li><span>pointer moves</span><code>0</code></li>
              <li><span>TLS JA4</span><code>fits Chrome</code></li>
            </ul>
          </Cell>
          <Cell href="/docs/signals" title="Scores with reasons" icon={Gauge} text="A 0 to 100 score you can read: what fired and how many points.">
            <div className="m-score">
              <div className="m-bar"><i style={{ width: '60%' }} /><i style={{ width: '15%' }} /><i style={{ width: '15%' }} /></div>
              <ul className="m-kv">
                <li><span>Bot / automation</span><code>+60</code></li>
                <li><span>Virtual machine</span><code>+15</code></li>
                <li><span>Datacenter IP</span><code>+15</code></li>
              </ul>
            </div>
          </Cell>
          <Cell href="/docs/signals#anti-detect-checks" title="Anti-detect browsers" icon={ScanFace} text="The page, a worker and an iframe disagree about the device.">
            <table className="m-table">
              <thead><tr><th /><th>page</th><th>worker</th></tr></thead>
              <tbody>
                <tr><td>platform</td><td>MacIntel</td><td className="x">Win32</td></tr>
                <tr><td>cores</td><td>8</td><td className="x">16</td></tr>
                <tr><td>utc</td><td>+1</td><td>+1</td></tr>
              </tbody>
            </table>
          </Cell>
          <Cell href="/docs/signals#accounts-and-the-device-graph" title="Device graph" icon={Users} text="Every account on a device, every device behind an account.">
            <ul className="m-rows">
              <li><span>maya.k</span><code>d_2n7p</code></li>
              <li><span>mk_promo</span><code>d_2n7p</code></li>
              <li><span>maya2</span><code>d_2n7p</code></li>
              <li className="sum warn"><span>3 accounts</span><b>limit 2</b></li>
            </ul>
          </Cell>
          <Cell href="/docs/integration#receiving-webhooks" title="Signed webhooks" icon={Webhook} text="Events pushed to your backend, signed with HMAC-SHA256 and retried.">
            <pre className="m-code"><code>
              <span className="c">POST /hooks/trace</span>{'\n'}
              <span className="k">X-Signature</span>: t=1763220011,{'\n'}
              {'  '}v1=<span className="s">5f2a…c91e</span>{'\n'}
              <span className="ok">verified</span> <span className="c">· 200 in 41 ms</span>
            </code></pre>
          </Cell>
          <Cell href="/docs/self-hosting" title="Runs on your servers" icon={Server} text="Postgres, Redis, the API and the dashboard. Data never leaves.">
            <ul className="m-rows svc">
              <li><span><Brand name="postgres" size={12} />postgres</span><code>healthy</code></li>
              <li><span><Brand name="redis" size={12} />redis</span><code>healthy</code></li>
              <li><span><Brand name="docker" size={12} />server</span><code>healthy</code></li>
              <li><span><Brand name="docker" size={12} />dashboard</span><code>healthy</code></li>
            </ul>
          </Cell>
        </div>
        <p className="bx-note mono-label">Values in these cards are examples.</p>
      </div>
    </section>
  );
}
