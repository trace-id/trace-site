/* eslint-disable @next/next/no-img-element */
import brave from '@browser-logos/brave/brave.svg';
import chrome from '@browser-logos/chrome/chrome.svg';
import chromium from '@browser-logos/chromium/chromium.svg';
import edge from '@browser-logos/edge/edge.svg';
import firefox from '@browser-logos/firefox/firefox.svg';
import opera from '@browser-logos/opera/opera.svg';
import safari from '@browser-logos/safari/safari.svg';
import samsung from '@browser-logos/samsung-internet/samsung-internet.svg';
import vivaldi from '@browser-logos/vivaldi/vivaldi.svg';
import { AppWindow, Bot, Monitor } from 'lucide-react';
import { siAndroid, siApple, siGooglechrome, siLinux } from 'simple-icons';

/* Browser and OS marks, used only to show which browser or OS Trace detected. Full-colour browser logos come from the
   alrra/browser-logos project; OS marks from simple-icons (CC0). Trademarks belong to their owners. */

type Img = { src: string } | string;
const src = (i: Img) => (typeof i === 'string' ? i : i.src);

function pick(name: string): { img: Img; alt: string } | null {
  const n = name.toLowerCase();
  if (n.includes('edge')) return { img: edge, alt: 'Edge' };
  if (n.includes('samsung')) return { img: samsung, alt: 'Samsung Internet' };
  if (n.includes('opera')) return { img: opera, alt: 'Opera' };
  if (n.includes('brave')) return { img: brave, alt: 'Brave' };
  if (n.includes('vivaldi')) return { img: vivaldi, alt: 'Vivaldi' };
  if (n.includes('firefox')) return { img: firefox, alt: 'Firefox' };
  if (n.includes('safari')) return { img: safari, alt: 'Safari' };
  if (n.includes('chromium')) return { img: chromium, alt: 'Chromium' };
  if (n.includes('chrome')) return { img: chrome, alt: 'Chrome' };
  return null;
}

export function BrowserLogo({ name, size = 20 }: { name: string; size?: number }) {
  if (name.toLowerCase().includes('headless')) return <Bot size={size} strokeWidth={1.75} aria-hidden="true" />;
  const p = pick(name);
  if (!p) return <AppWindow size={size} strokeWidth={1.75} aria-hidden="true" />;
  return <img src={src(p.img)} width={size} height={size} alt="" aria-hidden="true" draggable={false} style={{ display: 'block', flexShrink: 0 }} />;
}

type SimpleIcon = { path: string; hex: string };
function Simple({ icon, size, mono }: { icon: SimpleIcon; size: number; mono?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={mono ? 'currentColor' : `#${icon.hex}`}>
      <path d={icon.path} />
    </svg>
  );
}

export function OsLogo({ name, size = 16 }: { name: string; size?: number }) {
  const n = name.toLowerCase();
  if (n.includes('mac') || n.includes('ios')) return <Simple icon={siApple} size={size} mono />;
  if (n.includes('android')) return <Simple icon={siAndroid} size={size} />;
  if (n.includes('linux')) return <Simple icon={siLinux} size={size} mono />;
  if (n.includes('chromeos')) return <Simple icon={siGooglechrome} size={size} />;
  return <Monitor size={size} strokeWidth={1.75} aria-hidden="true" />;
}
