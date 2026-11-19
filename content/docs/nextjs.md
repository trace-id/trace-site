# Next.js

This quickstart adds Trace to a Next.js App Router project. A client component identifies the visitor, and a route handler verifies the event with your secret key before deciding.

> [!NOTE]
> **Before you start**
> You need a running Trace server, a **public key** (`pk_...`) that allows your site's origin, and a **secret key** (`sk_...`) for the server. The [quick start guide](quickstart.md) creates both. Prefer no separate server? Mount Trace inside this app with [embedded mode](embedded.md) and verify with `trace.verify()` instead.

## 1. Install the SDKs

`@trace-id/sdk-next` bundles both halves: `/client` runs in the browser and `/server` verifies on the server.

::: code-group
```sh [npm]
npm install @trace-id/sdk-next
```
```sh [pnpm]
pnpm add @trace-id/sdk-next
```
```sh [yarn]
yarn add @trace-id/sdk-next
```
```sh [bun]
bun add @trace-id/sdk-next
```
:::

```dotenv
# .env.local
NEXT_PUBLIC_TRACE_PUBLIC_KEY=pk_...
NEXT_PUBLIC_TRACE_ENDPOINT=https://id.example.com
TRACE_SECRET_KEY=sk_...
TRACE_ENDPOINT=https://id.example.com
```

Only the `NEXT_PUBLIC_` values reach the browser. Keep the secret key without that prefix.

## 2. Add the provider

The provider is a client component, so give it its own file and use it in the root layout.

```tsx
// app/providers.tsx
'use client';

import { IdentifyProvider } from '@trace-id/sdk-next/client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <IdentifyProvider apiKey={process.env.NEXT_PUBLIC_TRACE_PUBLIC_KEY!} endpoint={process.env.NEXT_PUBLIC_TRACE_ENDPOINT!}>
      {children}
    </IdentifyProvider>
  );
}
```

```tsx
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

Nothing runs during server rendering; collection starts in the browser.

## 3. Identify on submit

```tsx
// app/signup/signup-form.tsx
'use client';

import { useVisitorData } from '@trace-id/sdk-next/client';

export function SignupForm() {
  const { getData, isLoading } = useVisitorData({ immediate: false });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = await getData({ tags: { action: 'signup' } });
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.get('email'), eventId: result?.eventId }),
    });
    // handle res: 200 created, 202 needs verification, 403 blocked
  }

  return (
    <form onSubmit={onSubmit}>
      <input name="email" type="email" required />
      <button disabled={isLoading}>Create account</button>
    </form>
  );
}
```

## 4. Verify in a route handler

`withTrace` reads the event id from the `x-trace-event-id` header or the JSON body, verifies it with `TRACE_SECRET_KEY` and `TRACE_ENDPOINT`, and runs your handler only if the event is valid. You decide with the verified event.

```ts
// app/api/signup/route.ts
import { withTrace } from '@trace-id/sdk-next/server';

export const POST = withTrace(
  async (req, { event }) => {
    const { email } = await req.json();

    if (event && event.suspectScore >= 60) {
      return Response.json({ error: 'blocked' }, { status: 403 });
    }
    if (event?.signals.multiAccount.detected) {
      // many accounts from this device: ask for email or phone verification first
      return Response.json({ next: 'verify-email' }, { status: 202 });
    }

    // create the account, and store event?.visitorId with it for later lookups
    return Response.json({ ok: true });
  },
  { failOpen: true, timeoutMs: 1500 },
);
```

Without `failOpen`, requests get a 503 when Trace cannot be reached; with it they continue and `event` is `null`. A wrong secret key never fails open. To decide inside the guard instead, pass `reject: (event) => event.suspectScore >= 60` and `withTrace` answers 403 for you. For server actions or custom flows, call `verifyEvent` from `@trace-id/sdk-next/server` directly.

> [!TIP]
> **Start in shadow mode**
> For the first week, log `event.suspectScore` and `event.reasons` instead of blocking. Look at who would have been blocked, then pick your thresholds. The numbers above are a starting point, not defaults.

## Next steps

::: cards
- [New account fraud](new-account-fraud.md): The full sign-up decision, step by step
- [Server SDKs reference](server-sdks.md): verifyEvent options and error codes
- [First-party mode](integration.md#first-party-mode): Serve Trace from your own domain
:::
