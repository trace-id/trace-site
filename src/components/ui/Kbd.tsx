import type { HTMLAttributes } from 'react';
import { cx } from './motion';

export interface KbdProps extends HTMLAttributes<HTMLElement> {
  /** "night" (or "dark") for use on dark code panels. */
  on?: 'paper' | 'night' | 'light' | 'dark';
}

/** Keyboard key cap. */
export function Kbd({ on = 'paper', className, ...rest }: KbdProps) {
  return <kbd className={cx('ui-kbd', (on === 'night' || on === 'dark') && 'ui-kbd-night', className)} {...rest} />;
}
