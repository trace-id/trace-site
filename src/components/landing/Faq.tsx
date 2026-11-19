import Link from 'next/link';
import { Accordion, AccordionItem, Reveal } from '@/components/ui';
import { JsonLd, faqLd } from '@/lib/seo';

/** Plain-text answers: the same strings feed the page and the FAQ structured data, so they cannot drift apart. */
export const FAQ: { q: string; a: string; link?: { href: string; label: string } }[] = [
  {
    q: 'Is Trace free?',
    a: 'Yes. The server is AGPL-3.0 and the SDKs are MIT. There are no per-event fees or usage tiers: you run it yourself and pay only for the servers you choose.',
    link: { href: '/license', label: 'Licensing' },
  },
  {
    q: 'Where does my visitors’ data go?',
    a: 'Only to your own servers. Trace is self-hosted, so visitor data, events and IP addresses live in your Postgres. Nothing is sent to the Trace project, and nothing leaves your deployment unless you choose to configure an external IP data provider.',
    link: { href: '/docs/privacy', label: 'What is stored' },
  },
  {
    q: 'How does it recognise a device after cookies are cleared?',
    a: 'The browser SDK reads many stable characteristics, such as screen, graphics, fonts, audio and time zone, and hashes the high-entropy ones in the browser. The server matches them against known visitors and returns a confidence. A signed token kept in a cookie, local storage and IndexedDB gives an exact match when any copy survives; otherwise matching falls back to the signals.',
    link: { href: '/docs/accuracy', label: 'How matching works' },
  },
  {
    q: 'How accurate is it?',
    a: 'It depends on your traffic. The accuracy harness in the repository reports identification on generated data, and those numbers are labelled synthetic. Run Trace in shadow mode on your own traffic before you enforce anything.',
    link: { href: '/docs/accuracy', label: 'Accuracy and method' },
  },
  {
    q: 'Do I need consent, and is it GDPR compliant?',
    a: 'Device identification is personal data under the GDPR, and you are the controller of what your deployment stores. The browser SDK can start disabled and be switched on by your consent manager, retention and deletion are built in, and the privacy guide lists what is stored. Whether you need consent depends on your purpose and jurisdiction, so take legal advice for your case.',
    link: { href: '/docs/privacy', label: 'Privacy guide' },
  },
  {
    q: 'Does Trace block people for me?',
    a: 'No. It returns a visitor ID, a suspect score from 0 to 100 and the reasons behind it. Your backend decides what to do. Start in shadow mode: log what you would have blocked, then pick thresholds you trust.',
    link: { href: '/use-cases', label: 'Use cases' },
  },
  {
    q: 'What happens if the Trace server is down?',
    a: 'Verification calls have a short timeout, and you choose whether to fail open or closed. The server SDK guards fail closed by default and offer a fail-open option for outages. A wrong secret key never fails open.',
    link: { href: '/docs/integration', label: 'Integration guide' },
  },
  {
    q: 'Which languages and frameworks are supported?',
    a: 'In the browser: JavaScript, React, Next.js, Vue, Svelte, Angular and Solid, plus React Native, Expo, Flutter and native Kotlin (Android) and Swift (iOS, a draft) for apps. On the server: Node.js, Python, PHP, Java and Go SDKs, guards for Express, Fastify, Django, Flask, FastAPI and Laravel, and a WordPress and WooCommerce plugin. Ruby and .NET SDKs exist as drafts that are not yet tested. Anything else can call the REST API.',
    link: { href: '/docs/integration', label: 'All SDKs' },
  },
  {
    q: 'How is it different from a hosted fingerprinting service?',
    a: 'Hosted services run on the vendor’s servers and bill per call. Trace runs on yours, shows its work with every signal, its weight and its false-positive notes, and is open source, so you can read and change the matching.',
    link: { href: '/docs/signals', label: 'The signal catalog' },
  },
  {
    q: 'Can I run it without a separate server?',
    a: 'Yes. Embedded mode runs the engine inside your own backend, with MongoDB or Postgres for storage and adapters for Express, Fastify and fetch-style frameworks such as Next.js.',
    link: { href: '/docs/embedded', label: 'Embedded mode' },
  },
];

/** Frequently asked questions, as an accordion, with FAQ structured data. */
export function Faq() {
  return (
    <section className="frame-section is-white" aria-labelledby="faq-title">
      <JsonLd data={faqLd(FAQ.map(({ q, a }) => ({ q, a })))} />
      <div className="frame">
        <div className="faq">
          <Reveal className="faq-head">
            <p className="mono-label">Questions</p>
            <h2 id="faq-title" className="h-section">Before you <span className="accent">install</span>.</h2>
            <p className="lede">Short answers to what people ask first. The rest is in the <Link href="/docs">docs</Link>.</p>
          </Reveal>
          <Accordion className="faq-list" headingLevel={3}>
            {FAQ.map(({ q, a, link }, i) => (
              <AccordionItem key={q} value={`q${i}`} title={q}>
                <p>{a}</p>
                {link && <p><Link className="arrow-link" href={link.href}>{link.label}</Link></p>}
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
