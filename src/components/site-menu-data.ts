import { DOC_PAGES, docHref } from '@/lib/docs-nav';
import { INDUSTRIES, USE_CASES } from '@/lib/use-cases';

/* Link data for the header mega menus, the mobile sheet and the footer. Everything is derived from the real route sources. */

export interface MenuLink {
  href: string;
  title: string;
  note?: string;
  /** Icon key for PageIcon. */
  icon?: string;
  /** One line shown in featured rows. */
  desc?: string;
}
export interface MenuGroup {
  title: string;
  links: MenuLink[];
}

const CATEGORIES = ['Abuse and fraud', 'Security and payments', 'Revenue protection'] as const;

export const USE_CASE_GROUPS: MenuGroup[] = CATEGORIES.map((c) => ({
  title: c,
  links: USE_CASES.filter((u) => u.category === c).map((u) => ({ href: `/use-cases/${u.slug}`, title: u.title, icon: u.icon, desc: u.short })),
})).filter((g) => g.links.length > 0);

export const INDUSTRY_GROUP: MenuGroup = {
  title: 'By industry',
  links: INDUSTRIES.map((i) => ({ href: `/industries/${i.slug}`, title: i.title, icon: i.icon, desc: i.text })),
};

const page = (slug: string): MenuLink | null => {
  const p = DOC_PAGES.find((d) => d.slug === slug);
  return p ? { href: docHref(p.slug), title: p.title, note: p.time, icon: p.icon, desc: p.description } : null;
};
const pages = (slugs: string[]) => slugs.map(page).filter((x): x is MenuLink => x !== null);

export const DOC_GROUPS: MenuGroup[] = [
  { title: 'Start', links: [...pages(['quickstart', 'overview', 'agents', 'embedded']), { href: '/demo', title: 'Live demo' }] },
  { title: 'Browser and mobile', links: pages(['javascript', 'react', 'nextjs', 'vue', 'svelte', 'angular', 'react-native']) },
  { title: 'Server', links: pages(['node', 'python', 'php', 'java']) },
  { title: 'Reference', links: pages(['browser-sdk', 'server-sdks', 'api', 'signals', 'configuration']) },
  { title: 'Run in production', links: pages(['self-hosting', 'privacy', 'security-checklist', 'accuracy', 'integration']) },
].filter((g) => g.links.length > 0);

/** Featured rows at the left of the dropdowns. */
export const FEATURED_DOCS: MenuLink[] = [
  ...pages(['quickstart', 'agents']),
  { href: '/demo', title: 'Live demo', icon: 'play-circle', desc: 'See your own visitor ID and signals on a real server' },
];
export const FEATURED_USE_CASES: MenuLink[] = ['new-account-fraud', 'account-takeover', 'bot-detection']
  .map((slug) => USE_CASES.find((u) => u.slug === slug))
  .filter((u): u is (typeof USE_CASES)[number] => !!u)
  .map((u) => ({ href: `/use-cases/${u.slug}`, title: u.title, icon: u.icon, desc: u.short }));
