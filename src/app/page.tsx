import { Fingerprint, Radar } from 'lucide-react';
import { Bento } from '@/components/Bento';
import { Hero } from '@/components/Hero';
import { InstallSection } from '@/components/install/InstallSection';
import { Accuracy } from '@/components/landing/Accuracy';
import { Closing } from '@/components/landing/Closing';
import { CodeTabs } from '@/components/landing/CodeTabs';
import { Faq } from '@/components/landing/Faq';
import { FeatureSection } from '@/components/landing/FeatureSection';
import { Privacy } from '@/components/landing/Privacy';
import { Scenarios } from '@/components/landing/Scenarios';
import { ScoreSim } from '@/components/landing/ScoreSim';
import { Stats } from '@/components/landing/Stats';
import { UseCases } from '@/components/landing/UseCases';
import { Brand, type BrandName } from '@/components/brand';
import { Eyebrow, Reveal } from '@/components/ui';
import { JsonLd, softwareLd } from '@/lib/seo';
import './landing.css';

const STACK: [BrandName, string][] = [
  ['javascript', 'JavaScript'], ['typescript', 'TypeScript'], ['react', 'React'], ['nextjs', 'Next.js'], ['vue', 'Vue'],
  ['svelte', 'Svelte'], ['angular', 'Angular'], ['solid', 'Solid'], ['expo', 'React Native'], ['flutter', 'Flutter'], ['kotlin', 'Kotlin'], ['swift', 'Swift'], ['node', 'Node.js'],
  ['python', 'Python'], ['php', 'PHP'], ['java', 'Java'], ['go', 'Go'], ['wordpress', 'WordPress'], ['cloudflare', 'Cloudflare'],
];

export default function Home() {
  return (
    <main className="lp">
      <JsonLd data={softwareLd()} />
      <Hero />

      <section className="frame-section is-white lp-stack" aria-label="Works with your stack">
        <div className="frame">
          <div className="lp-stack-in">
            <Eyebrow>Works with your stack</Eyebrow>
            <Reveal as="ul" stagger={0.04}>
              {STACK.map(([b, n]) => (
                <span key={b} className="lp-logo"><Brand name={b} size={18} /><span>{n}</span></span>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      <Stats />

      <FeatureSection
        id="id-title"
        white
        eyebrow="Identification"
        icon={<Fingerprint />}
        title={<>The ID <span className="accent">survives</span>.</>}
        text="Cookies come and go; the device stays recognisable. Pick a situation and see what Trace keeps, and how sure it is."
        link={{ href: '/docs/accuracy', label: 'How matching works' }}
      >
        <Scenarios />
      </FeatureSection>

      <FeatureSection
        id="sig-title"
        flip
        eyebrow="Fraud signals"
        icon={<Radar />}
        title={<>A score you can take <span className="accent">apart</span>.</>}
        text="Switch signals on and off. The score is a readable sum of weighted signals, every reason is itemised, and your backend turns it into a decision."
        link={{ href: '/docs/signals', label: 'All 26 signals' }}
      >
        <ScoreSim />
      </FeatureSection>

      <UseCases />

      <Bento />

      <InstallSection />

      <CodeTabs />

      <Accuracy />

      <Privacy />

      <Faq />

      <Closing />
    </main>
  );
}
