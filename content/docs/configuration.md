# Configuration reference

All configuration is through environment variables, validated at startup. Invalid values stop the server with a message naming the variable (never its value).

## Server: required

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. |
| `TOKEN_SECRET` | 32+ random characters. Signs visitor tokens, keys IP hashes, encrypts webhook secrets. |
| `AUTH_SECRET` | 32+ random characters, different from `TOKEN_SECRET`. Signs dashboard sessions. |

## Server: network and dashboard

| Variable | Default | Description |
| --- | --- | --- |
| `HOST` | `0.0.0.0` | Listen address. |
| `PORT` | `8080` | Listen port. |
| `DASHBOARD_URL` | `http://localhost:3000` | Public URL of the dashboard. Used for sessions and CSRF checks. |
| `DASHBOARD_ALLOW_SIGNUP` | `false` | Allow sign-ups after the first account. |
| `TRUST_PROXY` | `false` | `false`, `true`, or a comma list of proxy IPs/CIDRs. |
| `REQUEST_TIMEOUT_MS` | `10000` | Per-request timeout. |
| `REDIS_URL` | unset | Redis for rate limits and velocity. Optional. |
| `DB_STATEMENT_TIMEOUT_MS` | `5000` | Postgres statement timeout per connection. |
| `DB_POOL_MAX` | `10` | Postgres connections per server process. |

## Server: data and privacy

| Variable | Default | Description |
| --- | --- | --- |
| `IP_STORAGE` | `truncated` | How IPs are stored on events: `full`, `truncated` (/24, /48), `hashed`, `none`. |
| `EVENT_VERIFY_WINDOW_MINUTES` | `60` | How long `GET /v1/events/:id` accepts an event. |
| `RETENTION_MAX_DAYS` | `90` | Upper bound for any project's retention; whole partitions older than this are dropped. |
| `MAINTENANCE_INTERVAL_MINUTES` | `360` | How often retention and partition upkeep run. |
| `CROSS_BROWSER_LINKING` | `true` | Link visitors that look like one device in different browsers (`linkedVisitors`, `crossBrowser` signal). Always off when `IP_STORAGE=none`. See [privacy](privacy.md). |
| `VISITOR_COOKIE` | `true` | Identify responses also set the visitor token as an HttpOnly, SameSite=Lax cookie (first-party mode; the SDK keeps it only with `firstPartyCookie: true`). See [integration](integration.md#first-party-mode). |
| `VISITOR_COOKIE_NAME` | `_trace_vt` | Cookie name. |
| `VISITOR_COOKIE_DOMAIN` | unset | Optional `Domain`, e.g. `example.com` to share it across subdomains. |
| `VISITOR_COOKIE_PATH` | `/v1/identify` | Cookie `Path`. Behind a path proxy (`www.example.com/trace`) use `/trace/v1/identify`, unless the proxy rewrites it. |
| `SEALED_RESULTS_KEY` | unset | Base64 of 32 random bytes (`openssl rand -base64 32`). Identify responses then carry `sealedResult`, the full event encrypted with AES-256-GCM, for your backend to open with `unsealEventResult` (sdk-node). Keep it as secret as the secret key. |
| `SCORING_CONFIG_PATH` | bundled `scoring.default.json` | Replace weights and thresholds with your own file. |

## Server: IP intelligence

IP facts (country, ASN, location, Tor, VPN, proxy, datacenter, relay, blocklisted) come from local files, from IP data providers, or both. Files cost nothing per request and keep visitor IPs on your server; `npm run ip-data -w trace-server -- <dir>` downloads free ones (see [Self-hosting: IP data](self-hosting.md#ip-data)). Changed files are reloaded within 10 minutes, without a restart.

### Local files

| Variable | Description |
| --- | --- |
| `TOR_EXIT_LIST_FILE` | Tor exit IPs, one per line. |
| `DATACENTER_CIDR_FILE` | Hosting/cloud ranges, one IP or CIDR per line. |
| `IP_BLOCKLIST_FILE` | Your blocklist, one IP or CIDR per line. |
| `GEOIP_COUNTRY_DB` | MaxMind-format Country or City `.mmdb`. |
| `GEOIP_ASN_DB` | MaxMind-format ASN `.mmdb`. |
| `DATACENTER_ASN_FILE` | Hosting ASNs, one per line (needs `GEOIP_ASN_DB`). |
| `RELAY_CIDR_FILE` | Privacy-relay egress ranges, reported in `vpn` details. Apple publishes iCloud Private Relay's as CSV (`egress-ip-ranges.csv`); only the first column is read. |
| `VPN_CIDR_FILE` | Commercial VPN exit ranges, one IP or CIDR per line (`vpn` method `publicVpn`). |
| `VPN_ASN_FILE` | VPN provider ASNs, one per line (needs `GEOIP_ASN_DB`). |
| `CRAWLER_RANGES_FILE` | Published IP ranges of crawlers and AI agents, as JSON (crawler name to CIDR list), written by `npm run crawler-ranges -w trace-server -- <file>`. Refresh it daily; the server re-reads the file when it changes (checked every 10 minutes). Unset: only search engines are verified, by reverse DNS. |
| `PROXY_CIDR_FILE` | Residential and datacenter proxy exit ranges, one IP or CIDR per line. Unset: `proxy` is unavailable. |

### IP data providers

Name providers in `IP_PROVIDERS` (comma separated, highest priority first) and set their keys. They run in parallel within one time budget per identify, after which a slow provider's fields read "not checked" for that event; a failing provider never fails an identification and is logged at most once a minute. Answers are cached per IP. Private and reserved addresses are never sent. The local files below are always consulted too, after the providers. For country, ASN and location the first source that answers wins; a flag (VPN, proxy, Tor, datacenter, relay, blocklisted) is set when any source reports it.

| Variable | Default | Description |
| --- | --- | --- |
| `IP_PROVIDERS` | unset | e.g. `ipqualityscore,ipinfo`. Unknown names or missing keys stop the server at startup with the variable named. |
| `IP_PROVIDER_TIMEOUT_MS` | `400` | Budget for all provider lookups of one identify. |
| `IP_PROVIDER_CACHE_HOURS` | `24` | How long an answer for an IP is reused. `0` turns caching off. |

| `IP_PROVIDERS` name | Variables | Fills |
| --- | --- | --- |
| `ipqualityscore` | `IPQS_KEY`, `IPQS_STRICTNESS` (0 to 3, default 1) | Country, ASN, location, VPN (`active_vpn`), Tor (`active_tor`), proxy, recent abuse as blocklisted |
| `ipinfo` | `IPINFO_TOKEN`, `IPINFO_PLAN` (`core` default, or `lite`) | Country and ASN (Lite); location, hosting and one anonymity flag reported as VPN (Core) |
| `maxmind` | `MAXMIND_ACCOUNT_ID`, `MAXMIND_LICENSE_KEY`, `MAXMIND_SERVICE` (`insights` default, `city`, `country`) | Country, ASN, location; VPN, proxy (public and residential), Tor, hosting with Insights |
| `spur` | `SPUR_TOKEN` | Country, ASN; VPN, proxy (residential and callback proxies), Tor, datacenter |
| `ipdata` | `IPDATA_KEY` | Country, ASN, location; VPN (Business plans), Tor, proxy, iCloud relay, datacenter, known attackers as blocklisted |
| `ipapi.is` | `IPAPI_IS_KEY` | Country, ASN, location, VPN, Tor, proxy, datacenter, abusers as blocklisted |
| `ip2location.io` | `IP2LOCATION_IO_KEY` | Country, ASN, location, proxy; VPN, Tor, datacenter with the Security plan |
| `ipregistry` | `IPREGISTRY_KEY` | Country, ASN, location, VPN, Tor exit, proxy, relay, cloud provider, threats as blocklisted |
| `proxycheck` | `PROXYCHECK_KEY` (optional on the free tier) | Country, ASN, location, VPN, Tor or other proxy by detected type |
| `abuseipdb` | `ABUSEIPDB_KEY`, `ABUSEIPDB_MIN_SCORE` (default 75) | Country, Tor, hosting; blocklisted at or above the abuse confidence score |
| `ipgeolocation` | `IPGEOLOCATION_KEY`, `IPGEOLOCATION_SECURITY=true` (paid) | Country, ASN, location; VPN, Tor, proxy, cloud, attackers with security |
| `ip-api` | `IP_API_KEY` (pro, HTTPS), or `IP_API_ALLOW_FREE_HTTP=true` | Country, ASN, location, proxy, hosting. The free endpoint is HTTP only and not for commercial use. |
| `cdn-headers` | `IP_COUNTRY_HEADER` (e.g. `cf-ipcountry`, `x-vercel-ip-country`, `cloudfront-viewer-country`) | Country from your CDN, free and instant; Cloudflare's `T1` marks Tor. Only when the CDN is the only way in, or anyone can send the header. |

Each provider receives the visitor's IP address and nothing else. That makes it a processor of personal data under GDPR and similar laws: have a data processing agreement with it and name it in your privacy policy. The local files below send nothing anywhere.

### Other

| Variable | Description |
| --- | --- |
| `AGENT_DIRECTORIES` | Web Bot Auth key directories trusted for signed AI agents, comma separated origins. Default `https://chatgpt.com`. `*` fetches any https directory a request names; `off` turns the check off. |
| `TLS_FINGERPRINT_HEADER` | Name of the header a trusted TLS-terminating proxy fills with the JA4 fingerprint (e.g. `x-ja4`). Unset: `tlsMismatch` is unavailable. |
| `JA4_BLOCKLIST_FILE` | Known bot and scraper JA4 fingerprints, one per line. |

## Server: rate limits (per minute)

| Variable | Default |
| --- | --- |
| `RATE_LIMIT_INGEST_PER_KEY_PER_MIN` | `1200` |
| `RATE_LIMIT_INGEST_PER_IP_PER_MIN` | `60` |
| `RATE_LIMIT_INGEST_PER_VISITOR_PER_MIN` | `30` |
| `RATE_LIMIT_API_PER_KEY_PER_MIN` | `600` (also used per dashboard user) |

## Server: webhooks

| Variable | Default | Description |
| --- | --- | --- |
| `WEBHOOK_TIMEOUT_MS` | `5000` | Per-attempt timeout. |
| `WEBHOOK_POLL_INTERVAL_MS` | `1000` | How often the worker looks for due deliveries. |
| `WEBHOOK_ALLOW_INSECURE` | `false` | Development only: allow `http://` and private-network targets. Never in production. |

## Dashboard

| Variable | Default | Description |
| --- | --- | --- |
| `API_URL` | `http://localhost:8080` | Server address the dashboard forwards `/api/auth` and `/v1` to. Read at request time. |
| `PORT` | `3000` | Listen port (Docker image). |

## Docker Compose (`docker/.env`)

`POSTGRES_PASSWORD`, `TOKEN_SECRET` and `AUTH_SECRET` are required. Optional: `POSTGRES_USER`, `POSTGRES_DB`, `SERVER_PORT`, `DASHBOARD_PORT`, `DASHBOARD_URL`, `TRUST_PROXY`, `IP_STORAGE`, `EVENT_VERIFY_WINDOW_MINUTES`.

## Scoring file

`scoring.default.json` holds identification settings (`method`: `linkage` by default or `weighted`; `linkage`: change rates, prior frequencies, correlated groups and the match probability, see [accuracy](accuracy.md#matching-method); weights and thresholds for the weighted method), suspect-score weights per signal, velocity thresholds, the account limits (`accounts`: `windowHours`, `maxAccountsPerDevice`, `maxDevicesPerAccount`), and the cross-browser linking settings (`crossBrowser`: trait weights, must-match traits, thresholds, `requireSharedNetwork`, `networkWindowHours`; see the [signal catalog](signals.md#cross-browser-linking)). Override files written before a section or signal existed still load; the missing parts take their defaults. Copy it, change values, and point `SCORING_CONFIG_PATH` at the copy; the server validates it at startup and refuses unknown keys. The [accuracy harness](accuracy.md) can evaluate a candidate file: `npm run accuracy -w trace-server -- --config /absolute/path/to/file.json`.
