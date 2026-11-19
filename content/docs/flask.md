# Flask

This quickstart verifies Trace events in a Flask app with the `trace_device.flask` route decorator.

> [!NOTE]
> **Before you start**
> You need a **secret key** (`sk_...`) from the dashboard's Keys page and a frontend that sends an `eventId` (see the [Web quickstarts](javascript.md)). Send it in the `x-trace-event-id` header or as `eventId` in the request body.

## 1. Install the SDK

```sh
pip install trace-device
```

```sh
export TRACE_SECRET_KEY=sk_...
export TRACE_ENDPOINT=https://id.example.com
```

The import name is `trace_device` because `trace` is a standard-library module.

## 2. Guard a route

The decorator reads the event id from the `X-Trace-Event-Id` header, a JSON body or a form post, verifies it, and sets `flask.g.trace` to the server-verified event.

```python
from flask import Flask, g
from trace_device.flask import trace_guard

app = Flask(__name__)

@app.post("/api/signup")
@trace_guard(fail_open=True, reject=lambda event: event["suspectScore"] >= 60)
def signup():
    event = g.trace  # None only with fail_open when Trace was unreachable
    # create the user, and store event["visitorId"] with it for later lookups
    return {"ok": True}
```

The guard answers 400 for a missing or invalid event, 403 when `reject` returns true, 503 when Trace cannot be reached and 500 for a bad key or missing configuration. `fail_open=True` only covers the unreachable case; a wrong key never fails open.

> [!TIP]
> **Start in shadow mode**
> For the first week, leave out `reject` and log `event["suspectScore"]` and `event["reasons"]` instead. Look at who would have been blocked, then pick thresholds you trust.

## Frontends

::: cards
- [JavaScript](javascript.md) brand:javascript: The browser SDK for any site
- [React](react.md) brand:react: IdentifyProvider and useVisitorData
- [Vue](vue.md) brand:vuedotjs: Plugin and composable
- [Next.js](nextjs.md) brand:nextdotjs: Provider and route guard
:::

## Next steps

::: cards
- [New account fraud](new-account-fraud.md): Turn the verified event into a decision
- [Server SDKs reference](server-sdks.md): Options and error codes for every language
:::
