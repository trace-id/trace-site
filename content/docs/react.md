# React

This quickstart adds Trace to a React app with `@trace-id/sdk-react`. You wrap the app in a provider, identify the visitor when they submit a form, and send the `eventId` to your backend for verification.

> [!NOTE]
> **Before you start**
> You need a running Trace server and a **public key** (`pk_...`) whose allowed origins include your app's URL (for example `http://localhost:5173`). The [quick start guide](quickstart.md) covers both.

## 1. Install the SDK

::: code-group
```sh [npm]
npm install @trace-id/sdk-react
```
```sh [pnpm]
pnpm add @trace-id/sdk-react
```
```sh [yarn]
yarn add @trace-id/sdk-react
```
```sh [bun]
bun add @trace-id/sdk-react
```
:::

## 2. Add the provider

Wrap your app once, near the root. The provider creates a single client for every component below it.

```tsx
// main.tsx
import { createRoot } from 'react-dom/client';
import { IdentifyProvider } from '@trace-id/sdk-react';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <IdentifyProvider apiKey={import.meta.env.VITE_TRACE_PUBLIC_KEY} endpoint={import.meta.env.VITE_TRACE_ENDPOINT}>
    <App />
  </IdentifyProvider>,
);
```

```dotenv
VITE_TRACE_PUBLIC_KEY=pk_...
VITE_TRACE_ENDPOINT=https://id.example.com
```

## 3. Identify on submit

`useVisitorData` returns `{ data, error, isLoading, getData }`. With `immediate: false` nothing runs until you call `getData`, which is what you want for a form.

```tsx
// SignupForm.tsx
import { useVisitorData } from '@trace-id/sdk-react';

export function SignupForm() {
  const { getData, isLoading } = useVisitorData({ immediate: false });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = await getData({ tags: { action: 'signup' } }); // null if Trace is unavailable
    await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...Object.fromEntries(form), eventId: result?.eventId }),
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <input name="email" type="email" required />
      <button disabled={isLoading}>Create account</button>
    </form>
  );
}
```

`getData` never throws. On failure it resolves `null` and sets `error`, an `IdentifyError` with a `code` such as `timeout` or `origin_not_allowed`.

> [!TIP]
> **Show the visitor id while you build**
> Leave `immediate` at its default (`true`) on a test page and render `data?.visitorId`. Open the page in a private window: the id stays the same.

## 4. Verify on your server

Never act on what the browser sends. Your backend fetches the event with a secret key:

::: cards
- [Node.js](node.md) brand:nodedotjs: verifyEvent from @trace-id/sdk-node
- [Python](python.md) brand:python: Client.get_event from trace-device
- [PHP](php.md) brand:php: Client::getEvent from trace/trace
- [Java](java.md) brand:openjdk: getEvent from dev.trace:trace
:::

## Next steps

::: cards
- [Next.js](nextjs.md) brand:nextdotjs: The same flow with a route handler for verification
- [Browser SDK reference](browser-sdk.md): Options, the result and every error code
- [Consent](integration.md#consent): Start disabled with useIdentifyClient().enable()
:::
