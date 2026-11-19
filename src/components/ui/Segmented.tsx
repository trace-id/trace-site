'use client';

import { motion } from 'motion/react';
import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { SPRING, cx } from './motion';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

/** Roving-tabindex arrow-key handler shared by SegmentedControl and Tabs. */
function useRoving(count: () => HTMLElement[], vertical = false) {
  return (e: KeyboardEvent<HTMLElement>) => {
    const items = count().filter((el) => !el.hasAttribute('disabled'));
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    const next = vertical ? 'ArrowDown' : 'ArrowRight';
    const prev = vertical ? 'ArrowUp' : 'ArrowLeft';
    let to = -1;
    if (e.key === next) to = (i + 1) % items.length;
    else if (e.key === prev) to = (i - 1 + items.length) % items.length;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = items.length - 1;
    if (to < 0) return;
    e.preventDefault();
    items[to]?.focus();
    items[to]?.click();
  };
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name for the group. */
  label: string;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
}

/** Pill group with a sliding indicator (shared layoutId). A radiogroup: arrows move and select. */
export function SegmentedControl<T extends string = string>({ options, value, onChange, label, size = 'md', fullWidth, className }: SegmentedControlProps<T>) {
  const uid = useId();
  const ref = useRef<HTMLDivElement>(null);
  const onKey = useRoving(() => Array.from(ref.current?.querySelectorAll<HTMLElement>('[role="radio"]') ?? []));
  return (
    <div ref={ref} role="radiogroup" aria-label={label} onKeyDown={onKey} className={cx('ui-seg', `ui-seg-${size}`, fullWidth && 'ui-seg-full', className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            disabled={o.disabled}
            className="ui-seg-item"
            data-on={on}
            onClick={() => onChange(o.value)}
          >
            {on && <motion.span layoutId={`seg-${uid}`} className="ui-seg-pill" transition={SPRING} />}
            <span className="ui-seg-label">
              {o.icon}
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export interface TabItem<T extends string = string> {
  id: T;
  label: ReactNode;
  icon?: ReactNode;
  /** Small count or note after the label. */
  meta?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps<T extends string = string> {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  /** Prefix for tab and panel ids; pair with <TabPanel idBase=...>. */
  idBase: string;
  /** underline (default): page tabs with a sliding line. boxed: a light segmented strip. */
  variant?: 'underline' | 'boxed';
  /** Mono uppercase labels, for window-card and layer tabs. */
  mono?: boolean;
  className?: string;
}

/** Tabs with a sliding indicator (underline or boxed). Tab ids are `${idBase}-tab-${id}`, panels `${idBase}-panel-${id}`. */
export function Tabs<T extends string = string>({ items, value, onChange, label, idBase, variant = 'underline', mono, className }: TabsProps<T>) {
  const uid = useId();
  const ref = useRef<HTMLDivElement>(null);
  const onKey = useRoving(() => Array.from(ref.current?.querySelectorAll<HTMLElement>('[role="tab"]') ?? []));
  return (
    <div ref={ref} role="tablist" aria-label={label} onKeyDown={onKey} className={cx('ui-tabs', variant === 'boxed' && 'ui-tabs-boxed', mono && 'ui-tabs-mono', className)}>
      {items.map((t) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            id={`${idBase}-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={on}
            aria-controls={`${idBase}-panel-${t.id}`}
            tabIndex={on ? 0 : -1}
            disabled={t.disabled}
            className="ui-tab"
            data-on={on}
            onClick={() => onChange(t.id)}
          >
            {t.icon}
            {t.label}
            {t.meta != null && <span className="ui-tab-meta">{t.meta}</span>}
            {on && <motion.span layoutId={`tab-${uid}`} className="ui-tab-line" transition={SPRING} />}
          </button>
        );
      })}
    </div>
  );
}

export interface TabPanelProps {
  idBase: string;
  id: string;
  /** The currently selected tab id; the panel is hidden unless it equals `id`. */
  value: string;
  children: ReactNode;
  className?: string;
}

/** Panel for a Tabs item. Renders nothing visible when not selected. */
export function TabPanel({ idBase, id, value, children, className }: TabPanelProps) {
  const on = value === id;
  return (
    <div role="tabpanel" id={`${idBase}-panel-${id}`} aria-labelledby={`${idBase}-tab-${id}`} hidden={!on} tabIndex={0} className={cx('ui-tabpanel', className)}>
      {on ? children : null}
    </div>
  );
}
