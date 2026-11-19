# Signal catalog

Each signal is defined in [`packages/signals/src/definitions.ts`](../packages/signals/src/definitions.ts) and contributes its weight from [`scoring.default.json`](../scoring.default.json) to the suspect score (0 to 100, capped) when detected. Every event lists the contributing signals in `reasons`.

Signals that read the network need data you supply (IP lists, a GeoIP database, a TLS fingerprint header); they report `available: false` until it is there, so they never fire on missing data. Mobile-only signals (`emulator`, `rootedDevice`) come from the React Native SDK. Each row ends with the known false positives: read them before you block on a signal.

| Signal | Default weight | How it is detected | False positives |
| --- | ---: | --- | --- |
| `bot` | 60 | One strong indicator (`navigator.webdriver`, `HeadlessChrome` UA or client-hints brand, automation globals from Puppeteer/Playwright/Selenium, the HTTP `User-Agent` differing from the one the page reported) or two weak ones (no plugins on desktop Chromium, empty languages, notification permission inconsistency, missing `window.chrome`, zero outer window size, the DevTools protocol reading a logged error as Puppeteer and Playwright do, ignored when DevTools is visibly open; an 800x600 desktop screen; a 0 ms connection round trip). | Accessibility tools and some privacy extensions trip weak indicators; that is why two are required. |
| `tampering` | 25 | Native functions whose source is not `[native code]`, navigator properties shadowed on the instance, UA platform vs `navigator.platform` mismatch, UA claiming a browser whose features are missing. | Anti-fingerprinting extensions trigger this by design. Treat it as "this browser lies about itself", not as fraud by itself. Canvas noise (Brave, Firefox RFP) is reported in details but does not trigger the signal alone. `details.anomalyScore` (0 to 1) combines every self-contradiction found, here and in `antiDetect`, into one number. |
| `tor` | 30 | Request IP in the operator-supplied Tor exit list (`TOR_EXIT_LIST_FILE`). | Exit lists lag reality; a recycled IP may be flagged after it stopped being an exit. |
| `datacenterIp` | 15 | Request IP in an operator-supplied datacenter/hosting CIDR list (`DATACENTER_CIDR_FILE`). Most commercial VPNs exit from such ranges. | Corporate egress through cloud security gateways and iCloud Private Relay can come from hosting ranges. |
| `ipBlocklist` | 40 | Request IP in an operator-supplied blocklist (`IP_BLOCKLIST_FILE`). | Shared IPs (CGNAT, mobile carriers, universities) can put innocent users on a list. |
| `velocity` | 20 | Redis counters over sliding windows: events per visitor in 5 minutes and per hour, distinct visitors per IP per hour, distinct IPs, countries (needs GeoIP) and `linkedId`s per visitor per day, distinct visitors per `linkedId` per day. Thresholds in `scoring.default.json`; `details.exceeded` lists which. | Offices, schools and mobile carriers put many real visitors behind one IP. Raise `visitorsPerIp1h` for CGNAT-heavy audiences. Travellers on roaming networks change country. Not evaluated (reported as unavailable) without Redis. |
| `incognito` | 5 | Chromium: storage quota below twice the JS heap limit. Firefox: `serviceWorker` hidden in a secure context. Safari: OPFS rejects with "unknown transient reason". | Low-disk devices get small quotas and can look private; browsers change these behaviours between releases. Low weight on purpose. |
| `devtools` | 5 | Window more than 160 px wider (or 280 px taller) than the viewport, the footprint of docked developer tools. Desktop only. | Sidebars, zoom and some window managers cause the same gap; undocked devtools are missed. |
| `virtualMachine` | 15 | WebGL renderer names a hypervisor adapter (VMware, VirtualBox, Parallels, QEMU/virgl, Hyper-V) or a software rasterizer (llvmpipe, SwiftShader, Microsoft Basic Render). | Remote desktops, thin clients, Linux without GPU drivers, hardware acceleration turned off. |
| `privacyBrowser` | 5 | Brave (`navigator.brave`), Tor or Mullvad Browser (Firefox, UTC timezone, letterboxed screen), DuckDuckGo, canvas farbling, or a timer coarsened to 16 ms or more (Tor, Firefox resistFingerprinting). | These are legitimate privacy choices. Use it to explain lower confidence, not to block. |
| `highActivity` | 15 | More than `eventsPerVisitor24h` (default 500) events from one visitor in 24 hours (Redis). | Kiosks, QA machines, single-page apps that identify on every route change. |
| `crossBrowser` | 15 | Another visitor in a different browser or profile shares this device's hardware and OS traits and a network (now or within 30 days), with link confidence of at least 0.8. See [cross-browser linking](#cross-browser-linking). | Families or offices on one network with identical computers (same model, OS image, fonts). |
| `antiDetect` | 40 | The browser contradicts itself (see [anti-detect checks](#anti-detect-checks)): a Web Worker or a fresh iframe reports a different user agent, platform, languages, CPU count, time zone, GPU or webdriver flag than the page; `Date#getTimezoneOffset` disagrees with the `Intl` time zone; the GPU belongs to another OS than the user agent claims; two fonts that ship only with another OS are installed; or the `Sec-CH-UA-Platform` request header, set by the browser's network stack, names another OS than `navigator.userAgent`. Also: the engine that runs the page (read from the wording of a built-in TypeError, which differs between V8, SpiderMonkey and JavaScriptCore) does not fit the browser in the user agent (`engineMismatch`); the client-hints full version does not fit the user-agent version (`uaVersionMismatch`); the first language of the `Accept-Language` header, sent by the network stack, differs from `navigator.languages` (`languageHeaderMismatch`). Catches anti-detect browsers (Multilogin, GoLogin, AdsPower, Dolphin and similar) that give every profile a made-up device. `details.reasons` names what disagreed. | User-agent switcher extensions and DevTools device emulation (a phone user agent on a desktop GPU); a time zone changed while the page was open. Brave's randomised CPU count is ignored for Brave. |
| `vpn` | 20 | Any of these methods (listed in `details.methods`): `timezoneMismatch`, no zone of the IP country has the device's UTC offset at that moment (needs `GEOIP_COUNTRY_DB`; offsets are compared, not zone names, so Windows' coarse zones and daylight saving are handled); `publicVpn`, the IP is in `VPN_CIDR_FILE` or its ASN in `VPN_ASN_FILE`. Privacy relays (`RELAY_CIDR_FILE`, e.g. iCloud Private Relay) are reported as `details.relay` but do not fire it. | Travellers who keep their home time zone; borders; stale GeoIP data; stale VPN lists. Devices set to UTC are not judged by time zone. A VPN to a country in the same offset is missed by the time-zone method. |
| `tlsMismatch` | 30 | The JA4 TLS fingerprint, supplied by a trusted proxy (`TLS_FINGERPRINT_HEADER`), does not fit a browser user agent: no TLS 1.3, no SNI, or no HTTP/2 ALPN offer, which every current browser sends. Also fires for fingerprints in `JA4_BLOCKLIST_FILE`. Catches HTTP libraries that copy a browser user agent. Unavailable without the header. | TLS-inspecting corporate proxies re-terminate TLS with their own client; very old browsers fail the TLS 1.3 test. |
| `multiAccount` | 25 | More than `accounts.maxAccountsPerDevice` (2) distinct `linkedId`s used this device (its `deviceId`, so every browser on it counts) within `accounts.windowHours` (30 days). The pattern of signup abuse, ban evasion and promotion farming. | Shared family computers, internet cafes, support staff, QA machines. Counts only what you pass as `linkedId`. |
| `accountSharing` | 10 | One `linkedId` used on more than `accounts.maxDevicesPerAccount` (5) distinct devices within the window: shared credentials, a sold or stolen account, or successful credential stuffing. | People with many devices; reinstalled devices; privacy browsers that look new on every visit. |
| `automatedInput` | 30 | Input between SDK start and identify that no person produces: pointer, click, key or touch events created by page scripts (`isTrusted` false), a ruler-straight pointer path over 20 or more moves, or key presses at machine-regular intervals (standard deviation under 3 ms over 9 or more keys). Only counts and timing statistics are collected, never keys, coordinates or targets. | Sites whose own code dispatches synthetic clicks or key events, some accessibility and remote-control tools. |
| `aiAgent` | 20 | The request's user agent declares an AI assistant acting for a person (`ChatGPT-User`, `Claude-User`, `Perplexity-User`, `MistralAI-User`, `DuckAssistBot`) and the request carries no verified Web Bot Auth signature and does not come from the operator's published IP ranges (`CRAWLER_RANGES_FILE`). `details` gives `name`, `provider`, `identity` and, when a signature was sent, `signatureAgent`, `signatureVerified` and `signatureError`. Signed and range-verified agents do not fire it; see [bots and AI agents](#bots-and-ai-agents). | People use assistants for legitimate tasks: step up rather than block. Only declared agents are seen; an agent driving an ordinary browser without saying so is caught, if at all, by `bot` and `automatedInput`. |
| `proxy` | 20 | Request IP in an operator-supplied proxy exit list (`PROXY_CIDR_FILE`): residential or datacenter proxies rented to hide where traffic comes from. `details.available` is false without a list. | Residential proxy networks run on ordinary home connections, often without the owner knowing, so a household sharing an exit can be listed. Lists go stale quickly. |
| `rareDevice` | 10 | The device's `webgl`, `webglParams`, `screen`, `hardware` and `platform` values combine into an estimated share of this project's visitors below `rareDevice.maxShare` (0.0001), once the project has `rareDevice.minVisitors` (1000) visitors in its component statistics. `details.rarest` names the least common component. Needs component statistics: the server keeps them; embedded storage adapters without `frequencies()` report `available: false`. | New hardware, unusual monitors and niche platforms are rare without being risky. The estimate treats components as independent, which overstates rarity for values that go together. |
| `emulator` | 30 | A native app (React Native SDK) on an emulator or simulator (expo-device `isDevice` false). Emulators are cheap to clone and reset, so device farms run on them. Not available for browsers. | Your own developers and QA. Use a separate key or a tag for development builds. |
| `rootedDevice` | 20 | A native app on a rooted Android or jailbroken iOS device (expo-device's heuristics: su binaries, Cydia and similar paths, writable system locations). Root makes it easy to hook the app, fake readings and clone installs. Not available for browsers. | Enthusiasts root phones for legitimate reasons and some custom ROMs look rooted. Hiding tools (Magisk DenyList and similar) defeat the checks, so a clean result is not proof. |
| `flaggedNetwork` | 15 | Other visitors on the same IP network (the /24 or /64 that cross-browser linking keys, never the raw address) were flagged recently: at least `flaggedNetwork.minFlagged` (2) of them had an event scoring `flaggedNetwork.flagScore` (70) or more in the last `flaggedNetwork.windowHours` (24), and they are at least `flaggedNetwork.minShare` (25%) of the other visitors seen there. Device farms and fraud rings work from shared networks. A neighbour's own `flaggedNetwork` points are taken off its score first, so the signal cannot spread from visitor to visitor. `details` gives `visitors`, `flagged` and `share`. Needs cross-browser linking on (it reuses the network key); otherwise `available: false`. | A legitimate visitor on a network a fraud ring also uses: a small office, hotel or cafe, a shared residential proxy exit. The share rule keeps mobile carriers and large offices, where flagged visitors are a small fraction, from firing. Treat it as context for review, not a reason to block on its own. |
| `replayedRequest` | 50 | The identify request carries a nonce Trace already saw in the last 24 hours: the same request was sent again, typically one captured from a real browser and re-sent by a script so a bot inherits a clean device. The SDK draws a new random nonce per call. A client can edit anything it sends, so this catches verbatim replays; a replay with a rewritten payload is left to `tamperedRequest` and the other signals. `details.sentAgoMs` is how long before receipt the SDK sent it (wrong device clocks skew it too). Not available for SDKs that send no nonce, or in embedded mode with `counters: false`. | The SDK never reuses a nonce and never retries on its own. A proxy, extension or service worker that re-sends the same request body is counted. Replays after 24 hours are not caught. |
| `tamperedRequest` | 30 | The identify payload contradicts itself: its readable attributes (screen, time zone, languages, platform, GPU, hardware) do not hash to its own `screen`, `timezone`, `languages`, `platform`, `webgl` and `hardware` components. The SDK derives both from one reading, so a mismatch means the payload was edited after collection or built by hand. Components a payload leaves out are not judged. `details.mismatched` names the components. | An unmodified SDK never produces a mismatch. A self-built or patched SDK that changes how a component is derived will, until this check changes with it. |

## Bots and AI agents

Every event carries `botInfo`, one verdict for the visit:

| Field | Values |
| --- | --- |
| `result` | `good`: a declared crawler (search engine, AI crawler) or an AI agent that proved its identity. `bad`: automation (the `bot` signal) or an AI agent that did not. `notDetected`: neither. |
| `type` | `searchEngine`, `aiCrawler`, `aiAgent`, `automation`, or null |
| `name`, `provider` | For example `Googlebot` / `Google`, `ChatGPT agent` / `OpenAI`, `Playwright` / null |
| `identity` | `signed`: proven by a verified HTTP message signature. `verified`: a crawler or agent confirmed by its operator's published IP ranges or by reverse DNS. `unsigned`: only claimed (user agent) or inferred. null for no bot. |

A user agent proves nothing: anyone can send `Googlebot`. When a request claims to be Googlebot, Bingbot, Applebot, YandexBot, Baiduspider or Yahoo Slurp, Trace checks it the way those engines document: the IP's reverse DNS must end in the operator's domain and that name must resolve back to the same IP. Confirmed crawlers get identity `verified`; impostors get result `bad`. Results are cached per IP for six hours, and a lookup that takes over a second is skipped (the crawler stays `unsigned`). AI crawlers and agents publish IP lists rather than DNS names. With `CRAWLER_RANGES_FILE` set (filled by `npm run crawler-ranges`, which downloads the lists OpenAI, Perplexity, Google and Microsoft publish for GPTBot, OAI-SearchBot, ChatGPT, PerplexityBot, Perplexity, Googlebot and Bingbot), a request claiming one of those names is checked against its list, without DNS: inside it gets identity `verified` and result `good` (including ChatGPT and Perplexity acting for a user); outside it is an impostor with result `bad` (an agent such as ChatGPT then also fires `aiAgent`; a fake crawler shows in `botInfo` only). Crawlers without a published list (ClaudeBot, Bytespider and others) stay `unsigned`. The lists change every few days: refresh daily, because an IP the operator added after your last refresh reads as an impostor. Use `createCrawlerVerifier({ ranges })` and `fetchCrawlerRanges()` from `@trace-id/sdk-node/crawlers` for the same check on your own routes, or pass `crawlers: { ranges }` to `@trace-id/embed`.

**Signed agents (Web Bot Auth).** Agents such as ChatGPT agent sign their requests with HTTP Message Signatures (RFC 9421, Ed25519) and publish their keys at `<agent>/.well-known/http-message-signatures-directory`. Trace checks the `Signature-Input`, `Signature` and `Signature-Agent` headers on the identify request: the signature must use tag `web-bot-auth`, cover `@authority` and the `Signature-Agent` header, be current (`created`, `expires`, valid for at most a day) and verify against a key from the agent's directory. Only directories you allow are fetched (`AGENT_DIRECTORIES`, default `https://chatgpt.com`), so a request cannot make the server call an arbitrary URL. Directories are cached for an hour. The directory's own signature is not checked yet.

To check agents on your own routes (checkout, login, an API, an MCP server), use `createAgentVerifier` from `@trace-id/sdk-node/agents`:

```ts
import { createAgentVerifier } from '@trace-id/sdk-node/agents';

const verifyAgent = createAgentVerifier({ allowedAgents: ['https://chatgpt.com'] });
const agent = await verifyAgent({ method: req.method, url: `https://${req.headers.host}${req.url}`, headers: req.headers });
if (agent?.verified) tagOrder({ placedBy: agent.agent });
```

It returns null for unsigned requests and `{ verified: false, reason }` for signatures that fail (`expired`, `unknown_key`, `bad_signature`, `agent_not_allowed`, `directory_unavailable`, `unsupported_components`).

## Cross-browser linking

Each browser gets its own `visitorId`: its storage and its canvas, audio and WebGL readings differ from other browsers on the same machine. To link them, the server builds a second profile from traits that belong to the device and OS, not the browser:

| Trait | Weight | Source |
| --- | ---: | --- |
| `os` | 2 (must match) | User agent, falling back to `navigator.platform`. |
| `gpuVendor` | 1 (must match) | WebGL renderer, reduced to a vendor. |
| `gpu` | 3 (must match) | WebGL renderer, reduced to vendor and model: Chrome's `ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 (0x00002504) Direct3D11 …)` and Edge's `NVIDIA GeForce RTX 3060` both become `nvidia:3060`. Firefox reports a stand-in model ("…, or similar") and Safari says "Apple GPU", so for them only the vendor is compared. Laptops with two GPUs give different browsers different GPUs (Chrome on the discrete NVIDIA, Edge on the integrated AMD or Intel), so when one side is integrated and the other discrete, the GPU is left out of the comparison instead of ruling the device out. |
| `screen` | 2 (must match) | Screen size, orientation-independent, and color depth. |
| `cpu` | 1 | `navigator.hardwareConcurrency`. |
| `touch` | 0.5 | `navigator.maxTouchPoints`. |
| `timezone` | 1.5 | IANA timezone. |
| `language` | 0.5 | Primary language, without region. |
| `fonts` | 2.5 | Installed fonts, from the OS, so every browser sees nearly the same set. Compared as a bitmap of the ~60 tested fonts with partial credit (Jaccard), because engines occasionally measure one font differently; older SDKs fall back to an exact match of the fonts hash. |
| `voices` | 1.5 | Installed text-to-speech voices (local voices only; network voices come with the browser). Hashed in the browser. |
| `displayPrefs` | 1 | Display and accessibility settings from the OS: color gamut, pointer, hover, reduced motion, forced colors. Hashed in the browser. |
| `gpuArch` | 2 | WebGPU adapter vendor and architecture (`nvidia/ampere`); often less masked than WebGL in Firefox and Safari. Hashed in the browser. |
| `screenLayout` | 1 | Taskbar or dock size and edge (`screen` minus available area, `availLeft`/`availTop`), set by the OS. Hashed in the browser. |
| `mediaDecode` | 1 | Which of H.264, VP9 and AV1 (1080p, 4K) the GPU decodes in hardware (`mediaCapabilities`, "power efficient"). Hashed in the browser. |
| `keyboard` | 1 | Installed keyboard layout (`navigator.keyboard.getLayoutMap`, Chromium only; not compared elsewhere). Hashed in the browser. |
| `clock` | 2 | Device clock offset from the server, from the SDK's send time. Every browser shares the OS clock. Only counts when at least one side is off by 2 s or more (a synced clock says nothing); matches within 2 s. |

The GPU-dependent traits (`gpu`, `gpuVendor`, `gpuArch`, `mediaDecode`) are left out together when one browser got the integrated GPU and the other the discrete one.

Every trait except the font bitmap and clock offset is stored as a hash. Similarity is the weighted share of matching traits among those both sides reported; it is 0 if any "must match" trait differs or if the two sides share less than 60% of the total weight. That similarity is then scaled by what the network says:

| How the visitors are connected | Factor | `via` |
| --- | ---: | --- |
| Two or more networks in common (home and work, say) | 1 | `sharedNetwork` |
| One network in common, used by at most 5 visitors (a home router) | 1 | `sharedNetwork` |
| One network, up to `busyNetworkVisitors` (20) visitors | 0.95 | `sharedNetwork` |
| One network, up to 100 visitors | 0.85 | `sharedNetwork` |
| One busier network (campus, mobile carrier) | 0.75 | `sharedNetwork` |
| No network in common, but at most `rareHardwareMaxVisitors` (3) other visitors share the exact hardware core (OS, GPU model, screen, CPU) and similarity is at least 0.95 | 0.75 | `rareHardware` |

"In common" means both visitors were seen on the network (IPv4 /24, IPv6 /64, compared as a keyed hash; loopback counts as one) within `networkWindowHours` (30 days), not necessarily at the same time: a laptop seen at home in Chrome and at work in Firefox links as soon as Chrome is also seen at work. Links of at least 0.7 are returned in `linkedVisitors`; the `crossBrowser` signal turns on, and the shared `deviceId` is assigned, at 0.8. Rare-hardware links top out at 0.75, so they inform but never raise the score or merge device ids.

**Why networks matter so much.** Identical hardware is common: one laptop model across an office, every iPhone of a model in a city. Without a network in common, only hardware that is rare in your project is compared. Set `crossBrowser.requireSharedNetwork` to `true` to turn cross-network links off, or `rareHardwareMaxVisitors` to 0.

**What it catches.** One person opening a second browser, a browser profile or a private window in another browser to sign up again, even from another network if the device ever shared a network with the earlier browser, or has rare hardware. **What it misses.** Common hardware that never shared a network; virtual machines; anti-fingerprinting browsers that fake the GPU or screen; a changed monitor setup.

Turn it off with `CROSS_BROWSER_LINKING=false`. It is also off when `IP_STORAGE=none`, because it needs the network.

## Anti-detect checks

The SDK reads the user agent, platform, languages, CPU count, time zone, webdriver flag and WebGL renderer three times: in the page, in a short-lived Web Worker (WebGL on an `OffscreenCanvas`), and in a fresh same-origin iframe. Spoofing tools often patch only the page. Only the names of fields that differ are sent, never the values. A worker blocked by CSP (`worker-src` without `blob:`) is reported as `workerChecked: false` and simply not compared.

The server adds two checks from data it already has: the WebGL renderer against the OS in the user agent (an Apple GPU on "Windows", Direct3D on "macOS", a desktop GeForce on "Android"; Adreno is allowed on Windows because of Snapdragon laptops) and the installed fonts against the OS (two fonts that ship only with macOS on a "Windows" browser, or the reverse; fonts installed by Office for Mac do not count).

## Accounts and the device graph

Pass your account id as `linkedId` on identify (sign-in, sign-up, checkout). The server keeps which accounts were seen with which visitor (`visitor_accounts`), and since every browser of a device shares a `deviceId`, it can count accounts per device and devices per account. `GET /v1/devices/:deviceId` (secret key) lists the browsers and accounts of one device; see the [API reference](api.md#get-v1devicesdeviceid). Tune the thresholds in the `accounts` section of the scoring file.

## TLS fingerprints

The server never sees the TLS handshake: the proxy that terminates TLS does. If that proxy can compute [JA4](https://github.com/FoxIO-LLC/ja4) (nginx or HAProxy with a JA4 module, Cloudflare Workers via `request.cf`, and others), have it put the value in a header and set `TLS_FINGERPRINT_HEADER` to that header's name. The proxy must overwrite the header on every request, or a client could send its own. `JA4_BLOCKLIST_FILE` adds known bot fingerprints, one per line.

## IP intelligence

### Lists

The open build never bundles IP data. Lists are plain text, one IP or CIDR per line, `#` comments allowed, IPv4 and IPv6 both supported. `npm run ip-data -w trace-server -- <dir>` downloads free ones: Tor exits from the Tor Project, the ranges AWS, Google Cloud, Oracle Cloud, DigitalOcean and Linode publish, Apple's iCloud Private Relay ranges and DB-IP Lite databases (see [Self-hosting: IP data](self-hosting.md#ip-data)). Changed files are reloaded within 10 minutes.

### GeoIP and ASN

Set `GEOIP_COUNTRY_DB` (a Country or City database) and/or `GEOIP_ASN_DB` to MaxMind-format `.mmdb` files you obtained yourself, for example GeoLite2 under its own license or a commercial equivalent. They are never bundled because their licenses forbid redistribution. With an ASN database, `DATACENTER_ASN_FILE` (one ASN per line, `AS16509` or `16509`) also marks hosting networks as `datacenterIp`. Country and ASN appear in every event (`ip.country`, `ip.asn`).

### IP data providers

For commercial VPN and residential proxy detection, name providers in `IP_PROVIDERS`: IPQualityScore, ipinfo, MaxMind web services, Spur, ipdata, ipapi.is, IP2Location.io, ipregistry, proxycheck.io, AbuseIPDB, ipgeolocation.io, ip-api, or your CDN's country header ([settings](configuration.md#ip-data-providers)). Their answers merge with the local files: a flag fires when any source reports it, so a provider's VPN verdict fires `vpn` (method `publicVpn`), its proxy verdict `proxy`, its Tor verdict `tor`, its hosting verdict `datacenterIp`. Lookups have a time budget and a per-IP cache, and a failing provider leaves those fields "not checked" instead of failing the event. Other providers plug in through `@trace-id/ip-intel` (`IpIntelSource`: a name and a `lookup(ip)`).

### Location and proximity

With a City edition GeoIP database in `GEOIP_COUNTRY_DB`, every event's `ip.location` carries `city`, `region`, `latitude` and `longitude` (rounded to 2 decimals), `accuracyRadiusKm`, `timezone` and `zone`. `zone` is a geohash cell of about 39 by 20 km: devices that keep sharing a zone are near each other, or behind the same network. IP geolocation is an estimate for the network, not the person, and two places a kilometre apart can still fall either side of a cell edge, so compare neighbouring zones before concluding devices are far apart.

## Identification components

These feed matching, not the suspect score. Each is hashed in the browser.

| Component | Weight | Reading |
| --- | ---: | --- |
| `canvas` | 3 | 2D canvas render (text, emoji, blending). Omitted when two renders differ (farbling). |
| `webgl` | 3 | Unmasked GPU vendor and renderer. |
| `webglParams` | 2 | WebGL limits and extension list. |
| `audio` | 2 | OfflineAudioContext compressor output. |
| `fonts` | 3 | Installed fonts by text measurement against fallbacks. |
| `screen` | 1.5 | Screen size (orientation-independent), color depth, pixel ratio. |
| `hardware` | 1.5 | CPU cores, device memory, touch points. |
| `timezone` | 1 | IANA timezone. |
| `languages` | 1 | `navigator.languages`. |
| `platform` | 1 | `navigator.platform` and UA-CH platform. |
| `math` | 1 | Floating-point results of transcendental functions. |
| `css` | 0.5 | `CSS.supports` feature bitmap. |
| `media` | 0.5 | Stable media queries (gamut, pointer, hover; not color scheme). |
| `userAgentFamily` | 2 | Browser family and OS, no version. |
| `intl` | 1 | Locale settings from the OS: resolved locale, calendar, numbering system, hour cycle, number and date formatting. |
| `textMetrics` | 1.5 | Canvas text measurement of Latin, emoji and rare-script strings in four generic font families: font rasterisation and emoji fonts differ by OS, version and settings. |
| `webglRender` | 2 | A small shaded scene rendered by WebGL and read back, plus shader precision formats. Omitted when two renders differ (the browser adds noise). |
| `webgpu` | 1.5 | WebGPU adapter feature list and selected limits. |
| `apiSurface` | 1 | Which of ~24 newer web APIs exist (presence only), `navigator.vendor`, `productSub`, PDF viewer, plugin names: pins down engine, version and build. |
| `systemStyle` | 1 | CSS system colours (`Canvas`, `Highlight`, `AccentColor`...) and system fonts (`caption`, `menu`...) as the browser maps them from the OS theme. |
| `codecs` | 1 | Which of 19 audio and video formats play (`canPlayType`, `MediaSource.isTypeSupported`): licensed codecs differ by OS, browser build and distribution. |
| `webgl2` | 1.5 | WebGL 2 limits and extension list. |
| `appInstall` | 4 | Native apps only: SHA-256 of the platform install id (identifierForVendor, ANDROID_ID) salted with the app id. Two installs with different values are never matched, so phones of one model stay apart. |
