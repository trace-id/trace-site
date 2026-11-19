# Node.js

This quickstart verifies Trace events in a Node.js backend with `@trace-id/sdk-node`. The browser sends you an `eventId`; your server fetches the real event with a secret key and decides what to do.

> [!NOTE]
> **Before you start**
> You need a **secret key** (`sk_...`) from the dashboard's Keys page, and a frontend that already sends an `eventId` (see [JavaScript](javascript.md), [React](react.md) or [Next.js](nextjs.md)). Node.js 18.17 or later.

## 1. Install the SDK

::: code-group
```sh [npm]
npm install @trace-id/sdk-node
```
```sh [pnpm]
pnpm add @trace-id/sdk-node
```
```sh [yarn]
yarn add @trace-id/sdk-node
```
```sh [bun]
bun add @trace-id/sdk-node
```
:::

```dotenv
TRACE_SECRET_KEY=sk_...
TRACE_ENDPOINT=https://id.example.com
```

## 2. Verify the event

`verifyEvent` calls `GET /v1/events/:eventId` with your secret key and returns the full event. It works the same in Express, Fastify, NestJS, Hono or a plain handler.

```ts
import express from 'express';
import { verifyEvent } from '@trace-id/sdk-node';
import type { VerifyError } from '@trace-id/sdk-node/errors';

const app = express();
app.use(express.json());

app.post('/api/signup', async (req, res) => {
  const { email, eventId } = req.body;

  let event = null;
  try {
    event = await verifyEvent(eventId, {
      secretKey: process.env.TRACE_SECRET_KEY!,
      endpoint: process.env.TRACE_ENDPOINT!,
      timeoutMs: 1500,
    });
  } catch (err) {
    console.warn('Trace check skipped', (err as VerifyError).code); // fail open
  }

  // decide (next step)
});
```

### Or use a guard

If you would rather not write the try/catch yourself, `@trace-id/sdk-node` ships guards for the common frameworks. Each reads the event id from the `x-trace-event-id` header or the JSON body, verifies it, and exposes the verified event. Set `TRACE_SECRET_KEY` and `TRACE_ENDPOINT`, or pass `secretKey` and `endpoint`.

::: code-group
```ts [Express / Nest]
import { traceGuard } from '@trace-id/sdk-node/express';

app.post('/api/signup', traceGuard({ reject: (e) => e.suspectScore >= 60 }), (req, res) => {
  res.json({ visitor: req.trace?.visitorId });
});
```
```ts [Fastify]
import { traceHook } from '@trace-id/sdk-node/fastify';

app.post('/api/signup', { preHandler: traceHook({ reject: (e) => e.suspectScore >= 60 }) }, async (req) => {
  return { visitor: req.trace?.visitorId };
});
```
```ts [Hono / Remix / Workers]
import { guardRequest } from '@trace-id/sdk-node/web';

const guard = await guardRequest(request, { reject: (e) => e.suspectScore >= 60 });
if (guard.response) return guard.response;
// guard.event is the verified event
```
:::

The guard answers 400 for a missing or invalid event, 403 when `reject` returns true, 503 when Trace cannot be reached and 500 for a bad key or missing configuration. Pass `failOpen: true` to let requests through (with `event` null) when Trace is unreachable. A wrong key never fails open. Next.js has its own wrapper: see [Next.js](nextjs.md).

## 3. Decide

The event carries a `suspectScore` from 0 to 100, the `reasons` behind it, and every signal with `detected` and `details`.

```ts
if (event) {
  if (event.suspectScore >= 60) return res.status(403).json({ error: 'blocked' });
  if (event.signals.multiAccount.detected) return res.status(202).json({ next: 'verify-email' });
  if (event.suspectScore >= 25) console.info('review', event.visitorId, event.reasons);
}

const user = await createUser(email, { traceVisitorId: event?.visitorId });
res.json({ ok: true, id: user.id });
```

| Field | Use it for |
| --- | --- |
| `visitorId` | Stable id of this browser. Store it with the account. |
| `deviceId` | Shared by every browser on one device. Use it for bans and multi-accounting. |
| `suspectScore` | 0 to 100, the sum of detected signal weights, capped. |
| `reasons` | Which signals added how much, for logs and review screens. |
| `signals` | Every signal: `{ detected, details }`. See the [signal catalog](signals.md). |
| `confidence` | 0 to 1, how sure the match to a returning visitor is. |

Events can be verified for 60 minutes after they are created. After that `verifyEvent` throws with code `expired`.

> [!TIP]
> **Thresholds are yours**
> Trace scores; your app decides. The 25 and 60 above are a starting point. Run in shadow mode first (log, do not block) and tune on your own traffic.

## 4. Handle errors

`verifyEvent` throws a `VerifyError` whose `code` is one of `invalid_event_id`, `timeout`, `network`, `unauthorized`, `not_found`, `expired`, `rate_limited`, `server_error` or `invalid_response`. For sign-up and login, fail open: continue without the check. For payouts, fail closed. See [fail open or fail closed](integration.md#fail-open-or-fail-closed).

## Next steps

::: cards
- [Webhooks](integration.md#receiving-webhooks): Receive events with verifyWebhook instead of polling
- [Embedded mode](embedded.md): Run Trace inside this Node app, no separate server
- [Server SDKs reference](server-sdks.md): Sealed results and every option
:::
