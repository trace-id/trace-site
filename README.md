# trace-site (private)

The Trace website: landing page, docs and live demo. Not part of the open-source repository.

| Route | What |
| --- | --- |
| `/` | Landing page; identifies the visitor live with the browser SDK |
| `/docs/...` | Docs from `content/docs/*.md` (search, table of contents, light/dark code) |
| `/demo` | The live demo (`src/components/playground`) |
| `/api/demo/*` | The demo's backend: reads verified events and device graphs with the secret key |
| `/llms.txt`, `/llms-full.txt`, `/search-index.json` | Generated from the docs at build time |

## Run

```sh
npm install
cp .env.example .env.local   # a Trace server URL and the keys of a project made for the site
npm run dev                  # http://localhost:3100
```

The public key's allowed origins must include the site's origin (`http://localhost:3100` locally).

## Docs content

Pages the open-source repo owns (api, configuration, self-hosting, signals, privacy, security-checklist, accuracy) are
copied from `../trace/docs` with `npm run sync-docs`; edit those in the trace repo. The rest (overview, quickstart,
integration, agents) live only here.

## Deploy

Any Next.js host (Vercel: import the repo, set the env vars). The Trace server must be reachable from browsers at
`TRACE_ENDPOINT`.
