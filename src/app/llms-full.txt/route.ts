import { llmsFull } from '@/lib/docs';

export const dynamic = 'force-static';

/** Every docs page in one plain-text file, for language models. */
export async function GET() {
  return new Response(await llmsFull(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
