import { demoConfigured, traceConfig } from '@/lib/trace';

export const dynamic = 'force-dynamic';

/** The device graph (browsers and accounts on one device), read with the secret key. */
export async function GET(req: Request) {
  if (!demoConfigured()) return Response.json({ message: 'Demo not configured' }, { status: 503 });
  const deviceId = new URL(req.url).searchParams.get('deviceId') ?? '';
  if (!/^[0-9A-Za-z]{20}$/.test(deviceId)) return Response.json({ message: 'Invalid deviceId' }, { status: 400 });
  const c = traceConfig();
  try {
    const res = await fetch(`${c.apiUrl}/v1/devices/${deviceId}`, {
      headers: { Authorization: `Bearer ${c.secretKey}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });
    return new Response(await res.text(), { status: res.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ message: 'Trace server unreachable' }, { status: 502 });
  }
}
