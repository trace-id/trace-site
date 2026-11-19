# Server SDKs

Every server SDK does the same three things: **verify an event** by id, **verify a webhook** signature, and **open a sealed result**. They are tested against the same vectors, produced by the server's own code, so they behave identically.

| Language | Package | Install |
| --- | --- | --- |
| Node.js 18.17+ | `@trace-id/sdk-node` | `npm install @trace-id/sdk-node` |
| Python 3.9+ | `trace-device` (import `trace_device`) | `pip install trace-device` |
| PHP 8.1+ | `trace/trace` | `composer require trace/trace` |
| Java 11+ | `dev.trace:trace` | Maven or Gradle |
| Ruby 3.0+ | `trace-device` (require `trace`) | `gem install trace-device` |
| .NET 8 | `TraceDevice` | `dotnet add package TraceDevice` |
| Go 1.21+ | `github.com/trace-id/trace/sdks/go` (package `trace`) | `go get github.com/trace-id/trace/sdks/go` |
| Anything else | REST | `GET /v1/events/:eventId` with `Authorization: Bearer sk_...` |

## Verify an event

Fetches the event the browser created. Use it for every decision.

::: code-group
```ts [Node.js]
import { verifyEvent } from '@trace-id/sdk-node';

const event = await verifyEvent(eventId, { secretKey: 'sk_...', endpoint: 'https://id.example.com', timeoutMs: 2000 });
```
```python [Python]
import trace_device

client = trace_device.Client(secret_key="sk_...", endpoint="https://id.example.com", timeout=2.0)
event = client.get_event(event_id)
```
```php [PHP]
$client = new Trace\Client('sk_...', 'https://id.example.com', 2.0);
$event = $client->getEvent($eventId);
```
```java [Java]
Trace client = new Trace("sk_...", "https://id.example.com", Duration.ofSeconds(2));
Map<String, Object> event = client.getEvent(eventId);
```
```go [Go]
client, _ := trace.NewClient("sk_...", "https://id.example.com", trace.WithTimeout(2*time.Second))
event, err := client.GetEvent(ctx, eventID)
```
```ruby [Ruby]
client = Trace::Client.new("sk_...", "https://id.example.com", timeout: 2.0)
event = client.get_event(event_id)
```
```csharp [.NET]
var client = new TraceClient("sk_...", "https://id.example.com", TimeSpan.FromSeconds(2));
var ev = await client.GetEventAsync(eventId);
```
```sh [cURL]
curl -H "Authorization: Bearer sk_..." https://id.example.com/v1/events/$EVENT_ID
```
:::

| Option | Default | Description |
| --- | --- | --- |
| secret key | required | `sk_...`. Keep it on the server. |
| endpoint | required | Your Trace server URL. |
| timeout | 2 s | Keep it short; decide whether to [fail open or closed](integration.md#fail-open-or-fail-closed). |

The result is the event described in the [API reference](api.md#get-v1eventseventid). Events can be verified for 60 minutes after they are created.

### Verify errors

Node `VerifyError` (from `@trace-id/sdk-node/errors`), Python `trace_device.VerifyError`, PHP `Trace\VerifyError` (`$errorCode`), Java `Trace.VerifyException` Go `*trace.VerifyError` (`Code`), Ruby `Trace::VerifyError` (`code`) and .NET `VerifyException` (`Code`) all carry one of these codes:

| Code | Meaning |
| --- | --- |
| `invalid_event_id` | Not an event id. |
| `unauthorized` | Missing, wrong or revoked secret key. |
| `not_found` | No such event in this project. |
| `expired` | Older than the 60-minute verification window. |
| `rate_limited` | Too many requests. |
| `timeout`, `network` | The server could not be reached in time. |
| `server_error`, `invalid_response` | The server failed or answered unexpectedly. |

## Verify a webhook

Checks the `X-Signature` header against the endpoint's `whsec_...` secret and returns the parsed payload. Pass the **raw** request body; re-serialized JSON will not verify. Timestamps older than 300 seconds are rejected.

::: code-group
```ts [Node.js]
import { verifyWebhook } from '@trace-id/sdk-node/webhooks';

const payload = verifyWebhook({ body: rawBody, signature: req.headers['x-signature'], secret: 'whsec_...' });
```
```python [Python]
payload = trace_device.verify_webhook(request.get_data(), request.headers.get("X-Signature"), "whsec_...")
```
```php [PHP]
$payload = Trace\Client::verifyWebhook(file_get_contents('php://input'), $_SERVER['HTTP_X_SIGNATURE'] ?? null, 'whsec_...');
```
```java [Java]
Map<String, Object> payload = Trace.verifyWebhook(rawBody, request.getHeader("X-Signature"), "whsec_...");
```ruby [Ruby]
payload = Trace.verify_webhook(request.raw_post, request.headers["X-Signature"], "whsec_...")
```
```csharp [.NET]
var payload = TraceWebhooks.Verify(rawBodyBytes, Request.Headers["X-Signature"], "whsec_...");
```
```go [Go]
payload, err := trace.VerifyWebhook(rawBody, r.Header.Get("X-Signature"), "whsec_...")
```
:::

Deliveries are at least once: dedupe on `payload.id`. Payload types are `event.created` and `visitor.flagged`. See [receiving webhooks](integration.md#receiving-webhooks).

## Open a sealed result

When the server has `SEALED_RESULTS_KEY`, the browser result includes `sealedResult`: the full event, encrypted. Your server opens it with the same key, without an API call. Pass several keys during a rotation.

::: code-group
```ts [Node.js]
import { unsealEventResult } from '@trace-id/sdk-node/sealed';

const event = unsealEventResult(body.sealedResult, { key: process.env.TRACE_SEALED_KEY! });
```
```python [Python]
event = trace_device.unseal_event_result(body["sealedResult"], os.environ["TRACE_SEALED_KEY"])
```
```php [PHP]
$event = Trace\Client::unsealEventResult($body['sealedResult'], getenv('TRACE_SEALED_KEY'));
```
```java [Java]
Map<String, Object> event = Trace.unsealEventResult(sealedResult, List.of(sealedKey));
```ruby [Ruby]
event = Trace.unseal_event_result(params[:sealedResult], ENV["TRACE_SEALED_KEY"])
```
```csharp [.NET]
var ev = TraceSealed.Unseal(sealedResult, sealedKey);
```
```go [Go]
event, err := trace.UnsealEventResult(sealedResult, os.Getenv("TRACE_SEALED_KEY"))
```
:::

By default, results past the verification window are rejected (`expired`). Other errors: `invalid_key`, `malformed`, `unsupported_version`, `tampered`.

## Embedded mode

With [`@trace-id/embed`](embedded.md) there is no HTTP call: `await trace.verify(eventId)` reads the event in process and throws a `TraceError` with status 404 or 410.
