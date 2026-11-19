# Embedded mode

Run Trace inside the backend you already have, with no separate server or database. `@trace-id/embed` is the same
identification engine as the standalone server, packaged as a library: you give it your database and mount one route.

| | Embedded (`@trace-id/embed`) | Standalone server |
| --- | --- | --- |
| Runs | Inside your app's process | Its own service (Docker) |
| Storage | Your MongoDB or Postgres, in `trace_` collections or tables | Its own Postgres |
| Browser endpoint | Your API, for example `https://api.yourapp.com/trace` | `https://id.yourapp.com` |
| Verify on your server | `await trace.verify(eventId)`, an in-process call | `GET /v1/events/:id` with a secret key |
| Push events | `onEvent` callback | Signed webhooks |
| Dashboard and MCP | Your own tools | Included |
| Multiple projects | One app per instance | Many projects |

Choose embedded when you want Trace to be part of an app you already run. Choose the server when you want a
self-contained service with its own dashboard, or several apps sharing one Trace.

## Set up

```ts
import { createTrace } from '@trace-id/embed';
import { mongoStorage } from '@trace-id/embed/mongo';

export const trace = createTrace({ storage: mongoStorage(db), secret: process.env.TRACE_SECRET! });
```

`secret` must be at least 32 random characters and stay the same across restarts: it signs visitor tokens. Changing it
makes returning visitors look new until their device traits match again.

Mount the browser route on your framework:

| Framework | Mount |
| --- | --- |
| Express, Connect | `app.use(toNodeHandler(trace))` (`@trace-id/embed/node`) |
| Fastify, NestJS on Fastify | `registerFastify(fastifyInstance, trace)` (`@trace-id/embed/fastify`) |
| NestJS on Express | `app.use(toNodeHandler(trace))` |
| Next.js, Hono, Bun, Deno, Remix, SvelteKit | `toFetchHandler(trace)` (`@trace-id/embed/fetch`) |

Then point the browser SDK at it, `endpoint: 'https://api.yourapp.com/trace'`, and verify on your server with
`trace.verify(eventId)`. See [integration.md](integration.md) for where to identify and how to decide.

> [!IMPORTANT]
> Configure your framework's trusted proxy setting. Trace reads the client IP from it for VPN, datacenter and
> cross-browser signals; behind a load balancer without it, every visitor shares the balancer's address.

## Storage

| Adapter | What it creates | Notes |
| --- | --- | --- |
| `mongoStorage(db, { prefix, eventRetentionDays })` | Collections `trace_visitors`, `trace_buckets`, `trace_profiles`, `trace_accounts`, `trace_events`, with indexes | No transactions needed. Retention uses a TTL index. |
| `postgresStorage(pool, { prefix, schema })` | Tables with the same names | Created with `CREATE TABLE IF NOT EXISTS` on first use. One transaction per identification. |
| `memoryStorage()` | Nothing | Tests and development only. |

Any other database can implement the `TraceStorage` interface. The `storageContract` test suite in the package source
checks an adapter's behaviour.

## Counters

Velocity and high-activity signals need counts per visitor, IP and account. The default counts in process, which is
right for a single instance. With several instances pass `redisCounters(redisClient)`: keys are prefixed `trace:vel`, so
they can share your existing Redis. Pass `counters: false` to turn the two signals off.

## Privacy

The same rules as the server apply: raw high-entropy readings never leave the browser, IPs are stored truncated by
default (`ipStorage`), and `deleteVisitor` removes a visitor and everything stored about it. See
[privacy.md](privacy.md).
