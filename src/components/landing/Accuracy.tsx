'use client';

import { motion } from 'motion/react';
import { Ruler } from 'lucide-react';
import Link from 'next/link';
import { Badge, CountUp, EASE_OUT, WindowCard } from '@/components/ui';
import { FeatureSection } from './FeatureSection';

const ACCURACY = [
  { k: 'Precision', v: 94.5, note: 'matched visits that really were the same device', lower: false },
  { k: 'Recall', v: 92.5, note: 'returning devices recognised', lower: false },
  { k: 'Wrong merges', v: 3.2, note: 'different devices given one ID', lower: true },
];

/** Accuracy as three measurement scales, labelled synthetic. No time series: only the three measured figures. */
export function Accuracy() {
  return (
    <FeatureSection
      id="acc-title"
      white
      flip
      eyebrow="Accuracy"
      icon={<Ruler />}
      title={<>Measured on <span className="accent">every</span> change.</>}
      text="Matching changes must not regress an accuracy run before they ship. The figures below come from that run, on simulated devices with private windows, cleared storage, updates and travel."
      link={{ href: '/docs/accuracy', label: 'How it is measured' }}
    >
      <WindowCard className="ac" title="npm run accuracy" action={<Badge size="sm" mono tone="med">Synthetic data</Badge>}>
        <div className="ac-body">
          {ACCURACY.map((a, n) => (
            <div key={a.k} className="ac-scale">
              <div className="ac-top">
                <span>{a.k}</span>
                <b><CountUp value={a.v} decimals={1} suffix="%" duration={0.9} /></b>
              </div>
              <div className="ac-ruler" role="meter" aria-label={a.k} aria-valuemin={0} aria-valuemax={100} aria-valuenow={a.v} aria-valuetext={`${a.v} percent${a.lower ? ', lower is better' : ''}`}>
                <motion.i
                  className={a.lower ? 'lower' : undefined}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: a.v / 100 }}
                  viewport={{ once: true, margin: '0px 0px -60px 0px' }}
                  transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.1 + n * 0.08 }}
                />
              </div>
              <div className="ac-ticks" aria-hidden="true"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
              <small>{a.note}{a.lower ? ' (lower is better)' : ''}</small>
            </div>
          ))}
          <p className="ac-caveat"><b>Synthetic data, not real traffic.</b> 1,000 simulated devices. Real-world numbers will differ and are likely lower. <Link href="/docs/accuracy">Method</Link></p>
        </div>
      </WindowCard>
    </FeatureSection>
  );
}
