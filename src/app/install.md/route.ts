/**
 * Install guide written for coding agents (Claude Code, Cursor, Codex...). The "Install Trace with AI" prompt on the
 * landing page points here. Plain Markdown, absolute links, every step checkable.
 */
export function GET(req: Request) {
  const site = new URL(req.url).origin;
  const md = `# Install Trace in this app (guide for coding agents)

You are adding Trace device identification to the user's application. Trace is open source and self-hosted: a small
browser SDK identifies the visitor, and the app's backend verifies the result with a secret key before acting on it.

Full docs for language models: ${site}/llms-full.txt

## 0. Ask for, or find, three values

- \`TRACE_ENDPOINT\`: the user's Trace server, for example \`https://id.example.com\`.
- \`TRACE_PUBLIC_KEY\`: starts with \`pk_\`. Safe in browser code.
- \`TRACE_SECRET_KEY\`: starts with \`sk_\`. Server only. Never put it in browser code, logs or the repository.

If there is no server yet, tell the user to run one first:

\`\`\`sh
git clone https://github.com/trace-id/trace.git && cd trace && ./setup.sh
\`\`\`

then create a project and keys in the dashboard (http://localhost:3000) and add this app's origin to the public key.
Do not invent keys. Read them from environment variables.

## 1. Browser: identify on the actions that matter

Pick the package for the app's framework:

| Framework | Package | Entry point |
| --- | --- | --- |
| Plain JavaScript / any | \`@trace-id/sdk-js\` | \`createClient({ apiKey, endpoint })\`, then \`await client.get({ linkedId })\` |
| React | \`@trace-id/sdk-react\` | \`<IdentifyProvider apiKey endpoint>\` and \`useVisitorData({ immediate: false })\` → \`getData({ linkedId })\` |
| Next.js | \`@trace-id/sdk-next\` | \`@trace-id/sdk-next/client\` provider and hook; \`withTrace()\` from \`@trace-id/sdk-next/server\` guards route handlers |
| Vue / Nuxt | \`@trace-id/sdk-vue\` | \`useVisitorData\` (Nuxt: a client-only plugin) |
| Remix / React Router | \`@trace-id/sdk-react\` | provider and hook; verify in an action with \`guardRequest\` |
| Astro | \`@trace-id/sdk-js\` | \`createClient(...)\` in a page script; verify in an endpoint |
| Angular 17+ | \`@trace-id/sdk-angular\` | \`provideTrace(options)\`, \`injectVisitorData()\` (signals) |
| Solid | \`@trace-id/sdk-solid\` | \`<IdentifyProvider>\`, \`createVisitorData()\` (signals) |
| Kotlin / Android | \`dev.trace.device\` | \`createTraceClient(context, apiKey, endpoint)\`, then \`trace.get()\` (blocking; call off the main thread) |
| Swift / iOS | \`TraceDevice\` | \`makeTraceClient(apiKey:endpoint:)\`, then \`try await trace.get()\` |
| Flutter | \`trace_device\` (Dart) | \`createTraceClient(...)\`, then \`await trace.get()\` (Android and iOS) |
| Svelte | \`@trace-id/sdk-svelte\` | \`createVisitorData(options)\` |

Call it on signup, login, checkout and password reset, not on every render. Pass \`linkedId\` as the app's internal
user id (never an email address). Send the returned \`eventId\` to the backend with the form request, for example as a
hidden field or a header. Do not send or trust \`visitorId\` or \`suspectScore\` from the browser.

## 2. Backend: verify, then decide

| Language | Package | Call |
| --- | --- | --- |
| Node.js | \`@trace-id/sdk-node\` | \`await verifyEvent(eventId, { secretKey, endpoint, timeoutMs: 2000 })\` |
| Python | \`trace-device\` | \`trace_device.verify_event(event_id, secret_key, endpoint)\` |
| PHP | \`trace/trace\` | \`(new Trace\\Client($secretKey, $endpoint))->getEvent($eventId)\` |
| Java | \`dev.trace:trace\` | \`new Trace(secretKey, endpoint).getEvent(eventId)\` |
| Go | \`github.com/trace-id/trace/sdks/go\` | \`client.GetEvent(ctx, eventID)\` |
| Anything else | REST | \`GET {TRACE_ENDPOINT}/v1/events/{eventId}\` with \`Authorization: Bearer {TRACE_SECRET_KEY}\` |

The API description is at \`{TRACE_ENDPOINT}/openapi.json\`.

Starting policy (tell the user these are defaults to tune):

- \`suspectScore >= 60\`: block, or require a strong challenge.
- \`suspectScore\` 25 to 59: challenge (email code, 2FA, CAPTCHA).
- \`signals.multiAccount.detected\`: allow but flag the account for review.
- Log \`eventId\`, \`visitorId\`, \`suspectScore\` and the decision for every protected action.
- If verification fails or times out (2 s), let the request continue (fail open) and log it, unless the user asks
  to fail closed.

## 3. Optional

- Webhooks: every event can be pushed to the backend; verify the \`X-Signature\` header with the server SDK.
- Consent: create the browser client with \`enabled: false\` until the user consents.
- MCP: \`claude mcp add trace -e TRACE_ENDPOINT=... -e TRACE_SECRET_KEY=... -- npx -y @trace-id/mcp\` lets an assistant
  explain flagged events.

## 4. Finish

- Add tests for the decision logic with the SDK mocked (allow, challenge and block paths, and the timeout path).
- Put the three values in \`.env.example\` with placeholder values, never real keys.
- Show the user the diff and a short summary of where identification happens and how decisions are made.
`;
  return new Response(md, { headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}
