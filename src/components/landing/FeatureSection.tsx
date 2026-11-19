import type { ReactNode } from 'react';
import { Button, Eyebrow, Reveal } from '@/components/ui';

export interface FeatureSectionProps {
  id: string;
  /** Alternating background: default off-white or white. */
  white?: boolean;
  eyebrow: string;
  icon: ReactNode;
  /** Headline; wrap one or two words in <span className="accent">. */
  title: ReactNode;
  text: ReactNode;
  link?: { href: string; label: string };
  /** Extra content under the text (e.g. an accordion or a prompt card). */
  aside?: ReactNode;
  /** The product mockup. */
  children: ReactNode;
  /** Put the mockup on the left on wide screens. */
  flip?: boolean;
  /** Text row on top, mockup full width below. */
  wide?: boolean;
  className?: string;
}

/** Two dashed-divided cells: text (eyebrow, headline, lede, tertiary link) and a product mockup. Stacks on mobile. */
export function FeatureSection({ id, white, eyebrow, icon, title, text, link, aside, children, flip, wide, className }: FeatureSectionProps) {
  return (
    <section className={`frame-section${white ? ' is-white' : ''} fs-section${className ? ` ${className}` : ''}`} aria-labelledby={id}>
      <div className="frame">
        <div className={`fs${flip ? ' is-flip' : ''}${wide ? ' is-wide' : ''}`}>
          <Reveal className="fs-text">
            <Eyebrow icon={icon}>{eyebrow}</Eyebrow>
            <h2 id={id} className="h-section">{title}</h2>
            <div className="fs-copy">
              <p className="lede">{text}</p>
              {link && <Button href={link.href} variant="tertiary" size="md">{link.label}</Button>}
            </div>
            {aside}
          </Reveal>
          <Reveal className="fs-visual" delay={0.06}>{children}</Reveal>
        </div>
      </div>
    </section>
  );
}
