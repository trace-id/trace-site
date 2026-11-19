'use client';

import { useMotionValueEvent, useReducedMotion, useSpring } from 'motion/react';
import { useEffect, useState } from 'react';

/** Follows `target` with a critically damped spring (no overshoot), clamped to 0-100. Jumps when reduced motion is on. */
export function useSpringScore(target: number): number {
  const reduce = useReducedMotion();
  const sv = useSpring(target, { stiffness: 150, damping: 26, restDelta: 0.05 });
  const [v, setV] = useState(target);
  useEffect(() => {
    if (reduce) {
      sv.jump(target);
      setV(target);
    } else sv.set(target);
  }, [target, reduce, sv]);
  useMotionValueEvent(sv, 'change', (n) => setV(Math.max(0, Math.min(100, n))));
  return v;
}
