import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { codeToHtml } from 'shiki';
import { Brand, type BrandName } from '@/components/brand';
import { Badge, Button, Eyebrow, JsonView, Reveal } from '@/components/ui';
import { CodeTabs, type CodeTab } from '@/components/use-cases/CodeTabs';
import { DecisionLab } from '@/components/use-cases/DecisionLab';
import { Accented, Band, CaseCard, VERDICT, type CardCase } from '@/components/use-cases/parts';
import { Scene, type SceneKind } from '@/components/use-cases/Scenes';
import { WEIGHTS } from '@/components/use-cases/weights';
import { JsonLd, articleLd, breadcrumbLd, pageMetadata } from '@/lib/seo';
import { USE_CASES, guideSlug, useCase, type UseCase } from '@/lib/use-cases';
import '../use-cases.css';

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return USE_CASES.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const u = useCase((await params).slug);
  return u ? pageMetadata({ title: u.title, description: u.sub, path: `/use-cases/${u.slug}`, type: 'article', image: `/use-cases/${u.slug}/opengraph-image` }) : {};
}

const SIGNAL_IDS = new Set([
  'bot', 'tampering', 'tor', 'datacenterIp', 'ipBlocklist', 'velocity', 'incognito', 'devtools', 'virtualMachine', 'privacyBrowser',
  'highActivity', 'crossBrowser', 'antiDetect', 'vpn', 'tlsMismatch', 'multiAccount', 'accountSharing', 'automatedInput', 'aiAgent', 'proxy', 'rareDevice', 'tamperedRequest', 'replayedRequest', 'flaggedNetwork', 'emulator', 'rootedDevice',
]);

/** Signals that often show up alongside each kind of attack, so the lab has more than the headline signals. */
const EXTRA: Record<SceneKind, string[]> = {
  graph: ['crossBrowser', 'incognito', 'bot'], pointer: ['antiDetect', 'datacenterIp'], queue: ['velocity', 'datacenterIp'],
  burst: ['bot', 'automatedInput'], map: ['tor', 'datacenterIp', 'accountSharing'], clock: ['tor', 'ipBlocklist'],
  seats: ['vpn', 'velocity'], meter: ['incognito', 'privacyBrowser', 'crossBrowser'], evidence: ['vpn', 'velocity'],
  stack: ['incognito', 'crossBrowser', 'bot'], poll: ['incognito', 'bot', 'velocity'], otp: ['datacenterIp', 'automatedInput'],
};

const STACK: [BrandName, string, string][] = [
  ['javascript', 'JavaScript', '/docs/javascript'], ['react', 'React', '/docs/react'], ['nextjs', 'Next.js', '/docs/nextjs'],
  ['vue', 'Vue', '/docs/vue'], ['svelte', 'Svelte', '/docs/svelte'], ['angular', 'Angular', '/docs/angular'],
  ['node', 'Node.js', '/docs/node'], ['python', 'Python', '/docs/python'], ['php', 'PHP', '/docs/php'], ['java', 'Java', '/docs/java'],
];

const BROWSER_CODE = `const trace = createClient({ apiKey: 'pk_...', endpoint: 'https://id.example.com' });

// On the action (signup, login, checkout), then send eventId with the form.
const { eventId } = await trace.get();`;

const SERVER_CODE = `const e = await verifyEvent(eventId, { secretKey, endpoint });

if (e.suspectScore >= 60) block();`;

const card = (u: UseCase): CardCase => {
  const last = u.scenario.rows[u.scenario.rows.length - 1]!;
  return { slug: u.slug, title: u.title, short: u.short, icon: u.icon, signals: u.signals.map((s) => s.id), preview: { verdict: last.verdict, note: last.note } };
};

export default async function UseCasePage({ params }: { params: Promise<Params> }) {
  const u = useCase((await params).slug);
  if (!u) notFound();
  const hl = (c: string) => codeToHtml(c, { lang: 'ts', theme: 'github-dark' });

  // Illustrative response built from this case's own signals and the default weights.
  const fired = u.signals.map((s) => s.id).filter((id) => id in WEIGHTS);
  const score = Math.min(100, fired.reduce((n, id) => n + (WEIGHTS[id] ?? 0), 0));
  const event = {
    eventId: 'evt_example',
    visitorId: 'vis_example',
    suspectScore: score,
    signals: Object.fromEntries(fired.map((id) => [id, { detected: true }])),
    reasons: fired.map((id) => `${id} +${WEIGHTS[id]}`),
  };
  const label = 'Example response, illustrative';
  const tabs: CodeTab[] = [
    { id: 'browser', label: 'Browser', file: 'identify.ts', html: await hl(BROWSER_CODE), text: BROWSER_CODE, response: { eventId: 'evt_example' }, responseLabel: label },
    { id: 'server', label: 'Server', file: 'verify.ts', html: await hl(SERVER_CODE), text: SERVER_CODE, response: event, responseLabel: label },
    { id: 'case', label: 'This case', file: 'decide.ts', html: await hl(u.code), text: u.code, response: event, responseLabel: label },
  ];

  const related = u.related.map(useCase).filter((r): r is UseCase => r !== undefined);
  const guide = `/docs/${guideSlug(u.slug)}`;
  const i = USE_CASES.indexOf(u);
  const prev = USE_CASES[(i - 1 + USE_CASES.length) % USE_CASES.length]!;
  const next = USE_CASES[(i + 1) % USE_CASES.length]!;
  const signalNames = u.signals.map((s) => s.id).filter((id) => SIGNAL_IDS.has(id));
  // One line per decision the example ends up making, taken from the scenario itself.
  const decisions = (['allow', 'review', 'block'] as const).flatMap((v) => {
    const row = u.scenario.rows.find((r) => r.verdict === v);
    return row ? [{ v, note: row.note }] : [];
  });

  return (
    <main className="uc">
      <JsonLd data={[articleLd({ title: u.title, description: u.sub, path: `/use-cases/${u.slug}` }), breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Use cases', path: '/use-cases' }, { name: u.title, path: `/use-cases/${u.slug}` }])]} />
      <section className="frame-section is-white no-top" aria-labelledby="uc-h1">
        <div className="frame">
          <div className="uc-hero-in frame-pad">
            <nav aria-label="Breadcrumb"><Eyebrow variant="upper" className="uc-crumb"><Link href="/use-cases">Use cases</Link><span aria-hidden="true">/</span>{u.category}</Eyebrow></nav>
            <h1 id="uc-h1" className="uc-h1"><Accented text={u.headline} /></h1>
            <p className="lede">{u.sub}</p>
            <div className="uc-actions">
              <Button href={guide} size="lg">Read the guide</Button>
              <Button href="/demo" variant="secondary" size="lg">See your own result</Button>
            </div>
            <div className="uc-sigrow">
              <span className="mono-label">Signals</span>
              {(signalNames.length ? signalNames : ['deviceId', 'visitorId']).map((s) => <Badge key={s} mono size="sm">{s}</Badge>)}
            </div>
          </div>
        </div>
      </section>

      <section className="frame-section is-tint" aria-label="Animated example">
        <div className="frame frame-pad">
          <Reveal as="figure" className="uc-stage">
            <Scene kind={u.scene} rows={u.scenario.rows} caption={u.scenario.caption} />
            <figcaption><b>Figure 1</b>{u.scenario.caption}. Illustrative data. Hover or focus to pause; pick a step to scrub.</figcaption>
          </Reveal>
        </div>
      </section>

      <section className="frame-section is-white" id="how" aria-labelledby="how-h">
        <div className="frame">
          <Band id="how-h" title="How it plays out" note="The attack, what the verified event shows, and what your code does about it." />
          <div className="dashed-grid is-padded uc-tri">
            <div>
              <span className="mono-label">01 · The attack</span>
              <h3>How it usually goes</h3>
              <ol>
                {u.attacks.map((a) => (
                  <li key={a.title}><b>{a.title}</b>{a.text}</li>
                ))}
              </ol>
            </div>
            <div>
              <span className="mono-label">02 · What Trace sees</span>
              <h3>Fields on the verified event</h3>
              <ul>
                {u.signals.map((s) => (
                  <li key={s.id}>
                    {SIGNAL_IDS.has(s.id) ? (
                      <Link href={`/docs/signals#signal-${s.id}`} className="uc-sig-name">{s.id}<ArrowUpRight size={13} aria-hidden="true" /></Link>
                    ) : (
                      <span className="uc-sig-name">{s.id}</span>
                    )}
                    {s.why}
                    <JsonView text={s.sample} label={`${s.id} sample`} maxHeight={120} />
                  </li>
                ))}
              </ul>
            </div>
            <div className="uc-do">
              <span className="mono-label">03 · What you do</span>
              <h3>Decide, with your own thresholds</h3>
              <ul>
                {decisions.map((d) => (
                  <li key={d.v}>
                    <span className="uc-v" data-v={d.v}>{VERDICT[d.v]}</span>
                    {d.note}
                  </li>
                ))}
              </ul>
              <Link href={guide} className="arrow-link">Read the guide</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="frame-section is-tint" id="lab" aria-labelledby="lab-h">
        <div className="frame">
          <Band id="lab-h" title="Decision lab" note="Switch signals on and off. The score is a plain sum of weights." />
          <div className="uc-pad">
            <DecisionLab signals={[...u.signals.map((x) => x.id), ...EXTRA[u.scene]]} />
          </div>
        </div>
      </section>

      <section className="frame-section is-white" id="build" aria-labelledby="build-h">
        <div className="frame">
          <Band id="build-h" title="Implementation" note="One browser call, one server check." />
          <div className="dashed-grid is-padded cols-3 uc-steps">
            <div><span className="mono-label">01</span><b>Identify</b><span>Call the SDK on the action and send the eventId with it.</span></div>
            <div><span className="mono-label">02</span><b>Verify</b><span>Your server reads the event with a secret key.</span></div>
            <div><span className="mono-label">03</span><b>Decide</b><span>Allow, challenge or block, with your own thresholds.</span></div>
          </div>
          <div className="uc-pad">
            <CodeTabs tabs={tabs} />
          </div>
          <div className="uc-pad uc-stack" style={{ paddingTop: 0 }}>
            <span className="mono-label">Works with your stack</span>
            {STACK.map(([logo, name, href]) => (
              <Link key={name} href={href} title={`${name} quickstart`}>
                <Brand name={logo} size={16} />
                <span>{name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="frame-section is-white" id="related" aria-labelledby="related-h">
          <div className="frame">
            <Band id="related-h" title="Related use cases" note="Often solved together." />
            <ul className="dashed-grid uc-cells">
              {related.map((r) => <li key={r.slug}><CaseCard c={card(r)} /></li>)}
            </ul>
          </div>
        </section>
      )}

      <nav className="frame-section is-white" aria-label="More use cases">
        <div className="frame">
          <div className="dashed-grid cols-2 uc-pager">
            <Link href={`/use-cases/${prev.slug}`}><small className="mono-label"><ArrowLeft size={13} aria-hidden="true" />Previous</small><b>{prev.title}</b></Link>
            <Link href={`/use-cases/${next.slug}`}><small className="mono-label">Next<ArrowRight size={13} aria-hidden="true" /></small><b>{next.title}</b></Link>
          </div>
        </div>
      </nav>

      <section className="frame-section is-tint" aria-labelledby="close-h">
        <div className="frame">
          <div className="uc-close-in frame-pad">
            <h2 id="close-h">Start in shadow mode. <span className="accent">Block later.</span></h2>
            <p>Log the decision for a week, check who it would have stopped, then turn it on.</p>
            <div className="uc-actions">
              <Button href={guide} size="lg">Read the guide</Button>
              <Button href="/use-cases" variant="secondary" size="lg">All use cases</Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
