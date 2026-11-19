import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from './motion';

export interface IconTileProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** A lucide icon (size is set for you). */
  icon: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** accent (default): cobalt glyph. ink: neutral glyph. */
  tone?: 'accent' | 'ink';
}

/** Soft embossed square holding an icon. Decorative: the icon is hidden from assistive tech. */
export function IconTile({ icon, size = 'md', tone = 'accent', className, ...rest }: IconTileProps) {
  return (
    <span className={cx('ui-icontile', `ui-icontile-${size}`, tone === 'ink' && 'ui-icontile-ink', className)} aria-hidden="true" {...rest}>
      {icon}
    </span>
  );
}
