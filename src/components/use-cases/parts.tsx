import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Badge, IconTile } from '@/components/ui';
import type { SceneKind } from './Scenes';
import { UcIcon } from './UcIcon';

/** Sets the closing words of a headline in the accent colour: the last sentence when it is three words or fewer, otherwise the last two words. */
export function Accented({ text }: { text: string }) {
  const m = /^(.*[.?!]\s+)([^.?!]+[.?!]?)$/.exec(text);
  const tail = m?.[2] ?? text;
  if (m && tail.trim().split(/\s+/).length <= 3) {
    return (
      <>
        {m[1]}
        <span className="accent">{tail}</span>
      </>
    );
  }
  const words = text.split(' ');
  if (words.length < 3) return <span className="accent">{text}</span>;
  return (
    <>
      {words.slice(0, -2).join(' ')} <span className="accent">{words.slice(-2).join(' ')}</span>
    </>
  );
}

/** Large section title on a tinted band (the reference's "Solutions" and "Industries" bars). Optional right-hand slot for a note or controls. */
export function Band({ id, title, note, children }: { id: string; title: string; note?: string; children?: ReactNode }) {
  return (
    <div className="uc-band">
      <div className="uc-band-text">
        <h2 id={id} className="uc-band-h">{title}</h2>
        {note && <p>{note}</p>}
      </div>
      {children}
    </div>
  );
}

export interface CardCase {
  slug: string;
  title: string;
  short: string;
  icon: string;
  scene?: SceneKind;
  signals: string[];
  /** Last step of the scenario: a verdict and its note. */
  preview: { verdict: 'allow' | 'review' | 'block'; note: string };
}

export const VERDICT = { allow: 'Allow', review: 'Challenge', block: 'Block' } as const;

/** A use case as a soft card: embossed icon tile, title, one line, signal chips and the verdict the example ends on. */
export function CaseCard({ c }: { c: CardCase }) {
  return (
    <Link href={`/use-cases/${c.slug}`} className="uc-card">
      <IconTile icon={<UcIcon name={c.icon} />} size="lg" />
      <span className="uc-card-body">
        <span className="uc-card-head">
          <b className="uc-card-title">{c.title}</b>
          <ArrowRight className="uc-arrow" size={15} aria-hidden="true" />
        </span>
        <span className="uc-card-text">{c.short}</span>
        <span className="uc-card-foot">
          <span className="uc-card-chips">
            {c.signals.slice(0, 2).map((s) => <Badge key={s} mono size="sm">{s}</Badge>)}
          </span>
          <span className="uc-v" data-v={c.preview.verdict} title={`The example ends in: ${VERDICT[c.preview.verdict]}`}>
            <span className="sr-only">Example ends in </span>{VERDICT[c.preview.verdict]}
          </span>
        </span>
      </span>
    </Link>
  );
}

/** An industry as a soft card, same shape as a use case card. */
export function IndustryCard({ slug, title, text, icon, count }: { slug: string; title: string; text: string; icon: string; count: number }) {
  return (
    <Link href={`/industries/${slug}`} className="uc-card">
      <IconTile icon={<UcIcon name={icon} />} size="lg" tone="ink" />
      <span className="uc-card-body">
        <span className="uc-card-head">
          <b className="uc-card-title">{title}</b>
          <ArrowRight className="uc-arrow" size={15} aria-hidden="true" />
        </span>
        <span className="uc-card-text">{text}</span>
        <span className="uc-card-foot"><span className="mono-label">{count} use cases</span></span>
      </span>
    </Link>
  );
}
