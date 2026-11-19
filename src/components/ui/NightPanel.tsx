import type { ElementType } from 'react';
import { WindowCard, type WindowCardProps } from './WindowCard';

export interface NightPanelProps extends Omit<WindowCardProps, 'as' | 'chrome'> {
  as?: ElementType;
  /** Show the window header strip (dots, tabs, action). Default: on when tabs, title or action are given. */
  chrome?: boolean;
  /** @deprecated No effect. Glows were removed. */
  glow?: 'tl' | 'tr' | 'bl' | 'br' | 'none';
  /** @deprecated No effect. Scan sweeps were removed. */
  scanKey?: string | number;
}

/** Now a light window card (white, 1px border, 12px radius). Pass `dark` for a real code or terminal panel, `chrome`/`tabs`/`action` for the header strip. */
export function NightPanel({ chrome, glow: _glow, scanKey: _scanKey, padding = 'md', ...rest }: NightPanelProps) {
  return <WindowCard chrome={chrome ?? Boolean(rest.tabs || rest.action || rest.title)} padding={padding} {...rest} />;
}
