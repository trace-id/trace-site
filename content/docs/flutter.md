# Flutter

This quickstart adds Trace to a Flutter app with the `trace_device` package. You allow your app on a public key, identify the device before a sensitive action, and send the `eventId` to your backend for verification.

> [!WARNING]
> **Partly verified**
> The core of this SDK (the payload, the hashes and the identify call) is plain Dart and is tested against the TypeScript SDK's output. The Flutter glue that reads the device through plugins (`lib/flutter.dart`) was written without a Flutter build and has not been run on a device yet. Test it in your app before you rely on it.

> [!NOTE]
> **Before you start**
> You need a running Trace server and a **public key** (`pk_...`). The [quick start guide](quickstart.md) covers both. The SDK asks for no permission and has no native code of its own. Android and iOS only: it relies on 64-bit integers, which Flutter web does not have.

## 1. Install the package

Until it is published, depend on it from the repository, and add the plugins the glue uses:

```yaml
# pubspec.yaml
dependencies:
  trace_device:
    path: ../trace/sdks/flutter # or a git dependency on the repository
  device_info_plus: ^9.0.0
  package_info_plus: ^5.0.0
  flutter_secure_storage: ^9.0.0
  crypto: ^3.0.0
```

## 2. Allow your app on the key

A native app sends no `Origin` header, so list the app itself among the key's allowed origins: `app:` followed by the iOS bundle identifier or the Android application id.

```
app:com.example.shop
```

The SDK names its app in an `X-Trace-App` header. Like the web origin check, this decides which apps may use the key; it does not prove the request came from your app. That proof comes from verifying on your server (step 4).

## 3. Identify before the action

```dart
import 'package:trace_device/flutter.dart';

final trace = createTraceClient(
  apiKey: const String.fromEnvironment('TRACE_PUBLIC_KEY'),
  endpoint: const String.fromEnvironment('TRACE_ENDPOINT'),
);

Future<void> checkout() async {
  try {
    final result = await trace.get(linkedId: userId, tags: {'action': 'checkout'});
    await api.post('/checkout', {'eventId': result.eventId});
  } on IdentifyException catch (e) {
    // e.code: timeout, network, invalid_api_key, origin_not_allowed, rate_limited, ...
    await api.post('/checkout', {'eventId': null}); // fail open: keep going without it
  }
}
```

Create one client for the app and reuse it. The visitor token is kept in the Keychain (iOS) or Keystore-backed storage (Android), so the device is recognised across launches. For consent, `trace.disable()` stops collection and `trace.disable(forget: true)` also deletes the stored token; `trace.enable()` resumes.

What it reads: the platform and OS version, the device model and manufacturer, screen size and pixel ratio, languages, the app id, version and build, whether it is a physical device, and an install id hashed with the app id so the same phone cannot be matched across different companies' apps. The time zone is an abbreviation such as `CET`, because Dart has no IANA zone name. It does not read memory size, root status or the Android install id without native code, so those stay empty.

## 4. Verify on your server

Anything an app reports can be forged on a rooted device, so decide only from the event your server verifies with the secret key.

::: cards
- [Node.js](node.md) brand:nodedotjs: verifyEvent and Express/Fastify guards
- [Python](python.md) brand:python: Client.get_event and framework guards
- [PHP](php.md) brand:php: Client::getEvent and a Laravel middleware
- [Go](go.md) brand:go: GetEvent and a net/http guard
:::

## Next steps

::: cards
- [React Native and Expo](react-native.md): The same SDK for React Native apps
- [New account fraud](new-account-fraud.md): Turn the verified event into a decision
:::
