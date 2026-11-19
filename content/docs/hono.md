# Hono

This quickstart verifies Trace events in a Hono app with `guardRequest` from `@trace-id/sdk-node`. It works on Node.js, Bun, Deno and Cloudflare Workers because it only uses the standard `Request` and `Response`.

> [!NOTE]
> **Before you start**
> You need a **secret key** (`sk_...`) from the dashboard's Keys page and a frontend that sends an `eventId` (see the [Web quickstarts](javascript.md)). Send it in the `x-trace-event-id` header or as `eventId` in the request body.

## 1. Install the SDK

::: code-group
```sh [npm]
npm install @trace-id/sdk-node
```
```sh [pnpm]
pnpm add @trace-id/sdk-node
```
```sh [bun]
bun add @trace-id/sdk-node
```
:::

On Workers, set `TRACE_SECRET_KEY` and `TRACE_ENDPOINT` as secrets and pass them as options (shown below), since the guard cannot read `process.env` there.

## 2. Add a middleware

```ts
import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { guardRequest } from '@trace-id/sdk-node/web';
import type { EventResponse } from '@trace-id/signals/api';

type Env = {
  Bindings: { TRACE_SECRET_KEY: string; TRACE_ENDPOINT: string };
  Variables: { trace: EventResponse | null };
};

const trace = createMiddleware<Env>(async (c, next) => {
  const guard = await guardRequest(c.req.raw, {
    secretKey: c.env.TRACE_SECRET_KEY,
    endpoint: c.env.TRACE_ENDPOINT,
    failOpen: true,
    reject: (event) => event.suspectScore >= 60,
  });
  if (guard.response) return guard.response; // 400, 403, 503 or 500, with a JSON error body
  c.set('trace', guard.event);
  await next();
});

const app = new Hono<Env>();

app.post('/api/signup', trace, async (c) => {
  const { email } = await c.req.json(); // the body is still readable
  const event = c.get('trace'); // null only with failOpen when Trace was unreachable
  // create the account, and store event?.visitorId with it for later lookups
  return c.json({ ok: true });
});

export default app;
```

The guard reads the event id from the `x-trace-event-id` header, a JSON body or a form body. The guard answers 400 for a missing or invalid event, 403 when `reject` says so, 503 when Trace cannot be reached and 500 for a bad key or missing configuration. `failOpen: true` lets requests through (with the event `null`) when Trace is unreachable. A wrong key never fails open.

> [!TIP]
> **Start in shadow mode**
> For the first week, log `event.suspectScore` and `event.reasons` instead of rejecting. Look at who would have been blocked, then pick thresholds you trust.

## Frontends

::: cards
- [JavaScript](javascript.md) brand:javascript: The browser SDK for any site
- [React](react.md) brand:react: IdentifyProvider and useVisitorData
- [Vue](vue.md) brand:vuedotjs: Plugin and composable
- [Next.js](nextjs.md) brand:nextdotjs: Provider and route guard
:::

## Next steps

::: cards
- [New account fraud](new-account-fraud.md): Turn the verified event into a decision
- [Server SDKs reference](server-sdks.md): Options and error codes for every language
:::
