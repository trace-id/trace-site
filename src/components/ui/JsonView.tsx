import type { ReactNode } from 'react';
import { cx } from './motion';

export interface JsonViewProps {
  /** Any JSON-serialisable value. Pretty-printed with 2 spaces. */
  value?: unknown;
  /** Already formatted JSON text (used instead of `value`). */
  text?: string;
  lineNumbers?: boolean;
  /** Box height cap in px or CSS length; content scrolls inside. Default 320. */
  maxHeight?: number | string;
  /** Accessible name for the scroll region. */
  label?: string;
  className?: string;
}

const TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}[\],:]/g;

function tokenise(line: string, key: number) {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const [tok, str, colon, lit] = m;
    let cls = 'j-p';
    if (str) cls = colon ? 'j-k' : 'j-s';
    else if (lit) cls = 'j-l';
    else if (/^[-\d]/.test(tok)) cls = 'j-n';
    if (str && colon) {
      out.push(
        <span key={`${key}-${m.index}`} className="j-k">
          {str}
        </span>,
        <span key={`${key}-${m.index}c`} className="j-p">
          {colon}
        </span>,
      );
    } else {
      out.push(
        <span key={`${key}-${m.index}`} className={cls}>
          {tok}
        </span>,
      );
    }
    last = m.index + tok.length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

/** Read-only, light, syntax-coloured JSON (keys accent, strings green, numbers and literals amber). Scrolls inside its box. */
export function JsonView({ value, text, lineNumbers = false, maxHeight = 320, label = 'JSON', className }: JsonViewProps) {
  const src = text ?? JSON.stringify(value, null, 2) ?? 'null';
  const lines = src.split('\n');
  return (
    <div className={cx('ui-json', lineNumbers && 'has-lines', className)} role="region" aria-label={label} tabIndex={0} style={{ maxHeight }}>
      <pre>
        <code>
          {lines.map((l, i) => (
            <span key={i} className="j-line">
              {tokenise(l, i)}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
