import { demoConfigured, traceConfig } from '@/lib/trace';

export const dynamic = 'force-dynamic';

const EVENT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Plays the customer's backend: reads the verified event with the secret key, exactly as an integration would. */
export async function POST(req: Request) {
  if (!demoConfigured()) return Response.json({ code: 'not_configured', message: 'Demo not configured' }, { status: 503 });
  const body = (await req.json().catch(() => null)) as { eventId?: unknown } | null;
  const eventId = typeof body?.eventId === 'string' ? body.eventId : '';
  if (!EVENT_ID.test(eventId)) return Response.json({ code: 'invalid_event_id', message: 'Invalid eventId' }, { status: 400 });
  const c = traceConfig();
  try {
    const res = await fetch(`${c.apiUrl}/v1/events/${eventId}`, {
      headers: { Authorization: `Bearer ${c.secretKey}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });
    const json = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
    if (!res.ok) return Response.json({ code: json?.error?.code ?? 'error', message: json?.error?.message ?? `HTTP ${res.status}` }, { status: res.status });
    return Response.json(json, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ code: 'network', message: 'Trace server unreachable' }, { status: 502 });
  }
}
