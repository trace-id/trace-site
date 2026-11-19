'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { DUR, EASE_IN, EASE_OUT, cx } from './motion';

export interface CopyButtonProps {
  text: string;
  /** Visible label. Omit for an icon-only button (aria-label is then used). */
  label?: string;
  copiedLabel?: string;
  /** Accessible name when icon-only. */
  ariaLabel?: string;
  size?: 'sm' | 'md';
  on?: 'paper' | 'night' | 'light' | 'dark';
  className?: string;
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const t = document.createElement('textarea');
      t.value = text;
      t.setAttribute('readonly', '');
      t.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(t);
      t.select();
      const ok = document.execCommand('copy');
      t.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** Copies text; the icon swaps to an animated check for 1.8s. Announces via aria-live. */
export function CopyButton({ text, label, copiedLabel = 'Copied', ariaLabel = 'Copy to clipboard', size = 'md', on = 'paper', className }: CopyButtonProps) {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const onClick = async () => {
    if (!(await copy(text))) return;
    setDone(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(false), 1800);
  };
  return (
    <button type="button" onClick={onClick} aria-label={label ? undefined : done ? copiedLabel : ariaLabel} className={cx('ui-copy', `ui-copy-${size}`, (on === 'night' || on === 'dark') && 'ui-copy-night', label && 'has-label', done && 'is-done', className)}>
      <span className="ui-copy-icon" aria-hidden="true">
        <AnimatePresence mode="popLayout" initial={false}>
          {done ? (
            <motion.svg key="ok" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, transition: { duration: DUR.micro, ease: EASE_IN } }} transition={{ duration: DUR.component, ease: EASE_OUT }}>
              <motion.path d="M3 8.5l3.2 3.2L13 4.8" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, ease: EASE_OUT }} />
            </motion.svg>
          ) : (
            <motion.span key="copy" style={{ display: 'inline-flex' }} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, transition: { duration: DUR.micro, ease: EASE_IN } }} transition={{ duration: DUR.component, ease: EASE_OUT }}>
              <Copy size={14} strokeWidth={1.75} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      {label && <span className="ui-copy-label">{done ? copiedLabel : label}</span>}
      <span className="sr-only" aria-live="polite" role="status">
        {done ? copiedLabel : ''}
      </span>
    </button>
  );
}
