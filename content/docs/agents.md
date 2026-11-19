# AI agents and MCP

Trace is built to be used by AI agents as well as people: an MCP server for assistants such as Claude, a machine-readable API description, docs in a form language models read well, and a prompt that lets a coding agent integrate it into your app.

## MCP server

`@trace-id/mcp` is a [Model Context Protocol](https://modelcontextprotocol.io) server. It gives an assistant read-only access to your project through your secret key, so you can ask "why was this signup blocked?" or "which other accounts used this device?" in plain language.

| Tool | What it does |
| --- | --- |
| `explain_event` | The verdict for an event's suspect score, which signals fired and why, when each can be wrong, other browsers on the same device |
| `get_event` | The full verified event (same as `GET /v1/events/:eventId`) |
| `get_visitor` | A visitor's history, paginated |
| `get_device` | Every browser and account on one device (multi-accounting investigations) |
| `list_signals` | The signal catalog, offline |
| `delete_visitor` | Permanent deletion for a data request. Only present with `TRACE_ALLOW_DELETE=true`, marked destructive, and requires `confirm: true` |

Configuration is two environment variables: `TRACE_ENDPOINT` (your server, e.g. `https://id.example.com`) and `TRACE_SECRET_KEY` (`sk_...`). Use a separate secret key for the assistant so you can revoke it on its own.

Claude Code:

```sh
claude mcp add trace -e TRACE_ENDPOINT=https://id.example.com -e TRACE_SECRET_KEY=sk_... -- npx -y @trace-id/mcp
```

Claude Desktop, Cursor and other clients that read an `mcpServers` file:

```json
{
  "mcpServers": {
    "trace": {
      "command": "npx",
      "args": ["-y", "@trace-id/mcp"],
      "env": { "TRACE_ENDPOINT": "https://id.example.com", "TRACE_SECRET_KEY": "sk_..." }
    }
  }
}
```

From a checkout (before the package is published), use `"command": "node", "args": ["/path/to/trace/packages/mcp-server/dist/cli.js"]` after `npm run build`.

The server speaks MCP over stdio (protocol versions 2025-06-18, 2025-03-26 and 2024-11-05) and writes nothing but protocol messages to stdout. API failures come back as tool errors the model can read (`invalid_api_key (HTTP 401): ...`), not as crashes.

## OpenAPI

Every server publishes its API description at `GET /openapi.json` (OpenAPI 3.1, no key needed). Point client generators, API tools or agents with an HTTP tool at it. It covers identify, events, visitors, devices, webhooks and health, including every signal id.

## Docs for language models

The docs site serves [`/llms.txt`](/llms.txt), an index of every page, and [`/llms-full.txt`](/llms-full.txt), all pages in one plain-text file, following the [llms.txt convention](https://llmstxt.org). Give either to an assistant before asking it about trace.

## Integrating with a coding agent

Paste this into Claude Code, Cursor or a similar agent in your app's repository, after filling in the two values:

```text
Integrate Trace device identification into this app.
Server: https://id.example.com (public key pk_..., secret key in the TRACE_SECRET_KEY environment variable).
Docs: https://<docs-site>/llms-full.txt and the API at https://id.example.com/openapi.json.

1. Add the browser SDK for this app's framework (@trace-id/sdk-js, sdk-react, sdk-vue or sdk-svelte). Call it on
   signup, login and checkout with linkedId set to our internal user id (never an email), and send the returned
   eventId with the form request.
2. On the backend, verify that eventId with the server SDK for this language (sdk-node, Python, PHP, Java) or
   GET /v1/events/:eventId. Never trust the visitorId or score the browser sends.
3. Policy: suspectScore >= 60 -> block or challenge; 25-59 -> challenge; signals.multiAccount.detected -> flag for
   review. Log the eventId with the decision.
4. If the Trace call fails or times out (2 s), let the request continue (fail open) and log it.
5. Add tests with the SDK mocked, and show me the diff.
```

The agent finds the rest in the docs: consent (`enabled: false`), first-party mode, webhooks and sealed results.

## Agents as visitors

Browser agents (computer-use assistants, headless automation) are bots by definition and the `bot`, `automatedInput` and `antiDetect` signals are designed to see them. If you want to admit some, decide on your backend: for example allow a known agent's requests by your own authentication, and use the signals only for anonymous traffic.
