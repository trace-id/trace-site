'use client';

import { motion, type Variants } from 'motion/react';
import { Children, type CSSProperties, type ReactNode, useState } from 'react';
import { DUR, EASE_OUT, cx } from './motion';

type Tag = 'div' | 'section' | 'article' | 'ul' | 'ol' | 'header' | 'footer' | 'figure' | 'p' | 'span' | 'li';

export interface RevealProps {
  children: ReactNode;
  as?: Tag;
  /** Seconds between children. When > 0 each direct child is wrapped and revealed in sequence. Default 0 (reveals as one block). */
  stagger?: number;
  /** Seconds before the reveal starts. */
  delay?: number;
  /** Rise distance in px. Default 8. */
  y?: number;
  /** Replay when scrolled back into view. Default false: once. */
  repeat?: boolean;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

/** Scroll reveal: rises 8px over 180ms and fades in once. Reduced motion keeps the fade and drops the movement. */
export function Reveal({ children, as = 'div', stagger = 0, delay = 0, y = 8, repeat = false, className, style, id }: RevealProps) {
  const M = motion[as] as typeof motion.div;
  const viewport = { once: !repeat, margin: '0px 0px -64px 0px' } as const;
  const item: Variants = {
    hidden: { opacity: 0, y },
    show: { opacity: 1, y: 0, transition: { duration: DUR.reveal, ease: EASE_OUT } },
  };
  if (stagger > 0) {
    const Item = (as === 'ul' || as === 'ol' ? motion.li : motion.div) as typeof motion.div;
    return (
      <M
        id={id}
        className={cx(className)}
        style={style}
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      >
        {Children.map(children, (c) => (c == null || c === false ? null : <Item variants={item}>{c}</Item>))}
      </M>
    );
  }
  return (
    <M
      id={id}
      className={cx(className)}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport}
      transition={{ duration: DUR.reveal, ease: EASE_OUT, delay }}
    >
      {children}
    </M>
  );
}

export interface TraceLineProps {
  /** SVG path data, in the coordinate space of `viewBox`. */
  d: string;
  viewBox: string;
  /** CSS colour; default the cobalt token. */
  color?: string;
  strokeWidth?: number;
  /** Seconds before drawing. */
  delay?: number;
  /** Seconds to draw. Default 0.9. */
  duration?: number;
  /** Draw immediately instead of waiting for the viewport. */
  immediate?: boolean;
  /** Keep stroke width constant when the SVG is scaled (default true). */
  nonScaling?: boolean;
  width?: number | string;
  height?: number | string;
  preserveAspectRatio?: string;
  className?: string;
}

/** The signature trace line: a single hairline path that draws itself (pathLength) when it enters the viewport. Decorative. */
export function TraceLine({
  d,
  viewBox,
  color = 'var(--tr-cobalt)',
  strokeWidth = 1.5,
  delay = 0,
  duration = 0.9,
  immediate,
  nonScaling = true,
  width = '100%',
  height,
  preserveAspectRatio = 'none',
  className,
}: TraceLineProps) {
  const target = { pathLength: 1, opacity: 1 };
  // pathLength animates through stroke dashes, which a non-scaling stroke in a stretched SVG measures in screen
  // units: on wide screens the dash stops short and leaves gaps. Once drawn, swap in a plain path.
  const [drawn, setDrawn] = useState(false);
  return (
    <svg className={cx('ui-trace', className)} viewBox={viewBox} width={width} height={height} preserveAspectRatio={preserveAspectRatio} fill="none" aria-hidden="true" focusable="false">
      {drawn ? (
        <path d={d} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" vectorEffect={nonScaling ? 'non-scaling-stroke' : undefined} />
      ) : (
      <motion.path
        onAnimationComplete={() => setDrawn(true)}
        d={d}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect={nonScaling ? 'non-scaling-stroke' : undefined}
        initial={{ pathLength: 0, opacity: 0 }}
        {...(immediate ? { animate: target } : { whileInView: target, viewport: { once: true, margin: '0px 0px -40px 0px' } })}
        transition={{ pathLength: { duration, delay, ease: EASE_OUT }, opacity: { duration: 0.01, delay } }}
      />
      )}
    </svg>
  );
}
