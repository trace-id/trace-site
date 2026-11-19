# Privacy guide for operators

Device identification data is personal data under the GDPR and similar laws. You (the operator) are the controller or processor for what this service stores. This page explains what it stores and which controls exist. It is not legal advice.

## What is stored

| Data | Where | Notes |
| --- | --- | --- |
| Hashed signal components | `visitors.signalSummary`, `events.signals` | One-way hashes computed in the browser. Raw canvas and audio readings never leave the page; for fonts, only which of ~60 common fonts are installed is sent (for cross-browser linking). |
| Device attributes | `events.signals` | The browser's plain readings: screen size, colour depth, pixel ratio, CPU cores, device memory, touch points, time zone, languages, platform, user agent, client hints and GPU vendor and renderer. Used for signals, returned as `rawAttributes`, and deleted with the visitor. High-entropy readings are only ever stored as hashes. |
| IP address | `events.ip` | Per `IP_STORAGE`: `truncated` by default (/24 IPv4, /48 IPv6), or `full`, `hashed` (keyed HMAC), `none`. |
| Your identifiers | `events.linkedId`, `events.tags` | Whatever you send. Avoid sending emails or names; use internal ids. |
| Device profiles (cross-browser linking) | `device_profiles` | Hashed device and OS traits per visitor and network, plus which of ~60 common fonts are installed (a bitmap), whether the GPU is integrated or discrete, and the device clock offset when it is off by 2 s or more, with a keyed hash of the IPv4 /24 or IPv6 /64 (never the address). Deleted with the visitor. Off with `CROSS_BROWSER_LINKING=false` or `IP_STORAGE=none`. |
| Accounts per visitor | `visitor_accounts` | The `linkedId` you send, which visitor it was seen with, and when. Used for `multiAccount`, `accountSharing`, the device graph and the fraud score's account-age features (each event keeps when its account was first seen and whether the device had used it). Deleted with the visitor or when not seen within retention. |
| Visitor cookie (first-party mode) | The browser | An HttpOnly, SameSite=Lax cookie holding the same visitor token the SDK already stores, only when the SDK runs with `firstPartyCookie: true` and the server is same-site with your page. Never a third-party cookie. Off with `VISITOR_COOKIE=false`; `disable(true)` deletes it. |
| Input behaviour | `events.signals` (`automatedInput` details) | From SDK start to identify: counts of pointer moves, clicks, key presses, scrolls and touches; how many were created by scripts; how straight the pointer path was; how regular key timing was. Never which keys, never coordinates or page elements. Recording starts only while collection is enabled and stops on `disable()`. |
| Environment codes | `events.signals` | Short values used by signals, not hashed: the JavaScript engine (blink, gecko, webkit), client-hints OS version, CPU architecture and full browser version, timer precision, permission states as letters (granted, denied or prompt, read without asking), multi-monitor flag, Global Privacy Control and Do Not Track, connection type and round-trip estimate, whether the page is framed, window size. No permission is ever requested and nothing reads devices, files or location. |
| Consistency checks | `events.signals` | Names of browser readings that differed between the page, a Web Worker and an iframe (for `antiDetect`); never the readings. |
| App readings (React Native SDK) | `events.signals` | Platform, OS version, manufacturer, model, app id and version, emulator and root flags, first install time; the install id only as a SHA-256 salted with the app id, so it cannot be linked across companies' apps. No location, contacts, advertising id or IMEI. Deleted with the visitor. |
| Fraud labels | `event_labels`, `fraud_models` | Your fraud or legit verdict per event and fraud type, the visitor id, and the names of the signals that fired on that event (no readings). Models hold only per-signal weights. Labels are deleted with the visitor. |
| IP address sent to IP data providers | The providers in `IP_PROVIDERS`, if any | Only the visitor IP (never for private or reserved addresses), to look up country, ASN, VPN, proxy and similar flags. Off by default; with it on, each provider is your processor: sign its data processing agreement and list it in your privacy policy. Answers are cached in server memory, keyed by IP, for `IP_PROVIDER_CACHE_HOURS`. |
| Velocity counters | Redis | Counts and HyperLogLog sketches keyed by visitor id and hashed IP; expire within 25 hours. |

Nothing leaves your deployment unless you configure an external provider.

## Controls

- **Retention:** per-project `retentionDays` (default 30) and a global cap `RETENTION_MAX_DAYS` (default 90). See [api.md](api.md#retention).
- **Deletion requests:** `DELETE /v1/visitors/:visitorId` removes the visitor and every event for it.
- **Consent:** the browser SDK can start disabled (`enabled: false`) and be enabled by your consent manager; `disable(true)` also deletes the stored visitor token.
- **Minimisation:** keep `IP_STORAGE=truncated` or stricter unless a feature needs full addresses.
- **Cross-browser linking** connects a person's visits across browsers on one device. That is more intrusive than recognising one browser, and browser makers and regulators treat it as tracking. It is on by default for fraud prevention; turn it off (`CROSS_BROWSER_LINKING=false`) if your purpose or legal basis does not cover it, and mention it in your privacy notice if you keep it.

## Handling a deletion request

1. Find the visitor id(s). If the request comes from one of your users, look up events by your own `linkedId` (event search arrives with the dashboard; until then keep the `visitorId` from verified events next to your user record).
2. Call `DELETE /v1/visitors/:visitorId` for each id. A `204` confirms deletion; a `404` means nothing is stored.
3. Delete any copies you keep in your own systems.
4. Record that the request was completed.

Backups of the Postgres database keep deleted data until they rotate out; set backup retention accordingly.

## Lawful basis and consent

Whether you need consent depends on your jurisdiction and purpose. In the EU, reading device characteristics generally falls under the ePrivacy rules on terminal equipment, with an exemption only where strictly necessary for a service the user requested; fraud prevention on login or payment is commonly argued under legitimate interest, but take legal advice for your case. A DPA template will be added for review.
