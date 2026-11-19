import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from './motion';

export interface AnnouncementPillProps {
  /** Short chip, e.g. "New". */
  tag?: string;
  /** One line of text. */
  children: ReactNode;
  /** Muted call to action after the line, e.g. "Learn how". Omit for just the arrow. */
  cta?: string;
  /** Makes the pill a link. */
  href?: string;
  className?: string;
}

const isHttp = (h: string) => /^(https?:)?\/\//.test(h);

/** Tag chip + one line + arrow, centred above a hero headline. */
export function AnnouncementPill({ tag, children, cta, href, className }: AnnouncementPillProps) {
  const inner = (
    <>
      {tag && <span className="ui-pill-tag">{tag}</span>}
      <span className="ui-pill-text">{children}</span>
      {cta && <span className="ui-pill-cta">{cta}</span>}
      <ArrowRight size={13} strokeWidth={1.75} aria-hidden="true" className="ui-pill-arrow" />
    </>
  );
  const cls = cx('ui-pill', href && 'is-link', className);
  if (!href) return <span className={cls}>{inner}</span>;
  return isHttp(href) ? (
    <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}
