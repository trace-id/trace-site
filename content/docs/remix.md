# Remix and React Router

This quickstart adds Trace to a Remix or React Router (framework mode) app. A provider and hook identify the visitor in the browser, and the route `action` verifies the event with your secret key.

> [!NOTE]
> **Before you start**
> You need a running Trace server, a **public key** (`pk_...`) whose allowed origins include your site, and a **secret key** (`sk_...`) for the server. The [quick start guide](quickstart.md) creates both.

## 1. Install the SDKs

::: code-group
```sh [npm]
npm install @trace-id/sdk-react @trace-id/sdk-node
```
```sh [pnpm]
pnpm add @trace-id/sdk-react @trace-id/sdk-node
```
```sh [yarn]
yarn add @trace-id/sdk-react @trace-id/sdk-node
```
```sh [bun]
bun add @trace-id/sdk-react @trace-id/sdk-node
```
:::

```dotenv
# .env
TRACE_PUBLIC_KEY=pk_...
TRACE_ENDPOINT=https://id.example.com
TRACE_SECRET_KEY=sk_...
```

## 2. Add the provider

Pass the public values from a loader so the browser gets them. Nothing runs during server rendering; collection starts in the browser.

```tsx
// app/root.tsx
import { IdentifyProvider } from '@trace-id/sdk-react';
import { Outlet, useLoaderData } from 'react-router'; // or '@remix-run/react'

export function loader() {
  return { traceKey: process.env.TRACE_PUBLIC_KEY!, traceEndpoint: process.env.TRACE_ENDPOINT! };
}

export default function App() {
  const { traceKey, traceEndpoint } = useLoaderData<typeof loader>();
  return (
    <IdentifyProvider apiKey={traceKey} endpoint={traceEndpoint}>
      <Outlet />
    </IdentifyProvider>
  );
}
```

## 3. Identify on submit

Identify first, then put the `eventId` into the form data you post.

```tsx
// app/routes/signup.tsx
import { useVisitorData } from '@trace-id/sdk-react';
import { useFetcher } from 'react-router';

export default function Signup() {
  const fetcher = useFetcher();
  const { getData, isLoading } = useVisitorData({ immediate: false });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = await getData({ tags: { action: 'signup' } }); // null if Trace is unavailable
    form.set('eventId', result?.eventId ?? '');
    fetcher.submit(form, { method: 'post' });
  }

  return (
    <fetcher.Form method="post" onSubmit={onSubmit}>
      <input name="email" type="email" required />
      <button disabled={isLoading || fetcher.state !== 'idle'}>Create account</button>
    </fetcher.Form>
  );
}
```

## 4. Verify in the action

`guardRequest` reads the event id from the form body (or a header or JSON body), verifies it, and leaves the request body readable for `formData()`.

```ts
// app/routes/signup.tsx
import { guardRequest } from '@trace-id/sdk-node/web';

export async function action({ request }: { request: Request }) {
  const guard = await guardRequest(request, {
    secretKey: process.env.TRACE_SECRET_KEY!,
    endpoint: process.env.TRACE_ENDPOINT!,
    failOpen: true,
    reject: (event) => event.suspectScore >= 60,
  });
  if (guard.response) return guard.response; // 400, 403, 503 or 500, with a JSON error body

  const form = await request.formData();
  // create the account for form.get('email'), and store guard.event?.visitorId with it
  return { ok: true };
}
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
