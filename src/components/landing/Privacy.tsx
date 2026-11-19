import { Check, ShieldCheck, X } from 'lucide-react';
import Link from 'next/link';
import { WindowCard } from '@/components/ui';
import { FeatureSection } from './FeatureSection';

const READS = ['Screen and GPU', 'Fonts and audio', 'Time zone and languages', 'Pointer rhythm, never text'];
const NEVER = ['Permission prompts', 'Location', 'Files', 'Camera and microphone'];

/** The privacy boundary as two plain lists in a window. */
export function Privacy() {
  return (
    <FeatureSection
      id="priv-title"
      eyebrow="Privacy"
      icon={<ShieldCheck />}
      title={<>What it reads. What it <span className="accent">never</span> touches.</>}
      text="Collectors do not prompt for permissions, make network requests or read devices, files or location. High-entropy readings are hashed in the browser, and data and IPs stay on your servers."
      link={{ href: '/docs/privacy', label: 'Privacy details' }}
    >
      <WindowCard className="pv" title="collectors.md">
        <div className="pv-cols">
          <div className="pv-col">
            <p className="mono-label">Reads</p>
            <ul className="yes">
              {READS.map((x) => <li key={x}><Check size={14} strokeWidth={2.2} aria-hidden="true" />{x}</li>)}
            </ul>
          </div>
          <div className="pv-col">
            <p className="mono-label">Never touches</p>
            <ul className="no">
              {NEVER.map((x) => <li key={x}><X size={14} strokeWidth={2.2} aria-hidden="true" />{x}</li>)}
            </ul>
          </div>
        </div>
        <p className="pv-foot mono-label">Hashed in the browser: canvas <code>a91f3c…</code> audio <code>07be2d…</code> fonts <code>c4e810…</code>. <Link href="/docs/privacy">Details</Link></p>
      </WindowCard>
    </FeatureSection>
  );
}
