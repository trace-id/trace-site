# API reference (v1)

All endpoints are under `/v1`, speak JSON, and return errors as:

```json
{ "error": { "code": "rate_limited", "message": "Too many requests" } }
```

`429` responses always carry `Retry-After` (seconds). Resources that belong to another project return `404`, the same as resources that do not exist.

## Keys

| Key | Prefix | Where | Can call |
| --- | --- | --- | --- |
| Public | `pk_` | Browser or app | `POST /v1/identify`, only from the key's allowed origins and apps |
| Secret | `sk_` | Your server only | `GET /v1/events/:eventId` |

Keys are 40 random base62 characters after the prefix, stored as SHA-256 hashes, shown once at creation. Allowed origins are exact (`https://app.example.com`, `http://localhost:5173`) or a subdomain wildcard (`https://*.example.com`, which does not match the apex). For React Native and Expo apps, which send no `Origin`, add `app:<bundle or application id>`: the SDK names its app in an `X-Trace-App` header, accepted only when the request has no `Origin`. Like origins, this scopes a key; it does not authenticate the app.

## POST /v1/identify

Called by `sdk-js`. Key in the query string (`?apiKey=pk_...`) so the browser can send a CORS "simple request" with `Content-Type: text/plain` and skip the preflight. `application/json` is accepted too.

Request (all objects reject unknown fields; body capped at 64 KB):

```json
{
  "signals": { "v": 1, "components": { "canvas": "<28 hex>", "...": "..." }, "attributes": {}, "bot": {}, "tamper": {}, "privacy": {}, "storage": {}, "collectMs": 41 },
  "token": "v1....",
  "linkedId": "your-user-id",
  "tags": { "page": "signup" },
  "sdk": { "name": "@trace-id/sdk-js", "version": "0.1.0" }
}
```

Response:

```json
{ "eventId": "0192f0c4-...", "visitorId": "Vx3...", "deviceId": "Vx3...", "confidence": 0.97, "suspectScore": 5, "token": "v1...." }
```

`visitorId` identifies the browser. `deviceId` is shared by every browser on the device: it is the `visitorId` of the first-seen browser among this one and its strong links (confidence at least `crossBrowser.signalThreshold`, 0.8). It equals `visitorId` until a link is made, and does not change when links later weaken. Identical machines on one network can be wrongly linked and then share a `deviceId`; the event's `linkedVisitors` shows each link with its confidence.

The response is deliberately small. Do not make decisions on it; verify the `eventId` on your server.

With `SEALED_RESULTS_KEY` set, the response also has `sealedResult`: the full event (exactly what `GET /v1/events/:eventId` returns), deflated and encrypted with AES-256-GCM. The browser cannot read or alter it. Send it to your backend with the form or request it belongs to and open it there, with no extra API call:

```ts
import { unsealEventResult } from '@trace-id/sdk-node/sealed';
const event = unsealEventResult(body.sealedResult, { key: process.env.TRACE_SEALED_KEY! });
// event.suspectScore, event.signals, ... Reject an eventId you have already accepted (replay).
```

It throws `SealedResultError` with code `tampered`, `expired` (past the verification window), `malformed`, `unsupported_version` or `invalid_key`. Pass several keys during a rotation.

Errors: `400 invalid_request`, `401 invalid_api_key`, `403 origin_not_allowed`, `413 payload_too_large`, `415 unsupported_media_type`, `429 rate_limited`.

**Attack surface:** DoS (body cap, per-key, per-IP and per-visitor limits), key abuse (origin check; non-browser clients can forge `Origin`, hence limits and server-side verification), forgery (small response, verdict only via the secret key), token replay (HMAC bound to the project and must agree with the device's signals).

## GET /v1/events/:eventId

Header: `Authorization: Bearer sk_...`. Returns the full event:

```json
{
  "eventId": "...",
  "visitorId": "...",
  "deviceId": "...",
  "confidence": 0.97,
  "matchKind": "token | similar | new",
  "suspectScore": 90,
  "reasons": [{ "signal": "bot", "contribution": 60 }, { "signal": "tor", "contribution": 30 }],
  "signals": { "bot": { "detected": true, "details": {} }, "tor": { "detected": true, "details": {} } },
  "components": { "canvas": "<hash>" },
  "attributes": { "screenWidth": 1920, "screenHeight": 1080, "timezone": "Europe/Berlin", "languages": ["en-US"], "platform": "Win32", "userAgent": "..." },
  "ip": { "address": "198.51.100.0", "country": null, "asn": null },
  "tags": { "page": "signup" },
  "linkedId": "your-user-id",
  "linkedVisitors": [
    { "visitorId": "...", "confidence": 0.92, "browser": "chrome", "sameNetwork": true, "sharedNetworks": 1, "via": "sharedNetwork", "lastSeenAt": "2026-11-14T09:41:00.000Z" }
  ],
  "createdAt": "2026-11-14T10:00:00.000Z",
  "expiresAt": "2026-11-14T11:00:00.000Z"
}
```

`ip.location` (only with a City edition GeoIP database) gives `city`, `region`, `latitude`, `longitude`, `accuracyRadiusKm`, `timezone` and a proximity `zone`; see [location and proximity](signals.md#location-and-proximity).

`rawAttributes` holds the browser's plain readings: screen and available size, colour depth, pixel ratio, CPU cores, device memory, touch points, time zone, languages, platform, user agent, client hints (`uaBrands`, `uaMobile`, `uaPlatform`) and the GPU vendor and renderer. High-entropy readings (canvas, audio, fonts and the like) stay hashed in `components`. Absent on events stored before it existed.

`fraudScores` (once a fraud type is trained, see [Fraud score](#fraud-score)) lists one entry per type: `{ "label": "payment", "probability": 0.91, "reasons": ["proxy", "bot"] }`. `reasons` are the signals and [context features](#fraud-score) that raised the odds by at least 10%, strongest first.

`app` (events from the React Native SDK only) describes the app and device: `platform` (`ios` or `android`), `osVersion`, `manufacturer`, `model`, `appId`, `appVersion`, `buildVersion`, `isDevice` (false on an emulator or simulator), `rooted` and `installedAt`.

`botInfo` is the bot verdict for the visit: `result` (`good`, `bad` or `notDetected`), `type`, `name`, `provider` and `identity` (`signed` when a Web Bot Auth signature verified). Absent on events stored before it existed. See [Signal catalog: bots and AI agents](signals.md#bots-and-ai-agents).

`linkedVisitors` lists other visitors that look like this device in a different browser or browser profile, best first (at most 10). Each keeps its own `visitorId`; nothing is merged. `confidence` is the share of device traits that match. Empty when nothing matched, when the operator turned linking off, and on events stored before the feature existed. See [Signal catalog: cross-browser linking](signals.md#cross-browser-linking).

`ip.address` follows the operator's `IP_STORAGE` setting (`truncated` by default: /24 for IPv4, /48 for IPv6).

Errors: `400 invalid_event_id`, `401 invalid_api_key`, `404 not_found`, `410 event_expired` (older than `EVENT_VERIFY_WINDOW_MINUTES`, default 60), `429 rate_limited`.

**Attack surface:** IDOR (lookup scoped to the key's project), enumeration (UUIDv7 ids with 74 random bits, identical 404s), replay (410 after the window), DoS (per-key limit).

## GET /health, GET /health/ready

No auth. `/health` is liveness. `/health/ready` checks Postgres and reports Redis (`{ "status": "ok", "redis": true }`); Redis being down does not fail readiness because the service degrades without it.

## GET /v1/visitors/:visitorId

Header: `Authorization: Bearer sk_...`. Query: `limit` (1 to 50, default 20), `cursor` (from the previous page's `nextCursor`). Events are newest first.

```json
{
  "visitorId": "Vx3...",
  "deviceId": "Vx3...",
  "firstSeenAt": "2026-11-01T09:00:00.000Z",
  "lastSeenAt": "2026-11-14T10:00:00.000Z",
  "eventCount": 12,
  "events": [
    { "eventId": "...", "createdAt": "...", "matchKind": "token", "confidence": 0.99, "suspectScore": 0, "linkedId": "user-1", "tags": null }
  ],
  "nextCursor": "MjAyNi0xMS0x..."
}
```

Errors: `400 invalid_visitor_id | invalid_cursor | invalid_request`, `401`, `404 not_found`, `429`.

## GET /v1/devices/:deviceId

Header: `Authorization: Bearer sk_...`. Every browser (visitor) that shares this `deviceId`, and every account (`linkedId`) seen with any of them. Up to 100 visitors and 1,000 account rows.

```json
{
  "deviceId": "Vx3...",
  "visitors": [
    { "visitorId": "Vx3...", "browser": "chrome", "firstSeenAt": "...", "lastSeenAt": "...", "eventCount": 12 },
    { "visitorId": "Qp8...", "browser": "firefox", "firstSeenAt": "...", "lastSeenAt": "...", "eventCount": 2 }
  ],
  "accounts": [
    { "linkedId": "user-1", "firstSeenAt": "...", "lastSeenAt": "...", "visitorIds": ["Qp8...", "Vx3..."] }
  ]
}
```

Errors: `400 invalid_device_id`, `401`, `404 not_found`, `429`.

## POST /v1/identify/forget

Public key, like identify. Clears the first-party visitor cookie and returns `204`. The SDK calls it from `disable(true)` when `firstPartyCookie` is on.

## DELETE /v1/visitors/:visitorId

Header: `Authorization: Bearer sk_...`. Permanently deletes the visitor, its matching buckets and all its events. Returns `204`, or `404` if the visitor does not exist in this project. Velocity counters in Redis hold no personal data (counts and HyperLogLog sketches keyed by the visitor id) and expire within 25 hours.

**Attack surface (both visitor routes):** IDOR (scoped to the key's project; identical 404s), enumeration (119-bit random ids), DoS (per-key limit, max page 50, keyset pagination).

## Retention

Events older than the project's `retentionDays` (default 30, capped by `RETENTION_MAX_DAYS`, default 90) are deleted, and so are visitors not seen within that window. Whole monthly partitions older than `RETENTION_MAX_DAYS` are dropped. The job runs at startup and every `MAINTENANCE_INTERVAL_MINUTES` (default 360); a lease row keeps it to one instance at a time.

## Webhooks

Manage endpoints with the secret key. At most 10 per project.

`POST /v1/webhooks` with `{ "url": "https://hooks.example.com/x", "events": ["event.created", "visitor.flagged"], "flagThreshold": 70 }` returns `201` with the endpoint and its signing `secret` (`whsec_...`). **The secret is shown only once.** `visitor.flagged` fires when an event's `suspectScore` is at or above `flagThreshold` (default 70).

`GET /v1/webhooks` lists endpoints (no secrets). `DELETE /v1/webhooks/:id` removes one (`204` or `404`).

Each delivery is a `POST` with a JSON body:

```json
{ "id": "<delivery id>", "type": "event.created", "createdAt": "...", "data": { "...": "same shape as GET /v1/events/:eventId" } }
```

Headers: `X-Webhook-Id` (same as `id`, stable across retries), `X-Webhook-Timestamp`, and `X-Signature: t=<unix seconds>,v1=<hex HMAC-SHA256 of "<t>.<raw body>">`. Verify with `verifyWebhook` from `@trace-id/sdk-node/webhooks` (see [integration.md](integration.md#receiving-webhooks)).

Delivery: at-least-once. Any 2xx within 5 s counts as delivered. Otherwise retried after 10 s, 1 min, 5 min, 30 min, 2 h, 6 h, 12 h and 24 h, then marked dead. Redirects are not followed. Finished deliveries are purged after 7 days; deleting a visitor deletes its deliveries.

**Attack surface:** SSRF (https only; credentials, fragments and private, loopback, link-local, metadata, CGNAT, NAT64 and 6to4 targets refused at registration and re-checked against every resolved address at connect time, which defeats DNS rebinding; no redirects; 64 KB response cap; 5 s timeout), IDOR (scoped by project), abuse (10 endpoints per project, per-key rate limit), secret exposure (encrypted at rest with AES-256-GCM, shown once). `WEBHOOK_ALLOW_INSECURE=true` disables the http and private-network checks for local development only.

## Fraud score

The suspect score uses fixed weights. The fraud score learns from your own verdicts instead: label events as fraud or legit per fraud type, and Trace fits one logistic regression per type, then adds `fraudScores` to every new event.

A model sees which signals fired plus these context features, read from what the event already stores at lower thresholds than the signals use. Each can appear in `reasons` and `coefficients`:

| Feature | Holds when |
| --- | --- |
| `newVisitor` | First visit from this browser (no match to an earlier visitor). |
| `weakMatch` | Matched an earlier visitor by device traits with confidence below 0.8. |
| `sharedIp` | At least 3 visitors on this IP in the last hour. |
| `manyIps` | This visitor used at least 3 IPs in the last 24 hours. |
| `eventBurst` | At least 5 events from this visitor in the last hour. |
| `sharedAccount` | This account (`linkedId`) was used from at least 2 visitors (or devices) in the last 24 hours. |
| `multipleAccounts` | At least 2 accounts seen on this device. |
| `otherBrowsers` | The device was also seen in another browser or profile. |
| `localNight` | Between 00:00 and 05:59 in the browser's time zone. |
| `newAccount` | The account (`linkedId`) was first seen less than 24 hours ago, or on this request. |
| `newDeviceForAccount` | An account older than 24 hours, on a device that never used it before (a common account-takeover pattern). |

The two account features need a `linkedId` on the identify call. Trace keeps when each account was first seen and on which devices; deleting a visitor removes its share of that history.

None of these is suspicious alone; the model learns from your labels how much each one matters for each fraud type. In a synthetic account-takeover test where no fraud signal fires, the context features take the cross-validated AUC from under 0.65 to over 0.8; that is a constructed example, not a measurement on real traffic. Labels store the features as they were at the event, so a label taken weeks later trains on the same inputs the event was scored with.

`PUT /v1/events/:eventId/labels/:label` with `{ "fraud": true }` (or `false`) and the secret key. `label` is the fraud type: lowercase letters, digits and `_`, starting with a letter, up to 32 characters (`payment`, `account_takeover`, `promo_abuse`). Labelling again replaces the verdict. Returns `{ "eventId", "label", "fraud" }`. `DELETE` on the same path removes it (`204`, or `404`). From Node: `labelEvent(eventId, 'payment', true, { secretKey, endpoint })` in `@trace-id/sdk-node`; Python `client.label_event(...)`, PHP `$client->labelEvent(...)`, Java `client.labelEvent(...)`.

Label any event in the project, at any age the event still exists: chargebacks arrive weeks later. The signals that fired are copied into the label, so training data outlives event retention. Label legit events too; a model needs both.

- A type trains once it has at least 30 labels with at least 5 of each kind. Until then it is listed under `untrained`.
- Models retrain 30 s after the last label change, in the maintenance pass, and on `POST /v1/fraud-models/train`. Training uses the newest 50,000 labels per type.
- `GET /v1/fraud-models` returns each model (`n`, `positives`, `intercept`, `coefficients` in log-odds per signal, `trainedAt`) and `cvAuc`: the ROC AUC of 5-fold cross-validation on your labels, so each label is scored by a model that never saw it. It is null when a kind has fewer than 5 labels. Treat a `cvAuc` near 0.5 as "the signals do not separate this fraud type on your traffic".
- `probability` is calibrated to your labels, not to all traffic: if you label mostly suspicious events, probabilities run high. Pick the threshold from your own outcomes.
- At most 20 types per project. Deleting a visitor deletes its labels; deleting all labels of a type removes its model.

Only the secret key can label, so only your backend trains your models. Scores are a decision aid: the model only knows what Trace's signals saw, not your business data.

**Attack surface:** IDOR (scoped to the key's project; identical 404s), training-data poisoning (secret key only), abuse (20 types, 50k labels used per type, per-key rate limit).

## Management API (dashboard sessions)

Used by the dashboard. Authentication is a Better Auth session cookie, not an API key. The dashboard proxies `/api/auth/*` and `/v1/*` to the server so the cookie is first-party on the dashboard's origin (`DASHBOARD_URL`).

Accounts: email and password (12 to 128 characters). The first account can always be created; after that `POST /api/auth/sign-up/email` returns `403` unless `DASHBOARD_ALLOW_SIGNUP=true`. Sign-in: `POST /api/auth/sign-in/email`. Sessions last 7 days.

Roles per project: `owner` (creator), `admin`, `viewer`. Viewers can read; changes need `admin` or above. Users who are not members get `404` for every project route.

| Route | Role | What |
| --- | --- | --- |
| `GET /v1/me` | signed in | User and their projects with roles |
| `POST /v1/projects` `{ name }` | signed in | Create a project (you become owner; max 50) |
| `GET /v1/projects/:projectId` | viewer | Project |
| `PATCH /v1/projects/:projectId` `{ name?, retentionDays? }` | admin | Update; `retentionDays` capped by `RETENTION_MAX_DAYS` |
| `GET /v1/projects/:projectId/keys` | viewer | Keys by prefix (never the full key) |
| `POST /v1/projects/:projectId/keys` `{ type, name?, allowedOrigins? }` | admin | Create; full `key` returned once (max 20 active) |
| `PATCH /v1/projects/:projectId/keys/:keyId` `{ name?, allowedOrigins? }` | admin | Rename, change origins (public keys) |
| `POST /v1/projects/:projectId/keys/:keyId/revoke` | admin | Revoke; immediate on the instance that served the call, within 30 s elsewhere |
| `GET /v1/projects/:projectId/usage?days=30` | viewer | Per-day events, new visitors, events with score >= 70 (UTC days, max 90) |
| `GET /v1/projects/:projectId/events` | viewer | Search: `linkedId`, `visitorId`, `minScore`, `from`, `to` (ISO), `cursor`, `limit` (max 50) |
| `GET /v1/projects/:projectId/events/:eventId` | viewer | Full event; no verification window |
| `GET /v1/projects/:projectId/visitors/:visitorId` | viewer | Visitor history |
| `DELETE /v1/projects/:projectId/visitors/:visitorId` | admin | Privacy deletion |
| `GET`/`POST /v1/projects/:projectId/webhooks`, `DELETE .../webhooks/:id` | viewer / admin | Webhook endpoints |
| `GET /v1/projects/:projectId/webhooks/:id/deliveries` | viewer | Last 50 delivery attempts |
| `GET .../events/:eventId/labels`, `PUT`/`DELETE .../events/:eventId/labels/:label` | viewer / admin | Fraud labels on an event (see [Fraud score](#fraud-score)) |
| `GET .../fraud-models`, `POST .../fraud-models/train` | viewer / admin | Fraud models and retraining |

**Attack surface:** CSRF (writes require `Origin` equal to `DASHBOARD_URL`; cookies are `SameSite=Lax`, `Secure` when the dashboard is https), IDOR (membership checked before any handler runs; non-members get 404), privilege escalation (role ranks enforced per route; unknown body fields rejected so roles cannot be set through updates), account abuse (sign-up closed after the first account by default; Better Auth rate-limits auth routes), key disclosure (shown once, stored hashed).
