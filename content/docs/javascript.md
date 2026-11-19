# JavaScript

This quickstart adds Trace to any web page with the framework-free browser SDK. You will identify the visitor when they submit a form and send the resulting `eventId` to your backend, where it gets verified.

The example protects a sign-up form, but the steps are the same for login, checkout or any other action.

> [!NOTE]
> **Before you start**
> You need a running Trace server and a **public key** (`pk_...`) whose allowed origins include your page. The [quick start guide](quickstart.md) gets you both in about five minutes. Using [embedded mode](embedded.md)? Your endpoint is the route you mounted, for example `https://api.yourapp.com/trace`.

## 1. Install the SDK

::: code-group
```sh [npm]
npm install @trace-id/sdk-js
```
```sh [pnpm]
pnpm add @trace-id/sdk-js
```
```sh [yarn]
yarn add @trace-id/sdk-js
```
```sh [bun]
bun add @trace-id/sdk-js
```
:::

No bundler? The Trace server hosts the same SDK as one file at `/sdk/sdk.esm.js`:

```html
<script type="module">
  import { createClient } from 'https://id.example.com/sdk/sdk.esm.js';
</script>
```

## 2. Create a client

Create one client when the page loads. It starts collecting device signals in the background, so the call you make later is fast.

```ts
import { createClient } from '@trace-id/sdk-js';

const trace = createClient({
  apiKey: 'pk_...',                      // public key; never a secret key
  endpoint: 'https://id.example.com',    // your Trace server
});
```

## 3. Identify on the action you protect

Call `get()` when the user submits, and pass your own user id as `linkedId` when you have one. Send the `eventId` along with the form.

```ts
const form = document.querySelector('#signup');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  let eventId = null;
  try {
    ({ eventId } = await trace.get({ tags: { action: 'signup' } }));
  } catch (err) {
    console.warn('Trace unavailable', err.code); // fail open: keep going without it
  }
  await fetch('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...Object.fromEntries(new FormData(form)), eventId }),
  });
});
```

`get()` resolves with:

```json
{
  "eventId": "01934f6e-8b7a-7c2e-9f51-3a0d5e2b9c41",
  "visitorId": "Xk3pQ9vLmT2aR7sBn4Wc",
  "deviceId": "Xk3pQ9vLmT2aR7sBn4Wc",
  "confidence": 0.98,
  "suspectScore": 0
}
```

> [!WARNING]
> **Do not decide in the browser**
> Anything the browser returns can be changed by the person using it. Use the `eventId` only as a reference and read the real result on your server.

## 4. Verify on your server

Your backend fetches the event with a secret key and decides. Pick your language:

::: cards
- [Node.js](node.md) brand:nodedotjs: verifyEvent from @trace-id/sdk-node
- [Python](python.md) brand:python: Client.get_event from trace-device
- [PHP](php.md) brand:php: Client::getEvent from trace/trace
- [Java](java.md) brand:openjdk: getEvent from dev.trace:trace
:::

## Next steps

::: cards
- [New account fraud](new-account-fraud.md): Turn the verified event into a sign-up decision
- [Browser SDK reference](browser-sdk.md): Every option, the result and error codes
- [Consent](integration.md#consent): Start disabled and enable after consent
:::
