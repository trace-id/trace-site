# Svelte

This quickstart adds Trace to a Svelte or SvelteKit app with `@trace-id/sdk-svelte`. The SDK is a Svelte store: create it once, read it with `$`, and call `getData` when the user acts.

> [!NOTE]
> **Before you start**
> You need a running Trace server and a **public key** (`pk_...`) whose allowed origins include your app. The [quick start guide](quickstart.md) covers both.

## 1. Install the SDK

::: code-group
```sh [npm]
npm install @trace-id/sdk-svelte
```
```sh [pnpm]
pnpm add @trace-id/sdk-svelte
```
```sh [yarn]
yarn add @trace-id/sdk-svelte
```
```sh [bun]
bun add @trace-id/sdk-svelte
```
:::

## 2. Create the store

Create it in a shared module so every component uses the same client.

```ts
// src/lib/trace.ts
import { createVisitorData } from '@trace-id/sdk-svelte';
import { PUBLIC_TRACE_ENDPOINT, PUBLIC_TRACE_KEY } from '$env/static/public';

export const visitor = createVisitorData({ apiKey: PUBLIC_TRACE_KEY, endpoint: PUBLIC_TRACE_ENDPOINT }, { immediate: false });
```

Outside SvelteKit, pass the values directly instead of importing them from `$env`.

## 3. Identify on submit

```svelte
<!-- SignupForm.svelte -->
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

The store holds `{ data, error, isLoading }`. Collection only runs in the browser, never during server rendering.

## 4. Verify on your server

In SvelteKit, verify in a `+server.ts` endpoint or a form action with [`@trace-id/sdk-node`](node.md). Other backends:

::: cards
- [Node.js](node.md) brand:nodedotjs: verifyEvent from @trace-id/sdk-node
- [Python](python.md) brand:python: Client.get_event from trace-device
- [PHP](php.md) brand:php: Client::getEvent from trace/trace
- [Java](java.md) brand:openjdk: getEvent from dev.trace:trace
:::

## Next steps

::: cards
- [New account fraud](new-account-fraud.md): Turn the verified event into a decision
- [Browser SDK reference](browser-sdk.md): Options, the result and every error code
:::
