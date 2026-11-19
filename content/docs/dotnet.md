# .NET and ASP.NET Core

This quickstart verifies Trace events in an ASP.NET Core app with the `TraceDevice` and `TraceDevice.AspNetCore` NuGet packages. They have no third-party dependencies.

> [!NOTE]
> **Tested in CI**
> Builds and passes its tests on .NET 8, against the same test vectors as the other SDKs. It has not yet been used in a production app, so start the guard in shadow mode.

> [!NOTE]
> **Before you start**
> You need a **secret key** (`sk_...`) from the dashboard's Keys page and a frontend that sends an `eventId` (see the [Web quickstarts](javascript.md)). .NET 8 or later.

## 1. Install the SDK

```sh
dotnet add package TraceDevice
dotnet add package TraceDevice.AspNetCore
```

```sh
export TRACE_SECRET_KEY=sk_...
export TRACE_ENDPOINT=https://id.example.com
```

## 2. Verify the event

```csharp
using TraceDevice;

var client = new TraceClient(Environment.GetEnvironmentVariable("TRACE_SECRET_KEY")!, Environment.GetEnvironmentVariable("TRACE_ENDPOINT")!, TimeSpan.FromMilliseconds(1500));

TraceEvent? ev = null;
try
{
    ev = await client.GetEventAsync(eventId);
}
catch (VerifyException e)
{
    logger.LogWarning("Trace check skipped: {Code}", e.Code); // fail open
}

if (ev is { SuspectScore: >= 60 }) return Results.StatusCode(403);
```

`TraceEvent` carries `VisitorId`, `SuspectScore`, `Reasons`, `Signals` (with `Detected("multiAccount")`) and `Raw`, the full JSON, for fields it does not name.

## Or use the guard

The middleware reads the event id from the `X-Trace-Event-Id` header, a JSON body or a form body, verifies it, and stores the event on the request. The body stays readable.

```csharp
using TraceDevice;
using TraceDevice.AspNetCore;

// Middleware: guard POST, PUT, PATCH and DELETE under /api
app.UseTraceGuard(new TraceGuardOptions { RejectScore = 80, FailOpen = true },
                  ctx => ctx.Request.Path.StartsWithSegments("/api"));

app.MapPost("/api/signup", (HttpContext ctx) =>
{
    var ev = ctx.GetTraceEvent(); // null only with FailOpen when Trace was unreachable
    return Results.Ok(ev?.VisitorId);
});

// Or guard a single minimal-API endpoint
app.MapPost("/signup", handler).RequireTrace(new TraceGuardOptions { RejectScore = 80 });
```

The guard answers 400 for a missing or invalid event, 403 when `RejectScore` or `Reject` says so, 503 when Trace cannot be reached and 500 for a bad key or missing configuration. `FailOpen = true` only covers the unreachable case; a wrong key never fails open.

## Webhooks and sealed results

```csharp
// Pass the raw body, before any JSON parsing.
var payload = TraceWebhooks.Verify(rawBodyBytes, Request.Headers["X-Signature"], webhookSecret);

// Sealed results (SEALED_RESULTS_KEY on the server), no API call.
var ev = TraceSealed.Unseal(sealedResult, sealedKey);
```

Errors are `VerifyException`, `WebhookException` and `SealedException`, each with a `Code`. Deliveries are at least once: dedupe on `payload.Id`.

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
