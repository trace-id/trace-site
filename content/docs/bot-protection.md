# Bot protection

Scripts that sign up, log in, scrape or buy faster than people do usually run in a headless or automated browser. Trace detects the automation itself, not just the IP, so it still works when the bot rotates proxies.

**What you will build:** a check in front of a sensitive endpoint that blocks automated browsers and sends doubtful ones to a challenge.

## The signals that matter

| Signal | Detects | Default weight |
| --- | --- | ---: |
| [`bot`](signals.md#signal-bot) | Headless Chrome, `navigator.webdriver`, Puppeteer, Playwright and Selenium traces | 60 |
| [`automatedInput`](signals.md#signal-automatedInput) | Clicks and keys created by scripts, ruler-straight pointer paths | 30 |
| [`antiDetect`](signals.md#signal-antiDetect) | Browsers that contradict themselves, like anti-detect profiles | 40 |
| [`tlsMismatch`](signals.md#signal-tlsMismatch) | A TLS fingerprint that no real browser sends (needs a proxy header) | 30 |
| [`datacenterIp`](signals.md#signal-datacenterIp) | Traffic from cloud and hosting ranges | 15 |
| [`velocity`](signals.md#signal-velocity) | Too many events per visitor, IP or account in a short window | 20 |

## 1. Identify late

Call `get()` right before the protected action (the submit, not the page load). `automatedInput` watches input between the SDK starting and `get()`, so the gap gives it something to look at.

```ts
const trace = createClient({ apiKey, endpoint }); // on page load
// ...
const { eventId } = await trace.get({ tags: { action: 'login' } }); // on submit
```

## 2. Decide on the server

```ts
const event = await verifyEvent(eventId, { secretKey, endpoint, timeoutMs: 1500 }).catch(() => null);
const s = event?.signals;

if (s?.bot.detected || s?.tlsMismatch.detected) return res.status(403).end();
if (s?.automatedInput.detected || s?.antiDetect.detected || (event?.suspectScore ?? 0) >= 40) {
  return res.status(401).json({ next: 'captcha' });
}
```

`event.reasons` lists which signals added how much, for example `[{ "signal": "bot", "contribution": 60 }]`. Log it with every decision so you can explain a block later.

## 3. Make it hard to skip

A bot can simply not run your JavaScript. Make the `eventId` required on the endpoint:

```ts
if (!eventId) return res.status(400).json({ error: 'missing_device_check' });
```

Then a missing or made-up `eventId` fails verification, and a replayed one is still tied to the original visitor. Events expire after 60 minutes.

> [!WARNING]
> **Mind the false positives**
> Accessibility tools, some privacy extensions and corporate VPNs can trip weaker signals. Block only on strong ones (`bot`, `tlsMismatch`) and challenge on the rest.

## Next steps

::: cards
- [Signal catalog](signals.md): Every signal with its false positives
- [IP intelligence](signals.md#ip-intelligence): Load Tor, datacenter and blocklists
- [TLS fingerprints](signals.md#tls-fingerprints): Pass JA4 from your proxy
:::
