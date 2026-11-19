import type { ElementType, HTMLAttributes } from 'react';
import { cx } from './motion';

export interface PanelProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  raised?: boolean;
  /** Quiet lift on hover, for cards that are links. */
  interactive?: boolean;
}

/** Light card: surface, hairline border, rare soft shadow. */
export function Panel({ as: Tag = 'div', padding = 'md', raised, interactive, className, ...rest }: PanelProps) {
  return <Tag className={cx('ui-panel', `ui-pad-${padding}`, raised && 'is-raised', interactive && 'is-interactive', className)} {...rest} />;
}
