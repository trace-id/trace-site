# Java

This quickstart verifies Trace events on the JVM with `dev.trace:trace`. It has no dependencies, so it fits Spring Boot, Quarkus, Micronaut or plain Java.

> [!NOTE]
> **Before you start**
> You need a **secret key** (`sk_...`) from the dashboard's Keys page and a frontend that sends an `eventId` (see the [Web quickstarts](javascript.md)). Java 11 or later.

## 1. Add the dependency

::: code-group
```xml [Maven]
<dependency>
  <groupId>dev.trace</groupId>
  <artifactId>trace</artifactId>
  <version>0.1.0</version>
</dependency>
```
```kotlin [Gradle]
implementation("dev.trace:trace:0.1.0")
```
:::

## 2. Verify the event

```java
import dev.trace.Trace;
import java.time.Duration;
import java.util.Map;

Trace trace = new Trace(System.getenv("TRACE_SECRET_KEY"), "https://id.example.com", Duration.ofMillis(1500));

Map<String, Object> event = null;
try {
    event = trace.getEvent(eventId);
} catch (Trace.VerifyException e) {
    log.warn("Trace check skipped: {}", e.code); // fail open
}

if (event != null) {
    double score = ((Number) event.get("suspectScore")).doubleValue();
    if (score >= 60) return ResponseEntity.status(403).body(Map.of("error", "blocked"));
}
```

In Spring, expose `Trace` as a `@Bean` and inject it. The event is a `Map` with the same fields as the [API response](api.md#get-v1eventseventid).

## 3. Handle errors

`VerifyException.code` is one of `invalid_event_id`, `timeout`, `network`, `unauthorized`, `not_found`, `expired`, `rate_limited`, `server_error` or `invalid_response`. Events can be verified for 60 minutes.

## Next steps

::: cards
- [Webhooks](integration.md#receiving-webhooks): Trace.verifyWebhook(body, signature, secret)
- [New account fraud](new-account-fraud.md): The full sign-up decision
- [Server SDKs reference](server-sdks.md): Every method and option
:::
