import { ArrowRight, Braces, FileText, Fingerprint, Github, type LucideIcon, Plug, Radar, Server, ServerCog, SlidersHorizontal } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Brand, type BrandName } from '@/components/brand';
import { HeroArt } from '@/components/docs/HeroArt';
import { InstallWidget } from '@/components/install/InstallWidget';
import { UcIcon } from '@/components/use-cases/UcIcon';
import { Badge, Button, IconTile } from '@/components/ui';
import { docHref } from '@/lib/docs-nav';
import { JsonLd, breadcrumbLd, pageMetadata } from '@/lib/seo';
import { GITHUB_URL } from '@/lib/trace';
import { USE_CASES, guideSlug } from '@/lib/use-cases';

export const metadata: Metadata = pageMetadata({
  title: 'Documentation',
  description: 'Guides and reference for Trace: install, identify visitors, verify events, read signals, self-host.',
  path: '/docs',
});

const FEATURES: { href: string; Icon: LucideIcon; title: string; text: string; chips: string[] }[] = [
  {
    href: '/docs/overview',
    Icon: Fingerprint,
    title: 'Identification',
    text: 'Recognise a returning visitor or device from the browser or a mobile app, even across browsers.',
    chips: ['Browsers', 'Mobile apps', 'Cross-browser', 'Visitor ID'],
  },
  {
    href: '/docs/signals',
    Icon: Radar,
    title: 'Signals',
    text: 'A suspect score with the reasons behind it, from bots, VPNs, anti-detect browsers and repeat accounts.',
    chips: ['Bots', 'VPN', 'Anti-detect', 'Multi-account', 'more...'],
  },
];

interface Item {
  name: string;
  href: string;
  logo?: BrandName;
  Icon?: LucideIcon;
  text?: string;
}

const PLATFORMS: { group: string; items: Item[] }[] = [
  {
    group: 'Browser',
    items: [
      { name: 'JavaScript', logo: 'javascript', href: '/docs/javascript' },
      { name: 'React', logo: 'react', href: '/docs/react' },
      { name: 'Next.js', logo: 'nextjs', href: '/docs/nextjs' },
      { name: 'Remix', logo: 'remix', href: '/docs/remix' },
      { name: 'Vue', logo: 'vue', href: '/docs/vue' },
      { name: 'Nuxt', logo: 'nuxt', href: '/docs/nuxt' },
      { name: 'Svelte', logo: 'svelte', href: '/docs/svelte' },
      { name: 'SvelteKit', logo: 'svelte', href: '/docs/sveltekit' },
      { name: 'Angular', logo: 'angular', href: '/docs/angular' },
      { name: 'Solid', logo: 'solid', href: '/docs/solid' },
      { name: 'Astro', logo: 'astro', href: '/docs/astro' },
    ],
  },
  {
    group: 'Mobile',
    items: [
      { name: 'React Native & Expo', logo: 'expo', href: '/docs/react-native' },
      { name: 'Flutter', logo: 'flutter', href: '/docs/flutter' },
      { name: 'Kotlin and Android', logo: 'kotlin', href: '/docs/kotlin' },
      { name: 'Swift and iOS', logo: 'swift', href: '/docs/swift' },
    ],
  },
  {
    group: 'Server',
    items: [
      { name: 'Node.js', logo: 'node', href: '/docs/node' },
      { name: 'Express', logo: 'express', href: '/docs/express' },
      { name: 'Fastify', logo: 'fastify', href: '/docs/fastify' },
      { name: 'NestJS', logo: 'nestjs', href: '/docs/nestjs' },
      { name: 'Hono', logo: 'hono', href: '/docs/hono' },
      { name: 'Python', logo: 'python', href: '/docs/python' },
      { name: 'Django', logo: 'django', href: '/docs/django' },
      { name: 'FastAPI', logo: 'fastapi', href: '/docs/fastapi' },
      { name: 'Flask', logo: 'flask', href: '/docs/flask' },
      { name: 'PHP', logo: 'php', href: '/docs/php' },
      { name: 'Laravel', logo: 'laravel', href: '/docs/laravel' },
      { name: 'WordPress', logo: 'wordpress', href: '/docs/wordpress' },
      { name: 'Java', logo: 'java', href: '/docs/java' },
      { name: 'Go', logo: 'go', href: '/docs/go' },
      { name: 'Ruby and Rails', logo: 'ruby', href: '/docs/rails' },
      { name: '.NET', logo: 'dotnet', href: '/docs/dotnet' },
    ],
  },
  { group: 'Embedded', items: [{ name: 'Embedded mode', logo: 'postgres', href: '/docs/embedded' }, { name: 'Standalone server', logo: 'docker', href: '/docs/self-hosting' }] },
];

const CATEGORIES = ['Abuse and fraud', 'Security and payments', 'Revenue protection'] as const;

const REFERENCE: Item[] = [
  { name: 'Server API', Icon: Braces, href: '/docs/api', text: 'Identify, events, visitors, webhooks.' },
  { name: 'Signal catalog', Icon: Radar, href: '/docs/signals', text: 'Weights, detection, false positives.' },
  { name: 'Configuration', Icon: SlidersHorizontal, href: '/docs/configuration', text: 'Environment variables and scoring.' },
  { name: 'Self-hosting', Icon: ServerCog, href: '/docs/self-hosting', text: 'Deploy, secure, back up, upgrade.' },
  { name: 'Browser SDK', Icon: Plug, href: '/docs/browser-sdk', text: 'createClient, get(), results and errors.' },
  { name: 'Server SDKs', Icon: Server, href: '/docs/server-sdks', text: 'Verify events in Node, Python, PHP, Java, Go.' },
];

const AI: Item[] = [
  { name: 'MCP server', logo: 'claude', href: '/docs/agents#mcp-server', text: 'Look up events from Claude or Cursor.' },
  { name: 'llms.txt', Icon: FileText, href: '/llms.txt', text: 'An index of every page.' },
  { name: 'install.md', Icon: FileText, href: '/install.md', text: 'Step-by-step guide for agents.' },
  { name: 'GitHub', Icon: Github, href: GITHUB_URL, text: 'Source, issues and releases.' },
];

const isExternal = (href: string) => /^(https?:)?\/\//.test(href) || /\.(txt|md|json)$/.test(href);

/** One link row: icon or logo tile, title, optional one-line description. */
function Row({ href, tile, name, text }: { href: string; tile: ReactNode; name: string; text?: string }) {
  const inner = (
    <>
      <IconTile className="dh-tile" size="md" tone="ink" icon={tile} />
      <span>
        <b>{name}</b>
        {text && <small>{text}</small>}
      </span>
      <ArrowRight className="dh-go" size={15} aria-hidden="true" />
    </>
  );
  return isExternal(href) ? (
    <a className="dh-row" href={href} {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{inner}</a>
  ) : (
    <Link className="dh-row" href={href}>{inner}</Link>
  );
}

const itemTile = (i: Item) => (i.logo ? <Brand name={i.logo} size={20} /> : i.Icon ? <i.Icon size={20} strokeWidth={1.6} /> : null);

/** Section with the title, one line and a link on the left, the content on the right. */
function Split({ id, title, text, link, children }: { id?: string; title: string; text: string; link?: { href: string; label: string }; children: ReactNode }) {
  return (
    <section className="frame-section" aria-labelledby={`${id ?? title}-h`}>
      <div className="frame dh-in dh-split">
        <div className="dh-head">
          <h2 id={`${id ?? title}-h`}>{title}</h2>
          <p>{text}</p>
          {link && <Link className="arrow-link" href={link.href}>{link.label}</Link>}
        </div>
        <div className="dh-body">{children}</div>
      </div>
    </section>
  );
}

export default function DocsHome() {
  return (
    <main className="dh" id="main">
      <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Documentation', path: '/docs' }])} />
      <section className="frame-section no-top dh-hero" aria-labelledby="docs-h1">
        <div className="frame dh-hero-in">
          <div className="dh-hero-copy">
            <h1 id="docs-h1">Welcome to Trace <span className="accent">Docs</span></h1>
            <p className="lede dh-lede">Identify devices and score risk on your own infrastructure. Install in minutes, then verify every event on your server.</p>
            <p className="dh-tip">Tip: press <kbd>Ctrl K</kbd> anytime to search</p>
            <div className="dh-install">
              <InstallWidget />
              <Button href="/docs/quickstart" size="lg">Read the docs</Button>
            </div>
          </div>
          <HeroArt />
        </div>
      </section>

      <section className="frame-section" aria-label="What Trace does">
        <div className="frame dh-in">
          <div className="dh-feat">
            {FEATURES.map((f) => (
              <Link key={f.title} href={f.href} className="dh-card">
                <IconTile size="lg" icon={<f.Icon aria-hidden="true" />} />
                <h2>{f.title}</h2>
                <p>{f.text}</p>
                <span className="dh-chips">
                  {f.chips.map((c) => <Badge key={c} mono className="dh-chip">{c}</Badge>)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Split id="framework" title="Start by framework" text="Add the browser SDK in your front end and verify events in your backend, in the stack you already use." link={{ href: '/docs/quickstart', label: 'Quick start guide' }}>
        {PLATFORMS.map((g) => (
          <div key={g.group} className="dh-group">
            <p className="mono-label">{g.group}</p>
            <div className="dh-rows">
              {g.items.map((i) => <Row key={i.name} href={i.href} tile={itemTile(i)} name={i.name} />)}
            </div>
          </div>
        ))}
      </Split>

      <Split id="use-case" title="Start by use case" text="Guides for stopping a kind of abuse, with the signals to read and the code to write." link={{ href: '/use-cases', label: 'All use cases' }}>
        {CATEGORIES.map((cat) => (
          <div key={cat} className="dh-group">
            <p className="mono-label">{cat}</p>
            <div className="dh-rows">
              {USE_CASES.filter((u) => u.category === cat).map((u) => (
                <Row key={u.slug} href={docHref(guideSlug(u.slug))} tile={<UcIcon name={u.icon} size={20} />} name={u.title} text={u.short} />
              ))}
            </div>
          </div>
        ))}
      </Split>

      <Split id="reference" title="Reference" text="Look something up: endpoints, signals, settings, and how to run it." link={{ href: '/docs/api', label: 'Server API' }}>
        <div className="dh-rows">
          {REFERENCE.map((i) => <Row key={i.name} href={i.href} tile={itemTile(i)} name={i.name} text={i.text} />)}
        </div>
      </Split>

      <Split id="ai" title="For AI tools" text="Machine-readable docs and an MCP server, so an agent can read and use them." link={{ href: '/docs/agents', label: 'Install with AI' }}>
        <div className="dh-rows">
          {AI.map((i) => <Row key={i.name} href={i.href} tile={itemTile(i)} name={i.name} text={i.text} />)}
        </div>
      </Split>
    </main>
  );
}
