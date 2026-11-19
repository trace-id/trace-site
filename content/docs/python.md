# Python

This quickstart verifies Trace events in a Python backend with `trace-device`. It uses only the standard library, so it works in Django, Flask, FastAPI or a plain script. The import name is `trace_device` because `trace` is a standard-library module.

> [!NOTE]
> **Before you start**
> You need a **secret key** (`sk_...`) from the dashboard's Keys page and a frontend that sends an `eventId` (see the [Web quickstarts](javascript.md)). Python 3.9 or later.

## 1. Install the SDK

::: code-group
```sh [pip]
pip install trace-device
```
```sh [uv]
uv add trace-device
```
```sh [poetry]
poetry add trace-device
```
:::

For sealed results add the extra: `pip install "trace-device[sealed]"`.

## 2. Verify the event

Create one `Client` and call `get_event` with the `eventId` from the request.

```python
import os
import trace_device

client = trace_device.Client(
    secret_key=os.environ["TRACE_SECRET_KEY"],
    endpoint="https://id.example.com",
    timeout=1.5,
)
```

```python
# Flask
@app.post("/api/signup")
def signup():
    body = request.get_json()
    event = None
    try:
        event = client.get_event(body.get("eventId") or "")
    except trace_device.VerifyError as e:
        app.logger.warning("Trace check skipped: %s", e.code)  # fail open

    if event and event["suspectScore"] >= 60:
        return {"error": "blocked"}, 403
    if event and event["signals"]["multiAccount"]["detected"]:
        return {"next": "verify-email"}, 202

    user = create_user(body["email"], trace_visitor_id=event and event["visitorId"])
    return {"ok": True, "id": user.id}
```

The event is a `dict` with the same fields as the [API response](api.md#get-v1eventseventid): `visitorId`, `deviceId`, `suspectScore`, `reasons`, `signals` and more.

## Or use a guard

For Django, Flask and FastAPI, `trace_device` has small adapters that read the event id from the `X-Trace-Event-Id` header or the JSON body, verify it, and hand your code the verified event. Set `TRACE_SECRET_KEY` and `TRACE_ENDPOINT`, or pass `secret_key` and `endpoint`. The adapters only import their framework when you use them.

::: code-group
```python [Django]
from trace_device.django import trace_guard

@trace_guard(reject=lambda e: e["suspectScore"] >= 60)
def signup(request):
    visitor = request.trace["visitorId"]
```
```python [Flask]
from flask import g
from trace_device.flask import trace_guard

@app.post("/api/signup")
@trace_guard(reject=lambda e: e["suspectScore"] >= 60)
def signup():
    return {"visitor": g.trace["visitorId"]}
```
```python [FastAPI]
from fastapi import Depends
from trace_device.fastapi import trace_dependency

@app.post("/api/signup")
async def signup(event=Depends(trace_dependency(reject=lambda e: e["suspectScore"] >= 60))):
    return {"visitor": event["visitorId"]}
```
:::

The guard answers 400 for a missing or invalid event, 403 when `reject` returns true, 503 when Trace cannot be reached and 500 for a bad key or missing configuration. Pass `fail_open=True` to let requests through (with the event `None`) when Trace is unreachable. A wrong key never fails open. The FastAPI dependency runs the check in a worker thread, so it does not block the event loop.

## 3. Handle errors

`VerifyError.code` is one of `invalid_event_id`, `timeout`, `network`, `unauthorized`, `not_found`, `expired`, `rate_limited`, `server_error` or `invalid_response`. Events can be verified for 60 minutes; after that you get `expired`.

## Next steps

::: cards
- [Webhooks](integration.md#receiving-webhooks): verify_webhook(raw_body, signature, secret)
- [New account fraud](new-account-fraud.md): The full sign-up decision
- [Server SDKs reference](server-sdks.md): Every function and option
:::
