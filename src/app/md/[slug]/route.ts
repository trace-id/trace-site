import { DOC_PAGES, readDoc } from '@/lib/docs';
import { absoluteUrl } from '@/lib/seo';

/** Plain Markdown of a docs page, served at /docs/<slug>.md (rewrite in next.config) for language models and "Copy page". */
export const dynamicParams = false;

export function generateStaticParams() {
  return DOC_PAGES.map((p) => ({ slug: p.slug }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!DOC_PAGES.some((p) => p.slug === slug)) return new Response('Not found', { status: 404 });
  const md = (await readDoc(slug)).replace(/^---[\s\S]*?---\n/, '');
  return new Response(md, { headers: {
    'Content-Type': 'text/markdown; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
    // The Markdown copy is for tools and language models; search engines should index the HTML page.
    'X-Robots-Tag': 'noindex',
    Link: `<${absoluteUrl(`/docs/${slug}`)}>; rel="canonical"`,
  } });
}
