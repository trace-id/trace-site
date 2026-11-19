/** Motion tokens for JS. CSS twins live in globals.css (--tr-ease-out, --tr-ease-in, --tr-dur-*). */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN = [0.7, 0, 0.84, 0] as const;
export const SPRING = { type: 'spring', stiffness: 380, damping: 34, mass: 0.8 } as const;
/** Quiet and fast: 150-250ms. `reveal` is the scroll-rise duration (180ms). */
export const DUR = { micro: 0.15, component: 0.2, section: 0.25, reveal: 0.18, stagger: 0.04 } as const;
export const ENTER = { duration: DUR.component, ease: EASE_OUT } as const;
export const EXIT = { duration: DUR.micro, ease: EASE_IN } as const;

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
