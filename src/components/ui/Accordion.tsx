'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { createContext, useCallback, useContext, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { DUR, EASE_OUT, cx } from './motion';

interface Ctx {
  isOpen: (v: string) => boolean;
  toggle: (v: string) => void;
  base: string;
  level: 2 | 3 | 4;
}
const AccordionCtx = createContext<Ctx | null>(null);

interface Common {
  /** Open items stay open independently ('multiple') or one at a time ('single', default). */
  type?: 'single' | 'multiple';
  /** list (default): ruled rows. cards: each item is a bordered white card. */
  variant?: 'list' | 'cards';
  /** Heading level of the item titles. Default 3. */
  headingLevel?: 2 | 3 | 4;
  className?: string;
  children: ReactNode;
}
export type AccordionProps = Common & {
  /** Uncontrolled initial open item(s). */
  defaultValue?: string | string[];
  /** Controlled open item(s). In single mode pass a string (or undefined). */
  value?: string | string[] | undefined;
  onValueChange?: (value: string | string[] | undefined) => void;
  /** Single mode: allow closing the open item. Default true. Set false when a mockup beside it must always show one. */
  collapsible?: boolean;
};

const toArr = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

/** Animated-height accordion. Single or multiple open, controlled or not; arrow keys, Home and End move between headers. */
export function Accordion({ type = 'single', variant = 'list', headingLevel = 3, defaultValue, value, onValueChange, collapsible = true, className, children }: AccordionProps) {
  const base = useId();
  const root = useRef<HTMLDivElement>(null);
  const [inner, setInner] = useState<string[]>(toArr(defaultValue));
  const open = value !== undefined || onValueChange ? toArr(value) : inner;
  const toggle = useCallback(
    (v: string) => {
      const on = open.includes(v);
      let next: string[];
      if (type === 'multiple') next = on ? open.filter((x) => x !== v) : [...open, v];
      else next = on ? (collapsible ? [] : open) : [v];
      setInner(next);
      onValueChange?.(type === 'multiple' ? next : next[0]);
    },
    [open, type, collapsible, onValueChange],
  );
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    const heads = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[data-acc-head]') ?? []).filter((b) => !b.disabled);
    const i = heads.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? heads.length - 1 : (i + (e.key === 'ArrowDown' ? 1 : -1) + heads.length) % heads.length;
    heads[to]?.focus();
  };
  return (
    <AccordionCtx.Provider value={{ isOpen: (v) => open.includes(v), toggle, base, level: headingLevel }}>
      <div ref={root} onKeyDown={onKey} className={cx('ui-acc', variant === 'cards' && 'ui-acc-cards', className)}>
        {children}
      </div>
    </AccordionCtx.Provider>
  );
}

export interface AccordionItemProps {
  /** Unique within the accordion. */
  value: string;
  title: ReactNode;
  /** Optional leading icon (e.g. an IconTile). */
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

export function AccordionItem({ value, title, icon, disabled, className, children }: AccordionItemProps) {
  const ctx = useContext(AccordionCtx);
  const reduce = useReducedMotion();
  if (!ctx) throw new Error('AccordionItem must be used inside <Accordion>');
  const open = ctx.isOpen(value);
  const id = `${ctx.base}-${value}`;
  const H = `h${ctx.level}` as 'h2' | 'h3' | 'h4';
  return (
    <div className={cx('ui-acc-item', open && 'is-open', className)}>
      <H className="ui-acc-h">
        <button type="button" id={`${id}-head`} data-acc-head className="ui-acc-btn" aria-expanded={open} aria-controls={`${id}-body`} disabled={disabled} onClick={() => ctx.toggle(value)}>
          {icon && <span className="ui-acc-icon">{icon}</span>}
          <span className="ui-acc-title">{title}</span>
          <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" className="ui-acc-chev" />
        </button>
      </H>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            id={`${id}-body`}
            role="region"
            aria-labelledby={`${id}-head`}
            className="ui-acc-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : DUR.component, ease: EASE_OUT }}
          >
            <div className="ui-acc-inner">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
