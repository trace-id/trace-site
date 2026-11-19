/* Docs navigation data: safe to import from client components (no fs, no highlighter). */

import { USE_CASES, guideSlug } from './use-cases';

export type DocTab = 'start' | 'guides' | 'reference';

export interface DocPage {
  slug: string;
  title: string;
  group: string;
  tab: DocTab;
  /** Icon key: a lucide name from components/docs/icons.tsx, or "brand:<name>" for a technology logo. */
  icon: string;
  description: string;
  /** Shown under the title, e.g. "10 minutes". */
  time?: string;
}

export const DOC_TABS: { id: DocTab; label: string; href: string; icon: string }[] = [
  { id: 'start', label: 'Start', href: '/docs/quickstart', icon: 'play' },
  { id: 'guides', label: 'Guides', href: '/docs/new-account-fraud', icon: 'book-open' },
  { id: 'reference', label: 'API Reference', href: '/docs/browser-sdk', icon: 'code' },
];

/** Sidebar groups get a small icon, like the platform headings in a docs sidebar. */
export const GROUP_ICONS: Record<string, string> = {
  Web: 'monitor',
  Mobile: 'smartphone',
  Server: 'server',
  Embedded: 'box',
  'Abuse and fraud': 'shield',
  'Security and payments': 'key-round',
  'Revenue protection': 'coins',
  SDKs: 'package',
  API: 'braces',
};

/** One guide per use case, grouped by category: handwritten where content/docs/<slug>.md exists, generated otherwise. */
const CATEGORY_ORDER = ['Abuse and fraud', 'Security and payments', 'Revenue protection'] as const;
const USE_CASE_PAGES: DocPage[] = CATEGORY_ORDER.flatMap((cat) =>
  USE_CASES.filter((u) => u.category === cat).map((u) => ({
    slug: guideSlug(u.slug),
    title: u.title,
    group: cat,
    tab: 'guides' as const,
    icon: u.icon,
    time: '10 minutes',
    description: u.short.replace(/\.$/, ''),
  })),
);

/** Sidebar order and grouping. The docs home (/docs) is its own page; 'overview' renders content/docs/index.md. */
export const DOC_PAGES: DocPage[] = [
  // Start
  { slug: 'quickstart', title: 'Quick start guide', group: 'Getting started', tab: 'start', icon: 'signpost', time: '15 minutes', description: 'Run Trace, create keys, identify a visitor and verify the event' },
  { slug: 'overview', title: 'How Trace works', group: 'Getting started', tab: 'start', icon: 'book', description: 'The browser SDK, the server, and the verified event' },
  { slug: 'agents', title: 'Install with AI', group: 'Getting started', tab: 'start', icon: 'sparkles', description: 'Let a coding agent add Trace, or query events over MCP' },
  { slug: 'javascript', title: 'JavaScript', group: 'Web', tab: 'start', icon: 'brand:javascript', time: '5 minutes', description: 'Identify visitors with the browser SDK in any web app' },
  { slug: 'react', title: 'React', group: 'Web', tab: 'start', icon: 'brand:react', time: '10 minutes', description: 'Identify visitors in a React app with @trace-id/sdk-react' },
  { slug: 'nextjs', title: 'Next.js', group: 'Web', tab: 'start', icon: 'brand:nextjs', time: '10 minutes', description: 'Identify in a client component and guard a route handler with @trace-id/sdk-next' },
  { slug: 'vue', title: 'Vue', group: 'Web', tab: 'start', icon: 'brand:vue', time: '10 minutes', description: 'Identify visitors in Vue 3 or Nuxt with @trace-id/sdk-vue' },
  { slug: 'svelte', title: 'Svelte', group: 'Web', tab: 'start', icon: 'brand:svelte', time: '10 minutes', description: 'Identify visitors in Svelte or SvelteKit with a store' },
  { slug: 'sveltekit', title: 'SvelteKit', group: 'Web', tab: 'start', icon: 'brand:svelte', time: '10 minutes', description: 'Identify in a Svelte component and verify in a +server.ts endpoint' },
  { slug: 'nuxt', title: 'Nuxt', group: 'Web', tab: 'start', icon: 'brand:nuxt', time: '10 minutes', description: 'Identify with a client plugin and verify in a Nitro server route' },
  { slug: 'remix', title: 'Remix and React Router', group: 'Web', tab: 'start', icon: 'brand:remix', time: '10 minutes', description: 'Identify in a route and verify in an action with guardRequest' },
  { slug: 'astro', title: 'Astro', group: 'Web', tab: 'start', icon: 'brand:astro', time: '10 minutes', description: 'Identify with a page script and verify in an API endpoint' },
  { slug: 'solid', title: 'Solid', group: 'Web', tab: 'start', icon: 'brand:solid', time: '10 minutes', description: 'Identify visitors in Solid or SolidStart with signals from @trace-id/sdk-solid' },
  { slug: 'angular', title: 'Angular', group: 'Web', tab: 'start', icon: 'brand:angular', time: '10 minutes', description: 'Identify visitors in Angular 17+ with signals from @trace-id/sdk-angular' },
  { slug: 'react-native', title: 'React Native & Expo', group: 'Mobile', tab: 'start', icon: 'brand:expo', time: '10 minutes', description: 'Identify devices in a React Native or Expo app with @trace-id/sdk-react-native' },
  { slug: 'flutter', title: 'Flutter', group: 'Mobile', tab: 'start', icon: 'brand:flutter', time: '10 minutes', description: 'Identify devices in Flutter apps with the trace_device package' },
  { slug: 'kotlin', title: 'Kotlin and Android', group: 'Mobile', tab: 'start', icon: 'brand:kotlin', time: '10 minutes', description: 'Identify devices in native Android apps with the dev.trace.device library' },
  { slug: 'swift', title: 'Swift and iOS', group: 'Mobile', tab: 'start', icon: 'brand:swift', time: '10 minutes', description: 'Draft SDK: identify devices in native iOS apps with the TraceDevice package' },
  { slug: 'node', title: 'Node.js', group: 'Server', tab: 'start', icon: 'brand:node', time: '5 minutes', description: 'Verify events in your Node.js backend with @trace-id/sdk-node' },
  { slug: 'express', title: 'Express', group: 'Server', tab: 'start', icon: 'brand:express', time: '5 minutes', description: 'Guard Express routes with the traceGuard middleware' },
  { slug: 'fastify', title: 'Fastify', group: 'Server', tab: 'start', icon: 'brand:fastify', time: '5 minutes', description: 'Guard Fastify routes with the traceHook pre-handler' },
  { slug: 'nestjs', title: 'NestJS', group: 'Server', tab: 'start', icon: 'brand:nestjs', time: '5 minutes', description: 'Guard NestJS routes with a guard that calls verifyEvent' },
  { slug: 'hono', title: 'Hono', group: 'Server', tab: 'start', icon: 'brand:hono', time: '5 minutes', description: 'Guard Hono routes on Node, Bun, Deno and Workers' },
  { slug: 'python', title: 'Python', group: 'Server', tab: 'start', icon: 'brand:python', time: '5 minutes', description: 'Verify events in Django, Flask or FastAPI with trace-device' },
  { slug: 'django', title: 'Django', group: 'Server', tab: 'start', icon: 'brand:django', time: '5 minutes', description: 'Guard Django views with the trace_guard decorator' },
  { slug: 'fastapi', title: 'FastAPI', group: 'Server', tab: 'start', icon: 'brand:fastapi', time: '5 minutes', description: 'Guard FastAPI routes with the trace_dependency dependency' },
  { slug: 'flask', title: 'Flask', group: 'Server', tab: 'start', icon: 'brand:flask', time: '5 minutes', description: 'Guard Flask routes with the trace_guard decorator' },
  { slug: 'php', title: 'PHP', group: 'Server', tab: 'start', icon: 'brand:php', time: '5 minutes', description: 'Verify events in Laravel or plain PHP with trace/trace' },
  { slug: 'laravel', title: 'Laravel', group: 'Server', tab: 'start', icon: 'brand:laravel', time: '5 minutes', description: 'Guard Laravel routes with the trace middleware' },
  { slug: 'java', title: 'Java', group: 'Server', tab: 'start', icon: 'brand:java', time: '5 minutes', description: 'Verify events in Spring or any JVM app with dev.trace:trace' },
  { slug: 'go', title: 'Go', group: 'Server', tab: 'start', icon: 'brand:go', time: '5 minutes', description: 'Verify events and guard net/http handlers with the Go SDK' },
  { slug: 'rails', title: 'Ruby and Rails', group: 'Server', tab: 'start', icon: 'brand:ruby', time: '5 minutes', description: 'Draft SDK: verify events in Rails or any Rack app' },
  { slug: 'dotnet', title: '.NET', group: 'Server', tab: 'start', icon: 'brand:dotnet', time: '5 minutes', description: 'Draft SDK: verify events and guard ASP.NET Core routes' },
  { slug: 'wordpress', title: 'WordPress', group: 'Server', tab: 'start', icon: 'brand:wordpress', time: '10 minutes', description: 'Protect login, registration, comments and WooCommerce checkout with a plugin' },
  { slug: 'embedded', title: 'Embedded mode', group: 'Embedded', tab: 'start', icon: 'box', time: '10 minutes', description: 'Run Trace inside your own backend on MongoDB or Postgres, with no separate server' },

  // Guides
  ...USE_CASE_PAGES,
  { slug: 'integration', title: 'Integration patterns', group: 'Integrate', tab: 'guides', icon: 'plug', description: 'First-party mode, consent, fail open or closed, webhooks' },
  { slug: 'self-hosting', title: 'Self-hosting', group: 'Run in production', tab: 'guides', icon: 'server', description: 'Deployment, TLS, secrets, IP data, backups, upgrades' },
  { slug: 'privacy', title: 'Privacy', group: 'Run in production', tab: 'guides', icon: 'eye-off', description: 'What Trace stores about visitors, and the controls for retention, deletion requests and consent' },
  { slug: 'security-checklist', title: 'Security checklist', group: 'Run in production', tab: 'guides', icon: 'shield', description: 'A checklist for hardening a self-hosted Trace deployment: keys, origins, webhooks, rate limits and production settings' },
  { slug: 'accuracy', title: 'Accuracy', group: 'Run in production', tab: 'guides', icon: 'gauge', description: 'Matching method, accuracy harness, learning weights' },

  // Reference
  { slug: 'browser-sdk', title: 'Browser SDK', group: 'SDKs', tab: 'reference', icon: 'globe', description: 'createClient options, get(), the result, errors and consent' },
  { slug: 'server-sdks', title: 'Server SDKs', group: 'SDKs', tab: 'reference', icon: 'terminal', description: 'Verify events, webhooks and sealed results in Node.js, Python, PHP and Java' },
  { slug: 'api', title: 'Server API', group: 'API', tab: 'reference', icon: 'braces', description: 'The Trace server API: endpoints, request and response shapes, and error codes' },
  { slug: 'signals', title: 'Signal catalog', group: 'API', tab: 'reference', icon: 'radar', description: 'Every fraud signal, how it is detected, false positives' },
  { slug: 'configuration', title: 'Configuration', group: 'API', tab: 'reference', icon: 'sliders', description: 'Every environment variable and the scoring file that configure the Trace server' },
];

/** Sidebar links that are not docs pages. */
export const DOC_LINKS: { tab: DocTab; group: string; title: string; href: string; icon: string }[] = [
  { tab: 'start', group: 'Getting started', title: 'Live demo', href: '/demo', icon: 'play-circle' },
];

/** Pages copied from the open-source repository (scripts/sync-docs.mjs); they get an "Edit on GitHub" link. */
export const OSS_SLUGS = new Set(['api', 'configuration', 'self-hosting', 'embedded', 'signals', 'privacy', 'security-checklist', 'accuracy', 'integration']);

export function docHref(slug: string): string {
  return slug ? `/docs/${slug}` : '/docs';
}
