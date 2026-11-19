'use client';

import { animate, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { EASE_OUT, cx } from './motion';

export interface CountUpProps {
  value: number;
  /** Start value for the first tween. Default 0. */
  from?: number;
  /** Seconds. Default 0.9. */
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** Custom formatter; overrides decimals. */
  format?: (n: number) => string;
  /** "view": first tween when scrolled into view, then on every change. "change": tween on mount and on every change. */
  trigger?: 'view' | 'change';
  className?: string;
}

/** Number tween with tabular figures. Screen readers get the final value, never the in-between ones. */
export function CountUp({ value, from = 0, duration = 0.9, decimals = 0, prefix = '', suffix = '', format, trigger = 'view', className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' });
  const reduce = useReducedMotion();
  const fmt = (n: number) => `${prefix}${format ? format(n) : n.toFixed(decimals)}${suffix}`;
  const [shown, setShown] = useState(reduce ? value : from);
  const last = useRef(from);
  const ready = trigger === 'change' || inView;

  useEffect(() => {
    if (!ready) return;
    if (reduce) {
      setShown(value);
      last.current = value;
      return;
    }
    const c = animate(last.current, value, {
      duration,
      ease: EASE_OUT,
      onUpdate: (n) => {
        last.current = n;
        setShown(n);
      },
    });
    return () => c.stop();
  }, [value, ready, duration, reduce]);

  return (
    <span ref={ref} className={cx('ui-count', className)}>
      <span aria-hidden="true">{fmt(shown)}</span>
      <span className="sr-only">{fmt(value)}</span>
    </span>
  );
}
