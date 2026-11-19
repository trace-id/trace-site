import type { CSSProperties } from 'react';
import { cx } from './motion';

export interface MeterProps {
  /** 0 to 100. */
  value: number;
  /** Show the 0 / 25 / 60 / 100 ticks and band names. Default true. */
  ticks?: boolean;
  /** Show the band name (Low, Medium, High) at the end of the readout. Default true. */
  showLevel?: boolean;
  label?: string;
  className?: string;
}

export const riskLevel = (v: number) => (v >= 60 ? 'high' : v >= 25 ? 'med' : 'low');
const WORD = { low: 'Low risk', med: 'Medium risk', high: 'High risk' } as const;

/** Risk scale with measurement ticks (0-24 low, 25-59 medium, 60+ high). The marker slides with a transform. */
export function Meter({ value, ticks = true, showLevel = true, label = 'Suspect score', className }: MeterProps) {
  const v = Math.max(0, Math.min(100, value));
  const level = riskLevel(v);
  return (
    <div className={cx('ui-meter', `ui-meter-${level}`, className)} style={{ '--v': v } as CSSProperties}>
      <div className="ui-meter-head">
        <span className="ui-meter-score">
          <b>{Math.round(v)}</b>
          <small>/ 100</small>
        </span>
        {showLevel && <span className="ui-meter-level">{WORD[level]}</span>}
      </div>
      <div className="ui-meter-track" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)} aria-valuetext={`${Math.round(v)} of 100, ${WORD[level]}`}>
        <span className="ui-meter-band ui-band-low" />
        <span className="ui-meter-band ui-band-med" />
        <span className="ui-meter-band ui-band-high" />
        <span className="ui-meter-rail">
          <i className="ui-meter-marker" />
        </span>
      </div>
      {ticks && (
        <div className="ui-meter-ticks" aria-hidden="true">
          <span style={{ left: '0%' }}>0</span>
          <span style={{ left: '25%' }}>25</span>
          <span style={{ left: '60%' }}>60</span>
          <span style={{ left: '100%' }}>100</span>
        </div>
      )}
    </div>
  );
}
