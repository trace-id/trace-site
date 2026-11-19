import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cx } from './motion';

export type Tone = 'neutral' | 'accent' | 'cobalt' | 'low' | 'med' | 'high' | 'signal';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  /** Leading dot. Pair risk tones with a word: colour alone never carries meaning. */
  dot?: boolean;
  size?: 'sm' | 'md';
  mono?: boolean;
  icon?: ReactNode;
}

/** Small mono chip (radius 6). Risk tones (low, med, high) are for risk only; accent (alias cobalt) and signal are the accent tints. */
export function Badge({ tone = 'neutral', dot, size = 'md', mono, icon, className, children, ...rest }: BadgeProps) {
  return (
    <span className={cx('ui-badge', `ui-tone-${tone}`, size === 'sm' && 'ui-badge-sm', mono && 'ui-badge-mono', className)} {...rest}>
      {dot && <i className="ui-badge-dot" aria-hidden="true" />}
      {icon && <span className="ui-badge-icon" aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  tone?: Tone;
  selected?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

/** Pressable filter chip (toggle button with aria-pressed). */
export function Chip({ tone = 'neutral', selected = false, icon, className, children, type = 'button', ...rest }: ChipProps) {
  return (
    <button type={type} aria-pressed={selected} className={cx('ui-badge', 'ui-chip', `ui-tone-${tone}`, selected && 'is-selected', className)} {...rest}>
      {icon && <span className="ui-badge-icon" aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}
