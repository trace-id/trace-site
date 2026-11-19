import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cx } from './motion';

export interface EyebrowProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /** @deprecated Numeric indexes are no longer shown. Accepted so older pages still compile. */
  index?: string;
  on?: 'paper' | 'night';
  /** A tiny line icon (lucide, 14px) before the label. */
  icon?: ReactNode;
  /** lower (default): sentence case. upper: uppercase with tracking, for tab and layer labels. */
  variant?: 'lower' | 'upper';
  children: ReactNode;
}

/** Fragment Mono micro-label with an optional tiny line icon. */
export function Eyebrow({ as: Tag = 'p', index: _index, on = 'paper', icon, variant = 'lower', className, children, ...rest }: EyebrowProps) {
  return (
    <Tag className={cx('ui-eyebrow', 'mono-label', variant === 'lower' && 'is-lower', on === 'night' && 'ui-eyebrow-night', className)} {...rest}>
      {icon && (
        <span className="ui-eyebrow-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </Tag>
  );
}
