# Browser SDK

`@trace-id/sdk-js` collects device signals in the browser and returns an `eventId` for your server to verify. The React, Vue and Svelte packages wrap the same client. About 10 KB gzipped, no dependencies, no permission prompts.

```ts
import { createClient } from '@trace-id/sdk-js';

const trace = createClient({ apiKey: 'pk_...', endpoint: 'https://id.example.com' });
const { eventId, visitorId } = await trace.get({ linkedId: user.id });
```

## createClient(options)

Creates a client and starts collecting signals in the background. Create one per page, not one per call.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `apiKey` | `string` | required | Public key, `pk_...`. Never a secret key. |
| `endpoint` | `string` | required | Your Trace server, or the route you mounted in [embedded mode](embedded.md). |
| `timeoutMs` | `number` | `5000` | Total budget for collection and the request. |
| `persistToken` | `boolean` | `true` | Keep the visitor token in a cookie, `localStorage` and IndexedDB so returning visitors match exactly. |
| `firstPartyCookie` | `boolean` | `false` | Also keep the token in an HttpOnly cookie set by the server. Needs [first-party mode](integration.md#first-party-mode); survives Safari's 7-day cap. |
| `enabled` | `boolean` | `true` | Set `false` to wait for consent; call `enable()` later. |

## client.get(options?)

Collects (or reuses collected) signals, sends them, and resolves with the result. Rejects with an `IdentifyError`.

| Option | Type | Description |
| --- | --- | --- |
| `linkedId` | `string` | Your own user or account id. Powers per-account velocity, `multiAccount`, `accountSharing` and the device graph. Use an internal id, not an email. |
| `tags` | `Record<string, string \| number \| boolean>` | Free-form labels stored with the event, such as `{ action: 'signup' }`. |

### Result

| Field | Type | Description |
| --- | --- | --- |
| `eventId` | `string` | Send this to your backend and verify it there. |
| `visitorId` | `string` | Stable id of this browser. |
| `deviceId` | `string` | Shared by every browser on this device. Equals `visitorId` until a link is made. |
| `confidence` | `number` | 0 to 1, how sure the match to a returning visitor is. |
| `suspectScore` | `number` | 0 to 100. For display only; decide on the verified event. |
| `sealedResult` | `string?` | The full event, encrypted, when the server has `SEALED_RESULTS_KEY`. Open it on your server with `unsealEventResult`. |

## Consent

```ts
const trace = createClient({ apiKey, endpoint, enabled: false });

consentManager.onAccept(() => trace.enable());
consentManager.onWithdraw(() => trace.disable(true)); // true also deletes the stored token and asks the server to clear its cookie
```

| Member | Description |
| --- | --- |
| `enable()` | Allow collection. |
| `disable(clearStoredData?)` | Stop collection. With `true`, delete the stored visitor token too. |
| `isEnabled` | Whether collection is allowed. |

While disabled, `get()` rejects with `collection_disabled`.

## Errors

`IdentifyError` has `code`, `status` (HTTP status or `null`) and `retryAfterSec` (for `rate_limited`).

| Code | Meaning |
| --- | --- |
| `collection_disabled` | The client is disabled (no consent yet). |
| `timeout` | Collection and request took longer than `timeoutMs`. |
| `network` | The endpoint could not be reached (offline, blocked by an extension). |
| `invalid_api_key` | Unknown or revoked public key. |
| `origin_not_allowed` | This page's origin is not in the key's allowed origins. |
| `rate_limited` | Too many requests; see `retryAfterSec`. |
| `bad_request` | The server rejected the payload. |
| `server_error` | The server failed. |
| `invalid_response` | The response was not what the SDK expects. |

```ts
import { IdentifyError } from '@trace-id/sdk-js/errors';

try {
  await trace.get();
} catch (err) {
  if (err instanceof IdentifyError && err.code === 'origin_not_allowed') console.error('Add this origin to the public key');
}
```

## Framework packages

| Package | Setup | Hook or store |
| --- | --- | --- |
| `@trace-id/sdk-react` | `<IdentifyProvider apiKey endpoint>` | `useVisitorData({ immediate, linkedId, tags })` returns `{ data, error, isLoading, getData }`; `useIdentifyClient()` |
| `@trace-id/sdk-vue` | `app.use(createIdentify({ apiKey, endpoint }))` | `useVisitorData(...)` returns refs; `useIdentifyClient()` |
| `@trace-id/sdk-svelte` | `createVisitorData(options, { immediate })` | A store of `{ data, error, isLoading }` with `getData()` and `client`; also works with Angular's `async` pipe |

In all three, `immediate` defaults to `true` (identify on mount); `getData` resolves `null` instead of throwing and sets `error`. Nothing runs during server rendering.

## Script tag

The server hosts the SDK at `/sdk/sdk.esm.js` (module) and `/sdk/sdk.global.js` (classic script, exposes `window.Trace.createClient`). For production, serve the file from your own domain.

## What it collects

Canvas, WebGL, audio, fonts, math, screen, hardware and locale readings, plus checks for automation and tampering. High-entropy values are hashed in the browser before they are sent. It never prompts for permissions or reads location, files, camera or microphone. See [identification components](signals.md#identification-components) and [privacy](privacy.md).
