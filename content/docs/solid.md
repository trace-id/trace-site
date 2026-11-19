# Solid

This quickstart adds Trace to a SolidJS or SolidStart app with `@trace-id/sdk-solid`. You wrap the app in a provider once, read signals in a component, and send the `eventId` to your backend for verification.

> [!NOTE]
> **Before you start**
> You need a running Trace server and a **public key** (`pk_...`) whose allowed origins include your app. The [quick start guide](quickstart.md) covers both.

## 1. Install the SDK

::: code-group
```sh [npm]
npm install @trace-id/sdk-solid
```
```sh [pnpm]
pnpm add @trace-id/sdk-solid
```
```sh [yarn]
yarn add @trace-id/sdk-solid
```
```sh [bun]
bun add @trace-id/sdk-solid
```
:::

## 2. Add the provider

```tsx
// src/index.tsx
import { render } from 'solid-js/web';
import { IdentifyProvider } from '@trace-id/sdk-solid';
import App from './App';

render(
  () => (
    <IdentifyProvider apiKey={import.meta.env.VITE_TRACE_PUBLIC_KEY} endpoint={import.meta.env.VITE_TRACE_ENDPOINT}>
      <App />
    </IdentifyProvider>
  ),
  document.getElementById('root')!,
);
```

In SolidStart, put the provider in `app.tsx`. Nothing runs during server rendering; collection starts in the browser.

## 3. Identify on submit

`createVisitorData` returns `data`, `error` and `isLoading` as signals, and `getData()` to identify on demand. Call it in a component body.

```tsx
// SignupForm.tsx
import { createSignal } from 'solid-js';
import { createVisitorData } from '@trace-id/sdk-solid';

export function SignupForm() {
  const [email, setEmail] = createSignal('');
  const visitor = createVisitorData({ immediate: false });

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    const result = await visitor.getData({ tags: { action: 'signup' } }); // null if Trace is unavailable
    await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email(), eventId: result?.eventId }),
    });
  }

  return (
    <form onSubmit={submit}>
      <input type="email" required value={email()} onInput={(e) => setEmail(e.currentTarget.value)} />
      <button disabled={visitor.isLoading()}>Create account</button>
    </form>
  );
}
```

`getData` never throws. On failure it resolves `null` and `error()` holds an `IdentifyError` with a `code`. Use `useIdentifyClient()` for consent toggles (`enable()`, `disable(true)`).

## 4. Verify on your server

::: cards
- [Node.js](node.md) brand:nodedotjs: verifyEvent and Express/Fastify guards
- [Python](python.md) brand:python: Client.get_event from trace-device
- [PHP](php.md) brand:php: Client::getEvent from trace/trace
- [Go](go.md) brand:go: GetEvent and a net/http guard
:::

## Next steps

::: cards
- [New account fraud](new-account-fraud.md): Turn the verified event into a decision
- [Browser SDK reference](browser-sdk.md): Options, the result and every error code
:::
