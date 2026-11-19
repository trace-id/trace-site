# Express

This quickstart verifies Trace events in an Express app with the `traceGuard` middleware from `@trace-id/sdk-node`.

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
```sh [yarn]
yarn add @trace-id/sdk-node
```
:::

```dotenv
TRACE_SECRET_KEY=sk_...
TRACE_ENDPOINT=https://id.example.com
```

## 2. Guard a route

Mount the guard after your body parsers so it can read the event id from the parsed body. It also reads the `x-trace-event-id` header. On success it sets `req.trace` to the server-verified event.

```ts
import express from 'express';
import { traceGuard } from '@trace-id/sdk-node/express';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // for plain HTML forms

app.post(
  '/api/signup',
  traceGuard({ failOpen: true, reject: (event) => event.suspectScore >= 60 }),
  (req, res) => {
    const event = req.trace; // null only with failOpen when Trace was unreachable
    // create the account, and store event?.visitorId with it for later lookups
    res.json({ ok: true });
  },
);
```

The guard answers 400 for a missing or invalid event, 403 when `reject` says so, 503 when Trace cannot be reached and 500 for a bad key or missing configuration. `failOpen: true` lets requests through (with the event `null`) when Trace is unreachable. A wrong key never fails open.

For TypeScript, tell Express about `req.trace`:

```ts
import type { EventResponse } from '@trace-id/signals/api';

declare global {
  namespace Express {
    interface Request {
      trace?: EventResponse | null;
    }
  }
}
```

## 3. Decide yourself instead

If you want full control, call `verifyEvent` in the handler and decide there. See the [Node.js guide](node.md).

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
