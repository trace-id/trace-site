# FastAPI

This quickstart verifies Trace events in a FastAPI app with the `trace_dependency` dependency from `trace-device`.

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

The dependency reads the event id from the `X-Trace-Event-Id` header or a JSON body, verifies it, and gives your route the server-verified event. The check is a blocking HTTP call, so it runs in a worker thread and never stalls the event loop.

```python
from fastapi import Depends, FastAPI
from trace_device.fastapi import trace_dependency

app = FastAPI()

@app.post("/api/signup")
async def signup(event=Depends(trace_dependency(fail_open=True, reject=lambda e: e["suspectScore"] >= 60))):
    # event is None only with fail_open when Trace was unreachable
    # create the user, and store event["visitorId"] with it for later lookups
    return {"ok": True}
```

A failed guard raises `HTTPException` with 400 for a missing or invalid event, 403 when `reject` returns true, 503 when Trace cannot be reached and 500 for a bad key or missing configuration. `fail_open=True` only covers the unreachable case; a wrong key never fails open. For form posts (not JSON), send the id in the `X-Trace-Event-Id` header.

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
