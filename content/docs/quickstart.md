# Quickstart

From nothing to a verified event in about 15 minutes. You need Docker with Compose, and a page you can edit (any local HTML file served over `http://localhost` works).

## 1. Start Trace (one command)

You need [Docker](https://docs.docker.com/get-docker/). Then:

```sh
git clone https://github.com/trace-id/trace.git
cd trace
./setup.sh          # Windows PowerShell: .\setup.ps1
```

That's all. The script creates `docker/.env` with random secrets the first time (and keeps it afterwards), starts the database, Redis, the server and the dashboard, waits until they are ready, and prints:

```text
Trace is running.
  Dashboard: http://localhost:3000
  API:       http://localhost:8080
```

The first start builds the images and takes a few minutes; later starts take seconds. Stop with `docker compose -f docker/compose.yml down`.

::: tip Ports in use?
Set `SERVER_PORT` or `DASHBOARD_PORT` in `docker/.env` and run the script again. If you change the dashboard's address, also set `DASHBOARD_URL` to exactly the URL you open in the browser.
:::

::: details Without the script
Copy `docker/.env.example` to `docker/.env`, set `POSTGRES_PASSWORD`, `TOKEN_SECRET` and `AUTH_SECRET` to 32 or more random letters and digits each (for example `openssl rand -hex 32`; avoid `/` and `+`, which break the database URL), then run `docker compose -f docker/compose.yml up --build -d`.
:::

## 2. Create your account and keys (3 minutes)

1. Open `http://localhost:3000` and choose **Create an account**. The first account becomes the administrator; further sign-ups are closed unless you enable them.
2. Create a project.
3. On **Keys**, create a **public** key. Under allowed origins, enter the origin of the page that will load the SDK, for example `http://localhost:5500`. Copy the `pk_...` key.
4. Create a **secret** key and copy the `sk_...` key. Both are shown only once.

## 3. Add the SDK to a page (3 minutes)

The server hosts the browser SDK itself. Add this to your page and replace the key:

```html
<button id="go">Identify</button>
<pre id="out"></pre>
<script type="module">
  import { createClient } from 'http://localhost:8080/sdk/sdk.esm.js';

  const client = createClient({ apiKey: 'pk_REPLACE_ME', endpoint: 'http://localhost:8080' });
  document.getElementById('go').onclick = async () => {
    const result = await client.get({ linkedId: 'test-user' });
    document.getElementById('out').textContent = JSON.stringify(result, null, 2);
  };
</script>
```

Serve the page from the origin you allowed (for example `npx serve -l 5500` in its folder) and click **Identify**. You get an `eventId` and a `visitorId`. Open the page in a private window and click again: the `visitorId` should match.

::: warning Origin not allowed?
The page's origin must match an allowed origin on the public key exactly, including the port. `file://` pages have no usable origin; serve the page over `http://localhost`.
:::

## 4. Verify on your backend (2 minutes)

Never trust the result in the browser. Send the `eventId` to your server and fetch the verified event with the secret key:

```sh
curl -H "Authorization: Bearer sk_REPLACE_ME" http://localhost:8080/v1/events/EVENT_ID
```

Or from Node 18+:

```js
const res = await fetch(`http://localhost:8080/v1/events/${eventId}`, {
  headers: { Authorization: `Bearer ${process.env.SECRET_KEY}` },
  signal: AbortSignal.timeout(2000),
});
const event = await res.json(); // visitorId, suspectScore, reasons, signals, ...
```

Events can be verified for 60 minutes. The response explains the score in `reasons`.

## 5. Look around (2 minutes)

Back in the dashboard, **Overview** shows the events per day, **Events** lets you search by `linkedId`, visitor or score, and each event page explains its score signal by signal.

## Next steps

- Decide what happens when the service is slow or down: [fail open or fail closed](/integration#fail-open-or-fail-closed).
- Use the [React SDK](/integration#react) or install the SDKs from npm.
- Before going live: TLS, `TRUST_PROXY`, backups and IP data in the [self-hosting guide](/self-hosting).
- Receive [signed webhooks](/api#webhooks) instead of polling.
