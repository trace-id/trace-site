# Vue

This quickstart adds Trace to a Vue 3 app with `@trace-id/sdk-vue`. You install a plugin once, identify the visitor in a component, and send the `eventId` to your backend for verification. It works the same in Nuxt.

> [!NOTE]
> **Before you start**
> You need a running Trace server and a **public key** (`pk_...`) whose allowed origins include your app. The [quick start guide](quickstart.md) covers both.

## 1. Install the SDK

::: code-group
```sh [npm]
npm install @trace-id/sdk-vue
```
```sh [pnpm]
pnpm add @trace-id/sdk-vue
```
```sh [yarn]
yarn add @trace-id/sdk-vue
```
```sh [bun]
bun add @trace-id/sdk-vue
```
:::

## 2. Install the plugin

```ts
// main.ts
import { createApp } from 'vue';
import { createIdentify } from '@trace-id/sdk-vue';
import App from './App.vue';

createApp(App)
  .use(createIdentify({ apiKey: import.meta.env.VITE_TRACE_PUBLIC_KEY, endpoint: import.meta.env.VITE_TRACE_ENDPOINT }))
  .mount('#app');
```

In Nuxt, do the same in a client-only plugin (`plugins/trace.client.ts`) with `nuxtApp.vueApp.use(createIdentify({ ... }))`.

## 3. Identify on submit

`useVisitorData` returns refs: `data`, `error`, `isLoading`, and a `getData` function.

```vue
<!-- SignupForm.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useVisitorData } from '@trace-id/sdk-vue';

const email = ref('');
const { getData, isLoading } = useVisitorData({ immediate: false });

async function submit() {
  const result = await getData({ tags: { action: 'signup' } }); // null if Trace is unavailable
  await fetch('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.value, eventId: result?.eventId }),
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

`getData` never throws. On failure it resolves `null` and sets `error` to an `IdentifyError` with a `code`.

## 4. Verify on your server

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
- [Consent](integration.md#consent): useIdentifyClient().enable() after consent
:::
