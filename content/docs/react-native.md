# React Native & Expo

This quickstart adds Trace to a React Native app with `@trace-id/sdk-react-native`. You allow your app on a public key, wrap the app in a provider, identify the device before a sensitive action, and send the `eventId` to your backend for verification.

> [!NOTE]
> **Before you start**
> You need a running Trace server and a **public key** (`pk_...`). The [quick start guide](quickstart.md) covers both. The SDK works in Expo Go, in development builds and in bare React Native apps with Expo modules installed. It has no config plugin and no native code of its own.

## 1. Install the SDK

`npx expo install` picks the versions of the Expo modules that match your SDK:

::: code-group
```sh [Expo]
npx expo install @trace-id/sdk-react-native expo-application expo-crypto expo-device expo-localization expo-secure-store
```
```sh [Bare React Native]
npx install-expo-modules@latest
npx expo install @trace-id/sdk-react-native expo-application expo-crypto expo-device expo-localization expo-secure-store
```
:::

## 2. Allow your app on the key

A native app sends no `Origin` header, so list the app itself among the key's allowed origins, next to your web origins: `app:` followed by the iOS bundle identifier or the Android application id.

```
https://shop.example.com
app:com.example.shop
```

The SDK names its app in an `X-Trace-App` header. Like the web origin check, this decides which apps may use the key; it does not prove the request came from your app. That proof comes from verifying on your server (step 5).

## 3. Add the provider

```tsx
// App.tsx
import { IdentifyProvider } from '@trace-id/sdk-react-native';

export default function App() {
  return (
    <IdentifyProvider apiKey={process.env.EXPO_PUBLIC_TRACE_PUBLIC_KEY!} endpoint={process.env.EXPO_PUBLIC_TRACE_ENDPOINT!}>
      <RootNavigator />
    </IdentifyProvider>
  );
}
```

```dotenv
EXPO_PUBLIC_TRACE_PUBLIC_KEY=pk_...
EXPO_PUBLIC_TRACE_ENDPOINT=https://id.example.com
```

## 4. Identify before the action

`useVisitorData` is the same hook as in the React SDK: `{ data, error, isLoading, getData }`. With `immediate: false` nothing runs until you call `getData`.

```tsx
// CheckoutScreen.tsx
import { useVisitorData } from '@trace-id/sdk-react-native';

export function CheckoutScreen({ order, user }: Props) {
  const { getData, isLoading } = useVisitorData({ immediate: false });

  async function pay() {
    const result = await getData({ linkedId: user.id, tags: { screen: 'checkout' } }); // null if Trace is unavailable
    await api.post('/orders/pay', { orderId: order.id, eventId: result?.eventId });
  }

  return <Button title="Pay" onPress={pay} disabled={isLoading} />;
}
```

`getData` never throws. On failure it resolves `null` and sets `error`, an `IdentifyError` with a `code` such as `timeout`, `network` or `origin_not_allowed`.

## 5. Verify on your server

Never act on what the app sends: on a rooted phone anything can be changed. Your backend fetches the event with a secret key, exactly as for the web:

::: cards
- [Node.js](node.md) brand:nodedotjs: verifyEvent from @trace-id/sdk-node
- [Python](python.md) brand:python: Client.get_event from trace-device
- [PHP](php.md) brand:php: Client::getEvent from trace/trace
- [Java](java.md) brand:openjdk: getEvent from dev.trace:trace
:::

Events from apps carry an `app` object and two app signals:

```json
{
  "visitorId": "…",
  "suspectScore": 30,
  "reasons": [{ "signal": "emulator", "contribution": 30 }],
  "app": { "platform": "android", "osVersion": "15", "manufacturer": "Google", "model": "sdk_gphone64_x86_64", "appId": "com.example.shop", "appVersion": "2.4.0", "buildVersion": "240", "isDevice": false, "rooted": false, "installedAt": 1763481600000 }
}
```

| Signal | Weight | Fires when |
| --- | --- | --- |
| `emulator` | 30 | The app runs on an emulator or simulator |
| `rootedDevice` | 20 | Root (Android) or jailbreak (iOS) checks match |

The signals that do not depend on a browser apply too: VPN by time zone, Tor, datacenter and proxy IPs, velocity, accounts per device, flagged networks, replayed and tampered requests, and the [fraud score](api.md#fraud-score).

## How devices are recognised

- **Every launch:** a visitor token kept in the Keychain or Keystore (expo-secure-store, this device only). On iOS it survives reinstalls.
- **After a reinstall that lost the token:** the install id (identifierForVendor on iOS, ANDROID_ID on Android), hashed on the phone with your app id as salt. The raw id never leaves the device, and the same phone cannot be matched across different companies' apps.
- **Phones of the same model:** they share every other reading, so two installs with different install ids are never merged.

No permission prompt appears. The SDK does not read location, contacts, the advertising id or the IMEI.

> [!WARNING]
> **Not covered yet**
> Cloned apps, Frida and other hooking tools, factory resets, active calls, mocked GPS and on-device VPNs need native code beyond the Expo modules. They are on the roadmap for native iOS and Android SDKs.

## Next steps

::: cards
- [Signal catalog](signals.md): Every signal, its weight and its false positives
- [Fraud score](api.md#fraud-score): Learn a score from your own labels
- [Consent](integration.md#consent): Start disabled and call useIdentifyClient().enable()
:::
