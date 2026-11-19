# New account fraud

One person opening many accounts is behind most promo abuse, fake reviews, referral farming and trial abuse. This guide uses Trace to recognise the device behind each sign-up, even when the person switches email, clears cookies or opens a private window, and turns that into a sign-up decision.

**What you will build:** a sign-up endpoint that lets normal users straight through, asks repeat sign-ups from one device to verify, and blocks automated ones.

> [!NOTE]
> **Before you start**
> Finish one Web quickstart (for example [React](react.md)) and one Server quickstart (for example [Node.js](node.md)). The code below is Node.js; every server SDK returns the same event.

## 1. Identify on the sign-up form

Call the SDK when the form is submitted and send the `eventId` with it. Tag the event so you can filter it later.

```ts
const { eventId } = await trace.get({ tags: { action: 'signup' } });
```

## 2. Verify and read the device

On your server, verify the event and pull out what you need for the decision.

```ts
const event = await verifyEvent(eventId, { secretKey, endpoint, timeoutMs: 1500 }).catch(() => null);

const deviceId = event?.deviceId;                                   // the same for every browser on this machine
const accounts = event?.signals.multiAccount.details.accountsOnDevice; // accounts already seen on it
const automated = event?.signals.bot.detected || event?.signals.automatedInput.detected;
```

## 3. Decide

Order matters: block the clearly automated first, then slow down repeats, then let everyone else in.

```ts
if (event && (automated || event.suspectScore >= 60)) {
  return res.status(403).json({ error: 'signup_blocked' });
}
if (event?.signals.multiAccount.detected) {
  // More accounts on this device than accounts.maxAccountsPerDevice (2 by default) within 30 days.
  return res.status(202).json({ next: 'verify-phone' });
}
const user = await createUser(req.body.email, { traceDeviceId: deviceId, traceVisitorId: event?.visitorId });
```

`multiAccount` counts accounts per **device**, so a second browser on the same laptop counts too. The limit and window live in the [scoring file](configuration.md) under `accounts`.

## 4. Link the account

Once the account exists, pass its id as `linkedId` on later identifications (log in, checkout). This is what lets Trace count accounts per device.

```ts
const { eventId } = await trace.get({ linkedId: user.id });
```

Use an internal id, never an email address.

## 5. Look up a suspicious device

From your admin tools, list every browser and account that shares a device:

```sh
curl -H "Authorization: Bearer sk_..." https://id.example.com/v1/devices/Xk3pQ9vLmT2aR7sBn4Wc
```

The response lists each `visitorId` with its browser and every `linkedId` seen on the device. With [embedded mode](embedded.md) it is `await trace.device(deviceId)`.

> [!TIP]
> **Roll it out safely**
> Ship steps 1 to 4 with logging only. After a week, check how many real users would have hit `verify-phone`, then switch the response on. Families and shared office computers are the usual false positives.

## Next steps

::: cards
- [Ban evasion](ban-evasion.md): Keep banned devices out
- [Bot protection](bot-protection.md): Stop scripted sign-ups
- [Signal catalog](signals.md#signal-multiAccount): How multiAccount is detected
:::
