import { demoConfigured, traceConfig } from '@/lib/trace';

export const dynamic = 'force-dynamic';

/** What the browser needs to run the SDK: never the secret key. */
export function GET() {
  if (!demoConfigured()) return Response.json({ error: 'The demo is not configured on this deployment.' }, { status: 503 });
  const c = traceConfig();
  return Response.json({ apiKey: c.publicKey, endpoint: c.endpoint }, { headers: { 'Cache-Control': 'no-store' } });
}
