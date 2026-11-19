import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button, Eyebrow, Reveal, StatGrid, StatTile } from '@/components/ui';
import { Accented, Band, CaseCard, IndustryCard, type CardCase } from '@/components/use-cases/parts';
import { ThreatMap } from '@/components/use-cases/ThreatMap';
import { JsonLd, articleLd, breadcrumbLd, pageMetadata } from '@/lib/seo';
import { INDUSTRIES, guideSlug, industry, useCase, type UseCase } from '@/lib/use-cases';
import '../../use-cases/use-cases.css';

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return INDUSTRIES.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const ind = industry((await params).slug);
  return ind ? pageMetadata({ title: `${ind.title}: fraud prevention`, description: ind.sub, path: `/industries/${ind.slug}`, type: 'article', image: `/industries/${ind.slug}/opengraph-image` }) : {};
}

const SIGNAL_IDS = [
  'bot', 'tampering', 'tor', 'datacenterIp', 'ipBlocklist', 'velocity', 'incognito', 'devtools', 'virtualMachine', 'privacyBrowser',
  'highActivity', 'crossBrowser', 'antiDetect', 'vpn', 'tlsMismatch', 'multiAccount', 'accountSharing', 'automatedInput', 'aiAgent', 'proxy', 'rareDevice', 'tamperedRequest', 'replayedRequest', 'flaggedNetwork', 'emulator', 'rootedDevice',
];

const card = (u: UseCase): CardCase => {
  const last = u.scenario.rows[u.scenario.rows.length - 1]!;
  return { slug: u.slug, title: u.title, short: u.short, icon: u.icon, signals: u.signals.map((s) => s.id), preview: { verdict: last.verdict, note: last.note } };
};

export default async function IndustryPage({ params }: { params: Promise<Params> }) {
  const ind = industry((await params).slug);
  if (!ind) notFound();
  const cases = ind.cases.map(useCase).filter((u): u is UseCase => u !== undefined);
  const lead = cases[0]!;
  const signalCount = new Set(cases.flatMap((u) => u.signals.map((s) => s.id))).size;
  const others = INDUSTRIES.filter((i) => i.slug !== ind.slug);

  return (
    <main className="uc">
      <JsonLd data={[articleLd({ title: `${ind.title}: fraud prevention`, description: ind.sub, path: `/industries/${ind.slug}` }), breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Use cases', path: '/use-cases' }, { name: ind.title, path: `/industries/${ind.slug}` }])]} />
      <section className="frame-section is-white no-top" aria-labelledby="uc-h1">
        <div className="frame">
          <div className="uc-hero-in frame-pad">
            <nav aria-label="Breadcrumb"><Eyebrow variant="upper" className="uc-crumb"><Link href="/use-cases#industries">Industries</Link><span aria-hidden="true">/</span>{ind.title}</Eyebrow></nav>
            <h1 id="uc-h1" className="uc-h1"><Accented text={ind.headline} /></h1>
            <p className="lede">{ind.sub}</p>
            <div className="uc-actions">
              <Button href={`/docs/${guideSlug(lead.slug)}`} size="lg">Start with {lead.title}</Button>
              <Button href="/demo" variant="secondary" size="lg">See your own result</Button>
            </div>
            <StatGrid columns={3} className="uc-stats" aria-label={`${ind.title} at a glance`}>
              <StatTile label="Threats" value={ind.pains.length} />
              <StatTile label="Use cases" value={cases.length} />
              <StatTile label="Signals" value={signalCount} />
            </StatGrid>
          </div>
        </div>
      </section>

      <section className="frame-section is-white" id="threats" aria-labelledby="threats-h">
        <div className="frame">
          <Band id="threats-h" title="What gets abused" note={`The usual problems in ${ind.title.toLowerCase()}.`} />
          <Reveal>
            <ol className="dashed-grid is-padded uc-threats" style={{ listStyle: 'none', margin: 0, paddingBlock: 0, paddingInline: 0 }}>
              {ind.pains.map((p, k) => (
                <li key={p.title}>
                  <span className="mono-label">{String(k + 1).padStart(2, '0')}</span>
                  <b>{p.title}</b>
                  <span>{p.text}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      <section className="frame-section is-tint" id="map" aria-labelledby="map-h">
        <div className="frame">
          <Band id="map-h" title="Threats to signals" note="Pick a use case to see which signals catch it. Point at a signal to see where else it helps." />
          <div className="uc-pad">
            <ThreatMap
              linkable={SIGNAL_IDS}
              cases={cases.map((u) => ({ slug: u.slug, title: u.title, short: u.short, icon: u.icon, signals: u.signals.map((s) => ({ id: s.id, why: s.why })) }))}
            />
          </div>
        </div>
      </section>

      <section className="frame-section is-white" id="start" aria-labelledby="start-h">
        <div className="frame">
          <Band id="start-h" title="Where to start" note="In order." />
          <ul className="dashed-grid uc-cells">
            {cases.map((u) => <li key={u.slug}><CaseCard c={card(u)} /></li>)}
          </ul>
        </div>
      </section>

      <section className="frame-section is-white" id="others" aria-labelledby="others-h">
        <div className="frame">
          <Band id="others-h" title="Other industries" />
          <ul className="dashed-grid uc-cells">
            {others.map((o) => <li key={o.slug}><IndustryCard slug={o.slug} title={o.title} text={o.text} icon={o.icon} count={o.cases.length} /></li>)}
          </ul>
        </div>
      </section>

      <section className="frame-section is-tint" aria-labelledby="close-h">
        <div className="frame">
          <div className="uc-close-in frame-pad">
            <h2 id="close-h">Self-hosted. <span className="accent">Your data stays yours.</span></h2>
            <p>Run Trace next to your app, start in shadow mode, and turn on decisions when the numbers look right.</p>
            <div className="uc-actions">
              <Button href="/docs/quickstart" size="lg">Read the quickstart</Button>
              <Button href="/use-cases" variant="secondary" size="lg">All use cases</Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
