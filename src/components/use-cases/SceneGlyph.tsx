import type { CSSProperties } from 'react';
import type { SceneKind } from './Scenes';

const d = (n: number): CSSProperties => ({ animationDelay: `${n * 60}ms` });

/** A 96x48 mark per scene kind. At rest it is a quiet drawing; when the parent card is hovered or focused, it plays a short loop of what the scene does. */
export function SceneGlyph({ kind }: { kind: SceneKind }) {
  const common = { className: 'glyph', viewBox: '0 0 96 48', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false } as const;
  switch (kind) {
    case 'graph':
      return (
        <svg {...common}>
          {[[16, 10], [16, 38], [80, 10], [80, 38]].map(([x, y], i) => (
            <g key={i}>
              <path className="g-draw" pathLength={1} d={`M48 24 L${x} ${y}`} style={d(i)} />
              <circle className="g-pop" cx={x} cy={y} r={4} style={d(i + 2)} />
            </g>
          ))}
          <rect x={40} y={17} width={16} height={14} rx={3} className="g-fill" />
        </svg>
      );
    case 'pointer':
      return (
        <svg {...common}>
          <path className="g-draw" pathLength={1} d="M6 30 C 22 4, 38 44, 54 22 S 82 6, 90 16" />
          <path d="M6 42 H90" strokeDasharray="2 4" opacity={0.5} />
        </svg>
      );
    case 'queue':
      return (
        <svg {...common}>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} className="g-slide" x={8 + i * 22} y={14} width={16} height={20} rx={3} style={d(i)} />
          ))}
          <path d="M4 40 H92" opacity={0.5} />
        </svg>
      );
    case 'burst':
      return (
        <svg {...common}>
          {[6, 8, 9, 14, 20, 30, 36, 40].map((h, i) => (
            <rect key={i} className="g-grow" x={8 + i * 10} y={44 - h} width={5} height={h} rx={1.5} style={d(i)} />
          ))}
          <path d="M4 18 H92" strokeDasharray="2 4" opacity={0.6} />
        </svg>
      );
    case 'map':
      return (
        <svg {...common}>
          {Array.from({ length: 5 }, (_, r) => Array.from({ length: 12 }, (_, c) => <circle key={`${r}${c}`} cx={8 + c * 7.5} cy={8 + r * 8} r={0.9} fill="currentColor" stroke="none" opacity={0.35} />))}
          <g className="g-drop"><circle cx={60} cy={22} r={4} /><circle className="g-ring" cx={60} cy={22} r={9} /></g>
        </svg>
      );
    case 'clock':
      return (
        <svg {...common}>
          <circle cx={26} cy={24} r={16} />
          <circle cx={70} cy={24} r={16} />
          <path className="g-spin" d="M26 24 V12" />
          <path className="g-spin g-spin-b" d="M70 24 V12" />
        </svg>
      );
    case 'seats':
      return (
        <svg {...common}>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} className="g-pop" x={6 + i * 17.5} y={14} width={13} height={20} rx={3} style={d(i)} />
          ))}
        </svg>
      );
    case 'meter':
      return (
        <svg {...common}>
          <path d="M6 28 H90" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => <path key={i} d={`M${6 + i * 10.5} 28 v${i % 4 === 0 ? 7 : 4}`} opacity={0.6} />)}
          <path className="g-marker" d="M6 14 V28" strokeWidth={2.2} />
        </svg>
      );
    case 'evidence':
      return (
        <svg {...common}>
          <path className="g-draw" pathLength={1} d="M6 24 H90" />
          {[14, 36, 58, 80].map((x, i) => <circle key={i} className="g-pop" cx={x} cy={24} r={3.6} style={d(i)} />)}
          <path d="M14 24 V10 H80 V24" strokeDasharray="2 3" opacity={0.6} />
        </svg>
      );
    case 'stack':
      return (
        <svg {...common}>
          {[0, 1, 2].map((i) => <rect key={i} className="g-stack" x={22} y={6 + i * 8} width={52} height={16} rx={3} style={{ ...d(i), ['--i' as string]: i }} />)}
          <path d="M14 42 H82" />
        </svg>
      );
    case 'poll':
      return (
        <svg {...common}>
          {[40, 28, 18].map((w, i) => <rect key={i} className="g-bar" x={8} y={8 + i * 12} width={w * 1.8} height={7} rx={2} style={d(i)} />)}
        </svg>
      );
    case 'otp':
      return (
        <svg {...common}>
          {[0, 1, 2].map((i) => <rect key={i} className="g-slide" x={8 + i * 6} y={6 + i * 13} width={60} height={9} rx={4.5} style={d(i)} />)}
          <path className="g-pop" d="M78 10 l10 10 m0 -10 l-10 10" style={d(4)} />
        </svg>
      );
  }
}
