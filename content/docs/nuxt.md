# Nuxt

This quickstart adds Trace to a Nuxt 3 app with the `@trace-id/sdk-nuxt` module. It sets up the client, a composable identifies the visitor, and a Nitro server route verifies the event with your secret key.

> [!NOTE]
> **Before you start**
> You need a running Trace server, a **public key** (`pk_...`) whose allowed origins include your site, and a **secret key** (`sk_...`) for the server. The [quick start guide](quickstart.md) creates both.

## 1. Install the module

::: code-group
```sh [npm]
npm install @trace-id/sdk-nuxt @trace-id/sdk-node
```
```sh [pnpm]
pnpm add @trace-id/sdk-nuxt @trace-id/sdk-node
```
```sh [yarn]
yarn add @trace-id/sdk-nuxt @trace-id/sdk-node
```
```sh [bun]
bun add @trace-id/sdk-nuxt @trace-id/sdk-node
```
:::

## 2. Register it

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@trace-id/sdk-nuxt'],
  trace: { apiKey: 'pk_...', endpoint: 'https://id.example.com' },
  runtimeConfig: {
    traceSecretKey: '', // NUXT_TRACE_SECRET_KEY, server only
  },
});
```

You can leave `apiKey` and `endpoint` out and set `NUXT_PUBLIC_TRACE_KEY` and `NUXT_PUBLIC_TRACE_ENDPOINT` instead. The module adds a client-only plugin, so collection only runs in the browser, and auto-imports `useVisitorData()` and `useIdentifyClient()`. Never put a secret key under `trace`; it is public config.

> [!NOTE]
> **Already using @trace-id/sdk-vue directly?**
> That still works: install the plugin yourself in a `plugins/trace.client.ts` with `createIdentify(...)`. The module is the shorter path.

## 3. Identify on submit

```vue
<!-- pages/signup.vue -->
<script setup lang="ts">
const email = ref('');
const { getData, isLoading } = useVisitorData({ immediate: false });

async function submit() {
  const result = await getData({ tags: { action: 'signup' } }); // null if Trace is unavailable
  await $fetch('/api/signup', {
    method: 'POST',
    headers: { 'x-trace-event-id': result?.eventId ?? '' },
    body: { email: email.value },
  });
}
</script>

<template>
  <form @submit.prevent="submit">
    <input v-model="email" type="email" required />
    <button :disabled="isLoading">Create account</button>
  </form>
</template>
```

## 4. Verify in a server route

```ts
// server/api/signup.post.ts
import { verifyEvent } from '@trace-id/sdk-node';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const eventId = getHeader(event, 'x-trace-event-id');

  let verified = null;
  if (eventId) {
    try {
      verified = await verifyEvent(eventId, {
        secretKey: config.traceSecretKey,
        endpoint: config.public.traceEndpoint,
        timeoutMs: 1500,
      });
    } catch (err) {
      console.warn('Trace check skipped', (err as { code?: string }).code); // fail open
    }
  }

  if (verified && verified.suspectScore >= 60) {
    throw createError({ statusCode: 403, statusMessage: 'blocked' });
  }

  const { email } = await readBody(event);
  // create the account, and store verified?.visitorId with it for later lookups
  return { ok: true };
});
```

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
