# SvelteKit

This quickstart adds Trace to a SvelteKit app. A store from `@trace-id/sdk-svelte` identifies the visitor in the browser, and a `+server.ts` endpoint verifies the event with your secret key.

> [!NOTE]
> **Before you start**
> You need a running Trace server, a **public key** (`pk_...`) whose allowed origins include your site, and a **secret key** (`sk_...`) for the server. The [quick start guide](quickstart.md) creates both.

## 1. Install the SDKs

::: code-group
```sh [npm]
npm install @trace-id/sdk-svelte @trace-id/sdk-node
```
```sh [pnpm]
pnpm add @trace-id/sdk-svelte @trace-id/sdk-node
```
```sh [yarn]
yarn add @trace-id/sdk-svelte @trace-id/sdk-node
```
```sh [bun]
bun add @trace-id/sdk-svelte @trace-id/sdk-node
```
:::

```dotenv
# .env
PUBLIC_TRACE_KEY=pk_...
PUBLIC_TRACE_ENDPOINT=https://id.example.com
TRACE_SECRET_KEY=sk_...
```

Only `PUBLIC_` values reach the browser.

## 2. Create the store

```ts
// src/lib/trace.ts
import { createVisitorData } from '@trace-id/sdk-svelte';
import { PUBLIC_TRACE_ENDPOINT, PUBLIC_TRACE_KEY } from '$env/static/public';

export const visitor = createVisitorData({ apiKey: PUBLIC_TRACE_KEY, endpoint: PUBLIC_TRACE_ENDPOINT }, { immediate: false });
```

Collection only runs in the browser, never during server rendering.

## 3. Identify on submit

```svelte
<!-- src/routes/signup/+page.svelte -->
<script lang="ts">
  import { visitor } from '$lib/trace';

  let email = '';

  async function submit() {
    const result = await visitor.getData({ tags: { action: 'signup' } }); // null if Trace is unavailable
    await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, eventId: result?.eventId }),
    });
  }
</script>

<form on:submit|preventDefault={submit}>
  <input bind:value={email} type="email" required />
  <button disabled={$visitor.isLoading}>Create account</button>
</form>
```

## 4. Verify in an endpoint

```ts
// src/routes/api/signup/+server.ts
import { PUBLIC_TRACE_ENDPOINT } from '$env/static/public';
import { TRACE_SECRET_KEY } from '$env/static/private';
import { guardRequest } from '@trace-id/sdk-node/web';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
  const guard = await guardRequest(request, {
    secretKey: TRACE_SECRET_KEY,
    endpoint: PUBLIC_TRACE_ENDPOINT,
    failOpen: true,
    reject: (event) => event.suspectScore >= 60,
  });
  if (guard.response) return guard.response; // 400, 403, 503 or 500, with a JSON error body

  const { email } = await request.json();
  // create the account, and store guard.event?.visitorId with it for later lookups
  return json({ ok: true });
}
```

For a form action instead, read the id from the form data and call `verifyEvent` from `@trace-id/sdk-node` directly, then return `fail(400)` or `fail(403)` as needed.

> [!TIP]
> **Start in shadow mode**
> For the first week, log `event.suspectScore` and `event.reasons` instead of blocking. Look at who would have been blocked, then pick thresholds you trust.

## 5. Other backends

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
