# Laravel

This quickstart verifies Trace events in a Laravel app with the `trace/trace` Composer package and its middleware.

> [!NOTE]
> **Before you start**
> You need a **secret key** (`sk_...`) from the dashboard's Keys page and a frontend that sends an `eventId` (see the [Web quickstarts](javascript.md)). Send it in the `x-trace-event-id` header or as `eventId` in the request body.

## 1. Install the SDK

```sh
composer require trace/trace
```

```dotenv
TRACE_SECRET_KEY=sk_...
TRACE_ENDPOINT=https://id.example.com
```

Or put the values in `config/services.php` (`'trace' => ['secret' => ..., 'endpoint' => ...]`); the middleware reads either.

## 2. Register the middleware

```php
// bootstrap/app.php (Laravel 11+)
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias(['trace' => \Trace\Laravel\TraceMiddleware::class]);
})
```

On Laravel 10 and earlier, add it to `$routeMiddleware` in `app/Http/Kernel.php` instead.

## 3. Guard a route

```php
// routes/api.php
Route::post('/signup', SignupController::class)->middleware('trace:reject_score=60,fail_open');
```

```php
// app/Http/Controllers/SignupController.php
public function __invoke(Request $request)
{
    $event = $request->attributes->get('trace'); // null only with fail_open when Trace was unreachable
    // create the account, and store $event['visitorId'] with it for later lookups
    return response()->json(['ok' => true]);
}
```

The middleware reads the event id from the `X-Trace-Event-Id` header or the `eventId` input (JSON or form). Options after the colon: `reject_score=N` (403 at or above N), `fail_open`, `optional` (no event id is allowed) and `timeout=SECONDS`.

It answers 400 for a missing or invalid event, 403 when the score is at or above `reject_score`, 503 when Trace cannot be reached and 500 for a bad key or missing configuration. `fail_open` only covers the unreachable case; a wrong key never fails open.

## 4. Decide yourself instead

Use `Trace\Client` or `Trace\Guard` directly when you want custom rules. See the [PHP guide](php.md).

> [!TIP]
> **Start in shadow mode**
> For the first week, leave out `reject_score` and log `$event['suspectScore']` and `$event['reasons']` instead. Look at who would have been blocked, then pick thresholds you trust.

Running WordPress or WooCommerce rather than Laravel? Use the [WordPress plugin](wordpress.md).

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
