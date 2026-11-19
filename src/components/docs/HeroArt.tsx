import type { CSSProperties } from 'react';

const at = (i: number) => ({ '--i': i }) as CSSProperties;

/** Original line art for the docs home: one visitor ID at the centre of a small device graph. Illustrative, decorative. */
export function HeroArt() {
  return (
    <div className="dh-art">
      <svg viewBox="0 0 520 320" role="img" aria-label="Illustration: one visitor ID linking a laptop, a phone, a second browser and a server">
        <circle className="ha-ring is-dash" cx="260" cy="160" r="156" />
        <circle className="ha-ring is-acc" cx="260" cy="160" r="118" />
        <circle className="ha-ring is-dash" cx="260" cy="160" r="82" />

        {/* Links from the hub to each device. They draw in once. */}
        <path className="ha-line is-acc" pathLength={1} style={at(0)} d="M216 138 C 180 130 150 110 134 90" />
        <path className="ha-line is-acc" pathLength={1} style={at(1)} d="M216 184 C 176 196 140 214 102 236" />
        <path className="ha-line is-acc" pathLength={1} style={at(2)} d="M304 138 C 340 128 366 104 394 80" />
        <path className="ha-line is-acc" pathLength={1} style={at(3)} d="M304 184 C 340 196 372 216 406 240" />
        <path className="ha-line" pathLength={1} style={at(4)} d="M270 116 L 296 46" />
        <path className="ha-line" pathLength={1} style={at(5)} d="M250 204 L 214 284" />

        {/* Signals along the links */}
        <g className="ha-node" style={at(5)}>
          <circle className="ha-fill-acc" cx="167" cy="118" r="3" />
          <circle className="ha-fill-acc" cx="158" cy="206" r="3" />
          <circle className="ha-fill-acc" cx="352" cy="114" r="3" />
          <circle className="ha-fill-acc" cx="356" cy="207" r="3" />
          <circle className="ha-box" cx="300" cy="40" r="6" />
          <circle className="ha-box" cx="210" cy="290" r="6" />
        </g>

        {/* Hub: a 3 x 3 grid of points joined into one graph */}
        <g className="ha-node" style={at(0)}>
          <rect className="ha-box" x="216" y="116" width="88" height="88" rx="18" />
          <path className="ha-draw is-acc" d="M244 144 L260 160 L276 144 M260 160 V176 M244 176 L260 160" />
          {[244, 260, 276].flatMap((x) => [144, 160, 176].map((y) => (
            <circle key={`${x}-${y}`} className={x === 260 && y === 160 ? 'ha-fill-acc' : 'ha-fill-ink'} cx={x} cy={y} r={x === 260 && y === 160 ? 3.4 : 2.2} />
          )))}
          <text className="ha-label is-id" x="260" y="224" textAnchor="middle">vis_9c41e07a</text>
        </g>

        {/* Laptop */}
        <g className="ha-node" style={at(1)}>
          <rect className="ha-box" x="60" y="48" width="72" height="52" rx="8" />
          <path className="ha-draw" d="M72 62 H106 M72 72 H94 M72 82 H100" />
          <path className="ha-draw" d="M50 108 H142" />
          <text className="ha-label" x="96" y="126" textAnchor="middle">chrome, macOS</text>
        </g>

        {/* Phone */}
        <g className="ha-node" style={at(2)}>
          <rect className="ha-box" x="66" y="214" width="36" height="60" rx="8" />
          <path className="ha-draw" d="M78 224 H90 M76 244 H92 M76 252 H86" />
          <text className="ha-label" x="84" y="292" textAnchor="middle">safari, iOS</text>
        </g>

        {/* Second browser */}
        <g className="ha-node" style={at(3)}>
          <rect className="ha-box" x="394" y="43" width="76" height="54" rx="8" />
          <path className="ha-draw" d="M394 59 H470 M404 74 H442 M404 84 H428" />
          <circle className="ha-fill-ink" cx="403" cy="51" r="1.6" />
          <circle className="ha-fill-ink" cx="410" cy="51" r="1.6" />
          <circle className="ha-fill-ink" cx="417" cy="51" r="1.6" />
          <text className="ha-label" x="432" y="116" textAnchor="middle">firefox, same device</text>
        </g>

        {/* Your server */}
        <g className="ha-node" style={at(4)}>
          <rect className="ha-box" x="406" y="218" width="68" height="56" rx="8" />
          <path className="ha-draw" d="M406 246 H474 M432 232 H460 M432 260 H452" />
          <circle className="ha-fill-acc" cx="418" cy="232" r="2.2" />
          <circle className="ha-fill-acc" cx="418" cy="260" r="2.2" />
          <text className="ha-label" x="440" y="292" textAnchor="middle">your server verifies</text>
        </g>
      </svg>
    </div>
  );
}
