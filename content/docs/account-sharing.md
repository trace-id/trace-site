# Account sharing

When one login is used on many devices, it is usually a shared subscription, a sold account or a credential-stuffing success. Trace counts the distinct devices behind each account so you can ask for a re-login, limit sessions or flag the account.

**What you will build:** a login check that notices when an account is used on more devices than you allow.

## 1. Identify with the account id

Pass your user id as `linkedId` every time a signed-in user is identified: at login, and optionally on app start.

```ts
const { eventId } = await trace.get({ linkedId: user.id, tags: { action: 'login' } });
```

Use an internal id, not an email. Trace only counts accounts it has seen through `linkedId`.

## 2. Read the device count

```ts
const event = await verifyEvent(eventId, { secretKey, endpoint, timeoutMs: 1500 }).catch(() => null);
const sharing = event?.signals.accountSharing;

if (sharing?.detected) {
  // devicesForAccount is above accounts.maxDevicesPerAccount (5 by default) within 30 days
  console.info('account on many devices', user.id, sharing.details.devicesForAccount);
}
```

Devices are counted by `deviceId`, so Chrome and Firefox on one laptop are one device, not two.

## 3. Choose a response

| Your product | Typical response |
| --- | --- |
| Streaming or SaaS seats | Show "signed in on too many devices" and end the oldest session |
| Marketplace or fintech | Require a one-time code on new devices |
| Anything after a breach | Force a password reset when `accountSharing` and `velocity` fire together |

Raise or lower the limit with `accounts.maxDevicesPerAccount` in the [scoring file](configuration.md).

> [!TIP]
> **Families share**
> A household with phones, tablets and a laptop can pass five devices. Measure your own distribution before enforcing.

## Next steps

::: cards
- [New account fraud](new-account-fraud.md): The opposite case: many accounts, one device
- [Signal catalog](signals.md#signal-accountSharing): How accountSharing is detected
:::
