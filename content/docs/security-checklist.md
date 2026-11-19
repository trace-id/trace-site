# Security checklist

Each requirement from the project's security baseline, where it is implemented, and the test that proves it. Paths are relative to `apps/server/src` unless noted; e2e tests live in `apps/server/test/e2e`.

| Requirement | Implementation | Evidence |
| --- | --- | --- |
| **Input:** validate every field, size limits, reject unknown fields | zod schemas with `.strict()` on every object (`identify/identify.schema.ts`, management and webhook schemas); string, array and tag caps; Fastify `bodyLimit` 64 KB | `identify.schema.test.ts`; e2e: unknown field 400, malformed JSON 400, 70 KB body 413, wrong content type 415; management: unknown fields 400 |
| **Auth:** public key only for identify and only from allowed origins | Global `AuthGuard` (`common/auth.ts`): public keys from the query string, `Origin` matched exactly or by subdomain wildcard (`keys/origins.ts`) | `keys.test.ts` (near-miss origins); e2e: other origin 403, missing origin 403, secret key on ingest 401 |
| **Auth:** secret key never in browsers; every route declares its guard | `@Auth(...)` required on every route; undeclared routes fail closed with 500; SDK refuses `sk_` keys | `client.test.ts`; e2e: public key on `/v1/events` 401 |
| **Keys:** hashed, shown once, revocable, never logged | SHA-256 with constant-time compare (`keys/key-crypto.ts`); full key only in the create response; revoke evicts the cache; no request logging, query strings never logged | `keys.test.ts`; e2e: listings never contain full keys, revoked key 401 on the next request |
| **Rate limiting:** per key, IP and visitor on ingest; per key on the API; Redis-backed, fail open | `infra/rate-limit.service.ts`, used in identify, events, visitors, webhooks and management (per user); Redis errors fail open with a throttled warning | Unit and e2e with Redis in CI; without Redis the server logs and continues (verified locally) |
| **Rate limiting:** login brute force | Better Auth rate limits forced on: 10 sign-ins/min, 5 sign-ups/hour per IP; IP taken only from a header the server sets from the `TRUST_PROXY`-aware request IP, client `X-Forwarded-For` stripped (`app.factory.ts`, `auth/auth.ts`) | e2e: 11th wrong password is 429 even with a different forged `X-Forwarded-For` each time |
| **Replay:** events expire; webhook timestamps checked | 410 after `EVENT_VERIFY_WINDOW_MINUTES`; `verifyWebhook` rejects signatures older than 5 minutes | e2e: stale event 410; `sdk-node/webhooks.test.ts` |
| **Mass assignment / IDOR** | Strict body schemas; every query filters on the project from the key or membership; non-members and foreign ids get 404 | e2e in every suite: other project's key or user gets 404 for events, visitors, webhooks, keys and projects |
| **Timing:** constant-time comparison | `timingSafeEqual` for key hashes, visitor-token HMACs and webhook HMACs | `keys.test.ts`, `token.test.ts`, `sdk-node/webhooks.test.ts` |
| **SSRF:** webhooks | https only, no credentials or fragments, private, loopback, link-local, metadata, CGNAT, NAT64 and 6to4 targets refused at registration and on every resolved address at connect time (rebinding-safe), IP literals checked, no redirects, 64 KB response cap, 5 s timeout (`webhooks/net-guard.ts`, `webhooks/sender.ts`) | `webhooks.test.ts`: blocked ranges, `localhost` refused, redirects not followed, timeouts |
| **Headers:** nosniff, frame deny, referrer, strict CORS | Fastify `onSend` hook; ACAO only reflected for allowed origins on identify; `*` only on the public static SDK files; dashboard adds CSP `frame-ancestors 'none'` | e2e: headers asserted on identify and `/sdk/*`; dashboard headers verified with curl |
| **Logging:** IDs and outcomes only | Ingest logs event, visitor, match kind, score and timing; Prisma errors are logged by class and code only, never their message (which embeds query values) (`common/log-safe.ts`) | `log-safe.test.ts` |
| **Graceful shutdown** | `enableShutdownHooks`, Fastify `return503OnClosing`, webhook worker waits for in-flight deliveries, Prisma and Redis closed on shutdown | Code review |
| **Timeouts** | Fastify request and connection timeouts; Postgres `statement_timeout` (`DB_STATEMENT_TIMEOUT_MS`, default 5 s) on every connection, longer budgets only for maintenance batches; webhook and SDK fetch timeouts; partition DDL uses `lock_timeout` so it can never deadlock ingest | e2e suite runs the deadlock-prone path in parallel; `client.test.ts`, `verify.test.ts` timeouts |
| **Dependencies:** pinned, scanned | Exact versions (`.npmrc save-exact`), lockfile resolved with a two-week age cutoff, `npm audit --omit=dev --audit-level=high` and Dependabot in CI | `npm audit --omit=dev`: 0 vulnerabilities at the time of writing |
| **Attack-surface note per endpoint** | Comment on every controller naming the surface and mitigation | `identify`, `events`, `visitors`, `webhooks`, `manage/*`, `sdk` controllers |

## Known limits

- Non-browser clients can send any `Origin`; origin checks protect against other websites, not scripts. Rate limits and server-side verification cover the rest.
- Revoked keys may keep working for up to 30 s on server instances other than the one that processed the revocation.
- Better Auth rate limits are per server instance (in memory). Behind the dashboard proxy every login comes from the dashboard's address unless `TRUST_PROXY` includes the dashboard and it forwards the client address, so the sign-in limit becomes shared: brute force is still bounded, but a flood can lock out logins for a minute. Add rate limiting at your reverse proxy for the dashboard's `/api/auth` routes.
- Client-side signals can be spoofed; they raise the cost of abuse but are not proof.
- `WEBHOOK_ALLOW_INSECURE=true` disables SSRF protection and is for local development only.
