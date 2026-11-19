import type { MetadataRoute } from 'next';
import { DOC_PAGES } from '@/lib/docs-nav';
import { SITE_URL } from '@/lib/site';
import { LEGAL_PAGES } from '@/lib/legal';
import { INDUSTRIES, USE_CASES } from '@/lib/use-cases';

export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number, changeFrequency: 'weekly' | 'monthly' = 'monthly') => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  });
  return [
    page('/', 1, 'weekly'),
    page('/demo', 0.8),
    page('/use-cases', 0.9, 'weekly'),
    ...USE_CASES.map((u) => page(`/use-cases/${u.slug}`, 0.8)),
    ...INDUSTRIES.map((i) => page(`/industries/${i.slug}`, 0.7)),
    page('/docs', 0.9, 'weekly'),
    ...DOC_PAGES.map((p) => page(`/docs/${p.slug}`, p.tab === 'start' ? 0.8 : 0.6)),
    ...LEGAL_PAGES.map((p) => ({ ...page(`/${p.slug}`, 0.3), lastModified: new Date(p.updated) })),
  ];
}
