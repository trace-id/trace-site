import type { Metadata } from 'next';
import { Button, Eyebrow, Reveal } from '@/components/ui';
import { Explorer } from '@/components/use-cases/Explorer';
import { Band, IndustryCard } from '@/components/use-cases/parts';
import { JsonLd, breadcrumbLd, pageMetadata } from '@/lib/seo';
import { INDUSTRIES, USE_CASES } from '@/lib/use-cases';
import './use-cases.css';

export const metadata: Metadata = pageMetadata({
  title: 'Use cases',
  description: 'Stop new account fraud, bots, account takeover, promo abuse, account sharing and more with self-hosted device identification.',
  path: '/use-cases',
});

const CATEGORIES = ['Abuse and fraud', 'Security and payments', 'Revenue protection'] as const;

export default function UseCasesIndex() {
  return (
    <main className="uc">
      <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Use cases', path: '/use-cases' }])} />
      <section className="frame-section is-white no-top" aria-labelledby="uc-h1">
        <div className="frame">
          <div className="uc-hero-in frame-pad">
            <Eyebrow variant="upper">Use cases · {USE_CASES.length}</Eyebrow>
            <h1 id="uc-h1" className="uc-h1">One verified event. Every kind of <span className="accent">abuse.</span></h1>
            <p className="lede">Each case below runs on the same result: a device id, a score and the signals behind it. Pick the problem you have; the guide takes about ten minutes.</p>
            <div className="uc-actions">
              <Button href="/docs/quickstart" size="lg">Get started</Button>
              <Button href="/demo" variant="secondary" size="lg">See your own result</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="frame-section is-white" id="cases" aria-labelledby="solutions-h">
        <div className="frame">
          <Explorer
            categories={CATEGORIES}
            industries={INDUSTRIES.map((i) => ({ slug: i.slug, title: i.title, cases: i.cases }))}
            cases={USE_CASES.map((u) => {
              const last = u.scenario.rows[u.scenario.rows.length - 1]!;
              return {
                slug: u.slug, title: u.title, short: u.short, icon: u.icon, category: u.category,
                signals: u.signals.map((s) => s.id),
                preview: { verdict: last.verdict, note: last.note },
              };
            })}
          />
        </div>
      </section>

      <section className="frame-section is-white" id="industries" aria-labelledby="industries-h">
        <div className="frame">
          <Band id="industries-h" title="Industries" note="Where each industry usually starts." />
          <Reveal>
            <ul className="dashed-grid uc-cells">
              {INDUSTRIES.map((ind) => (
                <li key={ind.slug}><IndustryCard slug={ind.slug} title={ind.title} text={ind.text} icon={ind.icon} count={ind.cases.length} /></li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="frame-section is-tint" aria-labelledby="close-h">
        <div className="frame">
          <div className="uc-close-in frame-pad">
            <h2 id="close-h">Pick one. Ship it <span className="accent">this week.</span></h2>
            <p>One browser call, one server check. Self-hosted, so the data stays with you.</p>
            <div className="uc-actions">
              <Button href="/docs/quickstart" size="lg">Read the quickstart</Button>
              <Button href="/docs" variant="secondary" size="lg">Browse the docs</Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
