# Go

This quickstart verifies Trace events in a Go backend with the `trace` package. It uses only the standard library and works with `net/http`, chi, gorilla/mux and anything that takes `func(http.Handler) http.Handler`.

> [!NOTE]
> **Before you start**
> You need a **secret key** (`sk_...`) from the dashboard's Keys page and a frontend that sends an `eventId` (see the [Web quickstarts](javascript.md)). Go 1.21 or later.

## 1. Install the SDK

```sh
go get github.com/trace-id/trace/sdks/go
```

```go
import trace "github.com/trace-id/trace/sdks/go"
```

```sh
export TRACE_SECRET_KEY=sk_...
export TRACE_ENDPOINT=https://id.example.com
```

## 2. Verify the event

`GetEvent` calls `GET /v1/events/:eventId` with your secret key and returns the full event. Only this verified event should drive decisions: whatever the browser sends can be forged.

```go
client, err := trace.NewClient(os.Getenv("TRACE_SECRET_KEY"), os.Getenv("TRACE_ENDPOINT"), trace.WithTimeout(1500*time.Millisecond))
if err != nil {
	log.Fatal(err) // not a secret key
}

event, err := client.GetEvent(r.Context(), body.EventID)
if err != nil {
	var ve *trace.VerifyError
	if errors.As(err, &ve) {
		log.Printf("Trace check skipped: %s", ve.Code) // decide: fail open or closed
	}
}
```

## 3. Decide

```go
if event != nil {
	switch {
	case event.SuspectScore >= 60:
		http.Error(w, "blocked", http.StatusForbidden)
		return
	case event.Detected("multiAccount"):
		w.WriteHeader(http.StatusAccepted) // ask for email or phone verification first
		return
	}
}
```

`event.Reasons` lists each signal's contribution, `event.Signals` holds every signal with its details, and `event.Raw` is the full JSON for fields the struct does not name.

## Or use the guard

`trace.Guard` is middleware that reads the event id from the `X-Trace-Event-Id` header or the JSON body, verifies it, and puts the event on the request context. The handler can still read the body.

```go
guard := trace.Guard(trace.GuardOptions{RejectScore: 80})

mux := http.NewServeMux()
mux.Handle("POST /signup", guard(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	event := trace.EventFromContext(r.Context()) // nil only with FailOpen or Optional
	fmt.Fprintf(w, "visitor %s", event.VisitorID)
})))
```

The guard answers 400 for a missing or invalid event, 403 when `RejectScore` or `Reject` says so, 503 when Trace cannot be reached and 500 for a bad key or missing configuration. `FailOpen: true` lets requests through (event `nil`) when Trace is unreachable. A wrong key never fails open.

## Webhooks and sealed results

```go
// Pass the raw body, before any JSON parsing.
payload, err := trace.VerifyWebhook(rawBody, r.Header.Get("X-Signature"), os.Getenv("TRACE_WEBHOOK_SECRET"))

// Sealed results (SEALED_RESULTS_KEY on the server), no API call.
event, err := trace.UnsealEventResult(body.SealedResult, os.Getenv("TRACE_SEALED_KEY"))
```

Errors are `*trace.VerifyError`, `*trace.WebhookError` and `*trace.SealedError`, each with a `Code`. Deliveries are at least once: dedupe on `payload.ID`.

## Next steps

::: cards
- [New account fraud](new-account-fraud.md): Turn the verified event into a decision
- [Server SDKs reference](server-sdks.md): Options and error codes for every language
:::
