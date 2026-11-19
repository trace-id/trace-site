'use client';

import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

/** App-wide Motion config: respects prefers-reduced-motion (drops movement, keeps opacity fades). */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
