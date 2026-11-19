# Ban evasion

Banning an email or an IP rarely sticks: people make a new address, clear cookies, open a private window or switch browser. Ban the **device** instead. Trace gives every browser a `visitorId` and links browsers on the same machine under one `deviceId`.

**What you will build:** a ban list keyed by device, checked on sign-up and login.

## 1. Store the device with the account

When an account is created or signs in, save the verified `deviceId` and `visitorId` next to it.

```ts
const event = await verifyEvent(eventId, { secretKey, endpoint, timeoutMs: 1500 }).catch(() => null);
if (event) await db.accountDevices.upsert({ userId: user.id, deviceId: event.deviceId, visitorId: event.visitorId });
```

## 2. Ban the device

When you ban a user, ban every device you have seen them on.

```ts
const devices = await db.accountDevices.findMany({ userId: bannedUser.id });
await db.bannedDevices.insertMany(devices.map((d) => ({ deviceId: d.deviceId, reason: 'tos', at: new Date() })));
```

## 3. Check every sign-up and login

Check the device, and also the other browsers Trace has linked to it.

```ts
const ids = [event.deviceId, event.visitorId, ...event.linkedVisitors.map((v) => v.visitorId)];
if (await db.bannedDevices.exists({ deviceId: { in: ids } })) {
  return res.status(403).json({ error: 'banned' });
}
```

`linkedVisitors` lists other browsers or profiles that look like this machine, each with a `confidence` and whether they shared a network. Linking needs `crossBrowser` turned on (the default).

## 4. Investigate

Before acting on a match, list everything on the device:

```sh
curl -H "Authorization: Bearer sk_..." https://id.example.com/v1/devices/Xk3pQ9vLmT2aR7sBn4Wc
```

You get every browser on the device and every account seen with it.

> [!WARNING]
> **Shared computers**
> Libraries, internet cafes and families share machines. Treat a device match as strong evidence, not proof: send it to review, or require extra verification, before a permanent ban.

## Next steps

::: cards
- [Cross-browser linking](signals.md#cross-browser-linking): How browsers are tied to one device
- [New account fraud](new-account-fraud.md): Limit accounts per device
- [Privacy](privacy.md): Deleting a visitor on request
:::
