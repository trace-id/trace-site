# Contributing

Fixes to the docs and the site are welcome.

- **Docs typo or unclear page:** open a pull request, or use the "Suggest an edit" link on the page.
- **Pages synced from the trace repository** (`api`, `configuration`, `self-hosting`, `signals`, `privacy`,
  `security-checklist`, `accuracy`): change them in [trace-id/trace](https://github.com/trace-id/trace/tree/main/docs),
  not here; `npm run sync-docs` overwrites them.
- **Code changes:** run `npm run typecheck` and `npm run build` before opening a pull request.
- Do not add secrets, real keys or real user data. Use obviously fake values.
- Do not copy another vendor's code, copy, assets or branding.

By contributing you agree your code is released under the MIT licence and your docs changes under CC BY 4.0.
