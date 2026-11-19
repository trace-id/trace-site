'use client';

import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { Switch } from '@/components/shadcn/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/shadcn/toggle-group';
import { cn } from '@/lib/utils';
import './controls.css';

/** Wraps a copy control and confirms with a toast. One shared toast id, so repeated clicks never stack. */
export function ToastCopy({ message = 'Copied', children }: { message?: string; children: ReactNode }) {
  return (
    <span style={{ display: 'contents' }} onClick={() => toast.success(message, { id: 'copied', duration: 1600 })}>
      {children}
    </span>
  );
}

export interface FilterOption<T extends string> {
  value: T;
  label: ReactNode;
}

/** Single-select filter on the shadcn ToggleGroup, drawn as flat chips. One option is always selected. */
export function FilterToggle<T extends string>({ value, onChange, options, label, className }: { value: T; onChange: (v: T) => void; options: FilterOption<T>[]; label: string; className?: string }) {
  return (
    <ToggleGroup type="single" value={value} onValueChange={(v) => v && onChange(v as T)} aria-label={label} className={cn('ft', className)}>
      {options.map((o) => (
        <ToggleGroupItem key={o.value} value={o.value} className="ft-item">
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** One signal as an accessible switch row: the whole row is the label, the weight is read out as points. */
export function SwitchRow({ id, label, weight, checked, onChange, bar, mono = true }: { id: string; label: ReactNode; weight: number; checked: boolean; onChange: () => void; bar?: number; mono?: boolean }) {
  return (
    <label className="sw-row" htmlFor={id} data-on={checked}>
      <Switch id={id} size="sm" checked={checked} onCheckedChange={onChange} className="sw" />
      <span className={cn('sw-name', mono && 'is-mono')}>{label}</span>
      {bar !== undefined && (
        <span className="sw-bar" aria-hidden="true">
          <i style={{ transform: `scaleX(${bar})` }} />
        </span>
      )}
      <b className="sw-w">
        +{weight}
        <span className="sr-only"> points</span>
      </b>
    </label>
  );
}
