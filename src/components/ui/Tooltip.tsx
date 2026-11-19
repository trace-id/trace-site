'use client';

import { Tooltip as TooltipPrimitive } from 'radix-ui';
import type { ReactElement, ReactNode } from 'react';
import { cx } from './motion';

export interface TooltipProps {
  content: ReactNode;
  /** A single focusable element. */
  children: ReactElement;
  side?: 'top' | 'bottom';
  /** Hover delay in ms. Default 250. Focus shows it immediately. */
  delay?: number;
  className?: string;
}

/** Tooltip on Radix: shows on hover and keyboard focus, hides on Escape and blur, portalled and collision-aware so scrolling cards never clip it. Keep content short and non-interactive. */
export function Tooltip({ content, children, side = 'top', delay = 250, className }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delay} skipDelayDuration={0}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content side={side} sideOffset={8} collisionPadding={8} className={cx('ui-tip-bubble', className)}>
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
