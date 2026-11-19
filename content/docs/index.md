# Overview

Trace is an open-source, self-hostable service that recognises returning devices and flags risky ones. A page loads the browser SDK, which collects device signals and sends them to your server. The server answers with a stable `visitorId`, a suspect score and the reasons behind it. Your backend then verifies the event with a secret key before trusting it.

It runs entirely on your infrastructure. No data leaves your deployment unless you configure an external provider.

## What you get

- **Visitor identification** that survives private windows, cleared cookies and minor browser updates, with a confidence value.
- **Signals:** bot and automation, browser tampering, Tor, datacenter IPs, IP blocklists, velocity, incognito, developer tools, virtual machines, privacy-focused browsers and high-activity devices. Every event explains which signals contributed to its score.
- **Server-side verification** (`GET /v1/events/:eventId`), visitor history, deletion for privacy requests, signed webhooks.
- **A dashboard** for projects, keys, events, visitors, usage and webhooks.
- **SDKs:** browser (npm or one script tag), React, Node.

## How it fits together

```
Browser (SDK) --POST /v1/identify, public key--> server --> Postgres, Redis
Your backend  --GET /v1/events/:id, secret key--> server
Dashboard     --session cookie--> server
```

## Honest expectations

Identification accuracy is measured on labeled and synthetic data and published on the [accuracy page](/accuracy). It is well below commercial services on real traffic, and client-side signals can be spoofed by a determined attacker. Use the score as one input next to your own defences, and start in shadow mode.

Next: the [15-minute quickstart](/quickstart).
