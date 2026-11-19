import type { HTMLAttributes } from 'react';
import { cx } from './motion';

export interface StatusDotProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'cobalt' | 'low' | 'med' | 'high' | 'neutral' | 'signal';
  /** Pulsing ring. Only use for something that is actually live. */
  pulse?: boolean;
  size?: number;
  /** Screen-reader text. Omit when an adjacent label already says it (the dot is then hidden). */
  label?: string;
}

/** Small status dot with an optional pulse ring (transform and opacity only). */
export function StatusDot({ tone = 'low', pulse = true, size = 8, label, className, style, ...rest }: StatusDotProps) {
  return (
    <span
      className={cx('ui-dot', `ui-dot-${tone}`, pulse && 'is-pulse', className)}
      style={{ width: size, height: size, ...style }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...rest}
    />
  );
}
