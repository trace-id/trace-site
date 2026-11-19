import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from 'react';
import { cx } from './motion';

export interface StatTileProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  as?: ElementType;
  /** Tiny uppercase mono label. */
  label: ReactNode;
  /** The value: text, number or nodes. */
  value: ReactNode;
  /** Colour of the value. */
  tone?: 'default' | 'accent' | 'low' | 'med' | 'high';
  /** Set the value in Fragment Mono (IDs, IPs, hashes). */
  mono?: boolean;
}

/** Bordered cell: tiny uppercase mono label over a value. Inside a StatGrid the borders are shared. */
export function StatTile({ as: Tag = 'div', label, value, tone = 'default', mono, className, ...rest }: StatTileProps) {
  return (
    <Tag className={cx('ui-stat', tone !== 'default' && `ui-stat-${tone}`, mono && 'ui-stat-mono', className)} {...rest}>
      <span className="ui-stat-label mono-label">{label}</span>
      <span className="ui-stat-value">{value}</span>
    </Tag>
  );
}

export interface StatGridProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /** Columns at full width. Default 3. Collapses to 2 below 560px. */
  columns?: 1 | 2 | 3 | 4;
  children: ReactNode;
}

/** Grid of StatTiles with shared 1px borders and a 8px-radius outline. */
export function StatGrid({ as: Tag = 'div', columns = 3, className, style, children, ...rest }: StatGridProps) {
  return (
    <Tag className={cx('ui-statgrid', className)} style={{ '--cols': columns, ...style } as CSSProperties} {...rest}>
      {children}
    </Tag>
  );
}
