# trace-site

The website for [Trace](https://github.com/trace-id/trace): landing page, documentation and a live demo.

| Route | What |
| --- | --- |
| `/` | Landing page; identifies the visitor live with the browser SDK |
| `/docs/...` | Docs from `content/docs/*.md` (search, table of contents, light/dark code) |
| `/demo` | The live demo (`src/components/playground`) |
| `/api/demo/*` | The demo's backend: reads verified events and device graphs with the secret key |
| `/llms.txt`, `/llms-full.txt`, `/search-index.json` | Generated from the docs at build time |

## Run locally

```sh
npm install
cp .env.example .env.local   # a Trace server URL and the keys of a project made for the site
npm run dev                  # http://localhost:3100
```

The public key's allowed origins must include the site's origin (`http://localhost:3100` locally). Never commit `.env.local`.

## Docs content

Pages owned by the [trace repository](https://github.com/trace-id/trace) (api, configuration, self-hosting, signals,
privacy, security-checklist, accuracy) are copied from its `docs` folder with `npm run sync-docs`; fix those there.
The rest (overview, quickstart, integration, agents) live here. Every docs page has an edit or suggest link.

## Deploy

Any Next.js host. Set the variables from `.env.example`; the Trace server must be reachable from browsers at
`TRACE_ENDPOINT`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

Code: [MIT](LICENSE). Documentation in `content/docs`: [CC BY 4.0](content/docs/LICENSE).

The name Trace, the logo and the legal pages (`content/legal`) are not covered by those licences. They describe the
operator of a specific deployment, so replace them if you host your own copy, and have them reviewed by a lawyer.
