import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';
import { GITHUB_ORG_URL, GITHUB_URL, NPM_URL } from '@/lib/trace';

export const SITE_NAME = 'Trace';
export const SITE_TAGLINE = 'Open-source device identification you run yourself';
export const SITE_DESCRIPTION =
  'Trace recognises returning devices across private windows and browsers, and scores every signup, login and checkout with reasons. Open source, self-hosted.';
export const SITE_KEYWORDS = [
  'device identification', 'browser fingerprinting', 'fraud detection', 'bot detection', 'visitor identification',
  'account takeover', 'new account fraud', 'open source', 'self-hosted', 'fingerprint alternative',
];

export const absoluteUrl = (path: string): string => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

/** The repository URL, or null when it is the placeholder default (so we never publish a link that is not ours). */
export const repoUrl = (): string | null => (GITHUB_URL.replace(/\/+$/, '') === 'https://github.com' ? null : GITHUB_URL.replace(/\/+$/, ''));

interface PageMeta {
  title: string;
  description: string;
  /** Path starting with "/". Becomes the canonical URL and og:url. */
  path: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  /** Social card path. Defaults to the nearest opengraph-image. */
  image?: string;
}

/** Title, description, canonical and Open Graph/Twitter tags for a page. The image comes from the nearest opengraph-image. */
export function pageMetadata({ title, description, path, type = 'website', noindex, image = '/opengraph-image' }: PageMeta): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type, title, description, url: path, siteName: SITE_NAME, locale: 'en_US', images: [{ url: image, width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Structured data. The JSON is escaped so a "</script>" in content can never end the tag early. */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const esc = (code: string) => '\\u' + code;
  const json = JSON.stringify(data).split('<').join(esc('003c')).split(String.fromCharCode(0x2028)).join(esc('2028')).split(String.fromCharCode(0x2029)).join(esc('2029'));
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export function breadcrumbLd(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}

export function organizationLd(): Record<string, unknown> {
  const repo = repoUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/icon.svg'),
    description: SITE_DESCRIPTION,
    ...(repo ? { sameAs: [repo, GITHUB_ORG_URL, NPM_URL] } : {}),
  };
}

export function websiteLd(): Record<string, unknown> {
  return { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: SITE_URL, description: SITE_DESCRIPTION, inLanguage: 'en' };
}

export function softwareLd(): Record<string, unknown> {
  const repo = repoUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'SecurityApplication',
    operatingSystem: 'Linux, macOS, Windows (Docker)',
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    license: 'https://www.gnu.org/licenses/agpl-3.0.html',
    ...(repo ? { codeRepository: repo, downloadUrl: repo } : {}),
  };
}

export function articleLd(a: { title: string; description: string; path: string; updated?: string }): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: a.title,
    description: a.description,
    url: absoluteUrl(a.path),
    mainEntityOfPage: absoluteUrl(a.path),
    inLanguage: 'en',
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    ...(a.updated ? { dateModified: a.updated } : {}),
  };
}

export function faqLd(items: { q: string; a: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })),
  };
}
