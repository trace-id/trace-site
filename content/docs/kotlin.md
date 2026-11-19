# Kotlin and Android

This quickstart adds Trace to a native Android app with the `dev.trace.device` Kotlin library. You allow your app on a public key, identify the device before a sensitive action, and send the `eventId` to your backend for verification.

> [!WARNING]
> **Partly verified**
> The core library (the payload, the hashes and the identify call) is plain Kotlin and is tested against the TypeScript SDK's output. The Android module that reads the device and stores the token (`sdks/kotlin/android`) was written without the Android SDK and has not been built or run on a device. Test it in your app before you rely on it.

> [!NOTE]
> **Before you start**
> You need a running Trace server and a **public key** (`pk_...`). The [quick start guide](quickstart.md) covers both. The SDK asks for no permission.

## 1. Install the SDK

```kotlin
// build.gradle.kts of your app. Until the artifacts are published, include the repository's sdks/kotlin build
dependencies { implementation(project(":trace-device-android")) }
```

## 2. Allow your app on the key

A native app sends no `Origin` header, so list the app itself among the key's allowed origins: `app:` followed by the application id.

```
app:com.example.shop
```

The SDK names its app in an `X-Trace-App` header. Like the web origin check, this decides which apps may use the key; it does not prove the request came from your app. That proof comes from verifying on your server (step 4).

## 3. Identify before the action

```kotlin
import dev.trace.device.android.createTraceClient

// once, for example in your Application class
val trace = createTraceClient(applicationContext, apiKey = "pk_...", endpoint = "https://id.example.com")

// blocking: call from a background thread or a coroutine on Dispatchers.IO
suspend fun checkout() = withContext(Dispatchers.IO) {
    val eventId = try {
        trace.get(linkedId = userId, tags = mapOf("action" to "checkout")).eventId
    } catch (e: IdentifyException) {
        null // e.code: timeout, network, invalid_api_key, origin_not_allowed, rate_limited, ... fail open
    }
    api.post("/checkout", mapOf("eventId" to eventId))
}

// or with a callback
trace.getAsync(linkedId = userId) { outcome -> /* outcome.getOrNull()?.eventId */ }
```

Create one client for the app and reuse it. The visitor token is kept encrypted with a key in the Android Keystore, so the device is recognised across launches. For consent, `trace.disable()` stops collection and `trace.disable(forget = true)` also deletes the stored token; `trace.enable()` resumes. Exclude the `trace_device` preferences file from Auto Backup so a restore onto a new phone starts a new identity.

What it reads: the OS version, device model and manufacturer, screen size and density, total memory, languages, the IANA time zone, the application id, version and build, emulator and root heuristics, and an install id (`ANDROID_ID`) hashed with the application id so the same phone cannot be matched across different companies' apps.

## 4. Verify on your server

Anything an app reports can be forged on a rooted or jailbroken device, so decide only from the event your server verifies with the secret key.

::: cards
- [Node.js](node.md) brand:nodedotjs: verifyEvent and Express/Fastify guards
- [Python](python.md) brand:python: Client.get_event and framework guards
- [PHP](php.md) brand:php: Client::getEvent and a Laravel middleware
- [Go](go.md) brand:go: GetEvent and a net/http guard
:::

## Next steps

::: cards
- [React Native and Expo](react-native.md): The same SDK for React Native apps
- [Flutter](flutter.md): The same SDK for Flutter apps
- [New account fraud](new-account-fraud.md): Turn the verified event into a decision
:::
