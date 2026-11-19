import { ImageResponse } from 'next/og';

export const OG_SIZE = { width: 1200, height: 630 };

/** Social card in the site's own palette: off-white canvas, indigo accent, the title at the size a feed can read. */
export function ogCard({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }): ImageResponse {
  const long = title.length > 38;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: '#f8f8f6', color: '#16171c', fontFamily: 'sans-serif', border: '1px solid #e4e3dd' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#2b3fd6' }} />
            trace
          </div>
          <div style={{ display: 'flex', fontSize: 22, color: '#6b6c75', textTransform: 'uppercase', letterSpacing: 3 }}>{eyebrow}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ display: 'flex', fontSize: long ? 64 : 80, fontWeight: 700, letterSpacing: -3, lineHeight: 1.04 }}>{title}</div>
          {subtitle ? <div style={{ display: 'flex', fontSize: 30, lineHeight: 1.35, color: '#4a4b54' }}>{subtitle.length > 130 ? `${subtitle.slice(0, 127)}...` : subtitle}</div> : null}
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          {['visitorId', 'suspectScore', 'reasons'].map((t) => (
            <div key={t} style={{ display: 'flex', padding: '10px 18px', borderRadius: 10, background: '#ffffff', border: '1px solid #e4e3dd', color: '#2b3fd6', fontSize: 24, fontFamily: 'monospace' }}>{t}</div>
          ))}
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
