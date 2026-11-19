# Astro

This quickstart adds Trace to an Astro site. A script in the page identifies the visitor, and an API endpoint verifies the event with your secret key before deciding.

> [!NOTE]
> **Before you start**
> You need a running Trace server, a **public key** (`pk_...`) whose allowed origins include your site, and a **secret key** (`sk_...`) for the server. The [quick start guide](quickstart.md) creates both.

## 1. Install the SDKs

`@trace-id/sdk-js` runs in the browser; `@trace-id/sdk-node` verifies on the server.

::: code-group
```sh [npm]
npm install @trace-id/sdk-js @trace-id/sdk-node
```
```sh [pnpm]
pnpm add @trace-id/sdk-js @trace-id/sdk-node
```
```sh [yarn]
yarn add @trace-id/sdk-js @trace-id/sdk-node
```
```sh [bun]
bun add @trace-id/sdk-js @trace-id/sdk-node
```
:::

```dotenv
# .env
PUBLIC_TRACE_KEY=pk_...
PUBLIC_TRACE_ENDPOINT=https://id.example.com
TRACE_SECRET_KEY=sk_...
```

Only `PUBLIC_` values reach the browser. Keep the secret key without that prefix. API endpoints need an on-demand rendering adapter (for example `@astrojs/node`).

## 2. Identify on submit

```astro
---
// src/pages/signup.astro
---
<form id="signup">
  <input name="email" type="email" required />
  <button>Create account</button>
</form>

<script>
  import { createClient } from '@trace-id/sdk-js';

  const trace = createClient({
    apiKey: import.meta.env.PUBLIC_TRACE_KEY,
    endpoint: import.meta.env.PUBLIC_TRACE_ENDPOINT,
  });

  document.querySelector('#signup')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    let eventId: string | null = null;
    try {
      ({ eventId } = await trace.get({ tags: { action: 'signup' } }));
    } catch (err) {
      console.warn('Trace unavailable', (err as { code?: string }).code); // keep going without it
    }
    await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...Object.fromEntries(new FormData(form)), eventId }),
    });
  });
</script>
```

## 3. Verify in an endpoint

`guardRequest` reads the event id from the `x-trace-event-id` header, a JSON body or a form body, verifies it, and hands you the verified event or a ready response. The request body stays readable afterwards.

```ts
// src/pages/api/signup.ts
import type { APIRoute } from 'astro';
import { guardRequest } from '@trace-id/sdk-node/web';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const guard = await guardRequest(request, {
    secretKey: import.meta.env.TRACE_SECRET_KEY,
    endpoint: import.meta.env.PUBLIC_TRACE_ENDPOINT,
    failOpen: true,
    reject: (event) => event.suspectScore >= 60,
  });
  if (guard.response) return guard.response; // 400, 403, 503 or 500, with a JSON error body

  const { email } = await request.json();
  // create the account, and store guard.event?.visitorId with it for later lookups
  return Response.json({ ok: true });
};
```

> [!TIP]
> **Start in shadow mode**
> For the first week, log `event.suspectScore` and `event.reasons` instead of blocking. Look at who would have been blocked, then pick thresholds you trust.

## 4. Other backends

::: cards
- [Node.js](node.md) brand:nodedotjs: verifyEvent and Express/Fastify guards
- [Python](python.md) brand:python: Client.get_event and framework guards
- [PHP](php.md) brand:php: Client::getEvent and a Laravel middleware
- [Go](go.md) brand:go: GetEvent and a net/http guard
:::

## Next steps

::: cards
- [New account fraud](new-account-fraud.md): Turn the verified event into a decision
- [Browser SDK reference](browser-sdk.md): Options, the result and every error code
:::
