import { DOC_PAGES } from '@/lib/docs';
import { ogCard } from '@/lib/og';

/** Social card for a docs page. A route handler (not opengraph-image) because the docs live under a catch-all segment. */
export const dynamicParams = false;

export function generateStaticParams() {
  return DOC_PAGES.map((p) => ({ slug: p.slug }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = DOC_PAGES.find((p) => p.slug === slug);
  if (!page) return new Response('Not found', { status: 404 });
  return ogCard({ eyebrow: `Docs · ${page.group}`, title: page.title, subtitle: page.description });
}
