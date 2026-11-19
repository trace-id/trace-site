# Swift and iOS

This quickstart adds Trace to a native iOS app with the `TraceDevice` Swift package. You allow your app on a public key, identify the device before a sensitive action, and send the `eventId` to your backend for verification.

> [!WARNING]
> **Partly verified**
> The core (payload, hashes and the identify call) passes its tests in CI on macOS: payload and hash parity with the TypeScript SDK, and the client against a stubbed network. The UIKit code that reads the device and stores the token in the Keychain only compiles for iOS, so CI does not build it and it is untested on a device. Try it in your app first.

> [!NOTE]
> **Before you start**
> You need a running Trace server and a **public key** (`pk_...`). The [quick start guide](quickstart.md) covers both. The SDK asks for no permission.

## 1. Install the SDK

```swift
// Package.swift, or Xcode: File > Add Package Dependencies. Until the repository is public, use a local path.
.package(path: "../trace/sdks/swift")
```

## 2. Allow your app on the key

A native app sends no `Origin` header, so list the app itself among the key's allowed origins: `app:` followed by the iOS bundle identifier.

```
app:com.example.shop
```

The SDK names its app in an `X-Trace-App` header. Like the web origin check, this decides which apps may use the key; it does not prove the request came from your app. That proof comes from verifying on your server (step 4).

## 3. Identify before the action

```swift
import TraceDevice

// once, for example in your App or AppDelegate
let trace = makeTraceClient(apiKey: "pk_...", endpoint: "https://id.example.com")

func checkout() async {
    var eventId: String?
    do {
        eventId = try await trace.get(linkedId: userId, tags: ["action": "checkout"]).eventId
    } catch let error as IdentifyError {
        // error.code: timeout, network, invalid_api_key, origin_not_allowed, rate_limited, ... fail open
        print("Trace unavailable: \(error.code)")
    } catch {}
    await api.post("/checkout", ["eventId": eventId as Any])
}
```

Create one client for the app and reuse it. The visitor token is kept in the Keychain, readable after the first unlock and never restored onto another device, so the device is recognised across launches and a new phone is a new device. For consent, `trace.disable()` stops collection and `trace.disable(forget: true)` also deletes the stored token; `trace.enable()` resumes.

What it reads: the OS version, device model, screen size and scale, physical memory, languages, the IANA time zone, the bundle id, version and build, simulator and jailbreak heuristics, and an install id (`identifierForVendor`) hashed with the bundle id so the same phone cannot be matched across different companies' apps. It reads no advertising identifier and does not trigger the App Tracking Transparency prompt. Declare the visitor token as "Device ID" used for fraud prevention in your App Privacy details.

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
