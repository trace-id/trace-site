# PHP

This quickstart verifies Trace events in PHP with the `trace/trace` Composer package. It works in Laravel, Symfony or plain PHP.

> [!NOTE]
> **Before you start**
> You need a **secret key** (`sk_...`) from the dashboard's Keys page and a frontend that sends an `eventId` (see the [Web quickstarts](javascript.md)). PHP 8.1 or later.

## 1. Install the SDK

```sh
composer require trace/trace
```

## 2. Verify the event

```php
use Trace\Client;
use Trace\VerifyError;

$client = new Client(getenv('TRACE_SECRET_KEY'), 'https://id.example.com', 1.5);

$event = null;
try {
    $event = $client->getEvent($_POST['eventId'] ?? '');
} catch (VerifyError $e) {
    error_log('Trace check skipped: ' . $e->errorCode); // fail open
}

if ($event && $event['suspectScore'] >= 60) {
    http_response_code(403);
    exit(json_encode(['error' => 'blocked']));
}
if ($event && $event['signals']['multiAccount']['detected']) {
    http_response_code(202);
    exit(json_encode(['next' => 'verify-email']));
}

$user = createUser($_POST['email'], $event['visitorId'] ?? null);
```

In Laravel, register the client as a singleton in a service provider and inject it into your controller.

## Or use the guard

`Trace\Guard` reads nothing from the request itself: you give it the event id, it verifies it with your secret key and returns what to do. The Laravel middleware wraps it so a route is protected in one line.

::: code-group
```php [Laravel]
// bootstrap/app.php (Laravel 11+)
->withMiddleware(fn ($middleware) => $middleware->alias(['trace' => \Trace\Laravel\TraceMiddleware::class]))

// routes/api.php
Route::post('/signup', SignupController::class)->middleware('trace:reject_score=80,fail_open');

// in the controller
$event = $request->attributes->get('trace'); // null only with fail_open
```
```php [Plain PHP, WordPress, Slim]
use Trace\Guard;

$out = (new Guard(rejectScore: 80))->check($_SERVER['HTTP_X_TRACE_EVENT_ID'] ?? $body['eventId'] ?? null);
if (!$out['ok']) {
    http_response_code($out['status']);
    echo json_encode(['error' => ['code' => $out['code'], 'message' => $out['message']]]);
    exit;
}
$event = $out['event']; // null only with failOpen or required: false
```
:::

The middleware reads the event id from the `X-Trace-Event-Id` header or the `eventId` input. Keys come from `TRACE_SECRET_KEY` and `TRACE_ENDPOINT`, or `config('services.trace.secret')` and `config('services.trace.endpoint')`. Options: `reject_score=N`, `fail_open`, `optional` and `timeout=SECONDS`.

It answers 400 for a missing or invalid event, 403 when the score is at or above `reject_score`, 503 when Trace cannot be reached and 500 for a bad key or missing configuration. `fail_open` only covers the unreachable case; a wrong key never fails open.

## 3. Handle errors

`VerifyError::$errorCode` is one of `invalid_event_id`, `timeout`, `network`, `unauthorized`, `not_found`, `expired`, `rate_limited`, `server_error` or `invalid_response`. Events can be verified for 60 minutes.

## Next steps

::: cards
- [Webhooks](integration.md#receiving-webhooks): Client::verifyWebhook($body, $signature, $secret)
- [New account fraud](new-account-fraud.md): The full sign-up decision
- [Server SDKs reference](server-sdks.md): Every method and option
:::
