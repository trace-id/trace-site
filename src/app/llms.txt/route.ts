import { llmsIndex } from '@/lib/docs';

export const dynamic = 'force-static';

/** https://llmstxt.org: an index of the docs for language models. */
export async function GET() {
  const site = (process.env.SITE_URL ?? '').replace(/\/+$/, '');
  return new Response(await llmsIndex(site), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
