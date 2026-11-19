# Ruby and Rails

This quickstart verifies Trace events in a Rails (or any Rack) app with the `trace-device` gem. It uses only the standard library.

> [!WARNING]
> **Draft SDK**
> This SDK was written without a Ruby toolchain available, so it has not been run yet. Its tests run in CI and must pass before you rely on it.

> [!NOTE]
> **Before you start**
> You need a **secret key** (`sk_...`) from the dashboard's Keys page and a frontend that sends an `eventId` (see the [Web quickstarts](javascript.md)). Ruby 3.0 or later.

## 1. Install the SDK

```sh
bundle add trace-device
```

```sh
export TRACE_SECRET_KEY=sk_...
export TRACE_ENDPOINT=https://id.example.com
```

## 2. Verify the event

```ruby
client = Trace::Client.new(ENV["TRACE_SECRET_KEY"], ENV["TRACE_ENDPOINT"], timeout: 1.5)

event = begin
  client.get_event(params[:eventId])
rescue Trace::VerifyError => e
  Rails.logger.warn("Trace check skipped: #{e.code}") # fail open
  nil
end

if event && event["suspectScore"] >= 60
  render json: { error: "blocked" }, status: :forbidden
end
```

The event is a `Hash` with the same fields as the [API response](api.md#get-v1eventseventid).

## Or use the guard

`Trace::Rack::Guard` is Rack middleware that reads the event id from the `X-Trace-Event-Id` header, a JSON body or a form body, verifies it, and puts the event in `env["trace.event"]`. It guards only the paths you list, and the body stays readable.

```ruby
# config/application.rb
config.middleware.use Trace::Rack::Guard, paths: ["/signup", %r{\A/api/}], reject_score: 80, fail_open: true
```

```ruby
# in a controller
event = request.env["trace.event"] # nil only with fail_open when Trace was unreachable
```

To decide inside a controller instead, call `Trace::Guard.new(reject_score: 80).check(event_id)`; it returns an outcome with `ok?`, `event`, `status` and `body`.

The guard answers 400 for a missing or invalid event, 403 when the score is at or above `reject_score` (or `reject` returns true), 503 when Trace cannot be reached and 500 for a bad key or missing configuration. `fail_open: true` only covers the unreachable case; a wrong key never fails open.

## Webhooks and sealed results

```ruby
# Pass the raw body, before any JSON parsing.
payload = Trace.verify_webhook(request.raw_post, request.headers["X-Signature"], ENV["TRACE_WEBHOOK_SECRET"])

# Sealed results (SEALED_RESULTS_KEY on the server), no API call.
event = Trace.unseal_event_result(params[:sealedResult], ENV["TRACE_SEALED_KEY"])
```

Errors are `Trace::VerifyError`, `Trace::WebhookError` and `Trace::SealedError`, each with a `code`. Deliveries are at least once: dedupe on `payload["id"]`.

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
