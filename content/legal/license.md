# Licensing

Trace is open source. Which licence applies depends on the part.

| Part | Licence | What it means for you |
| --- | --- | --- |
| Server, dashboard, embedded engine, self-host stack | [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html) | Free to run and change. If you offer a modified version to others over a network, you must offer them its source under the same licence. |
| Browser SDK, framework bindings, server SDKs (Node, Python, PHP, Java, Go and others), React Native SDK, MCP server, edge proxy, signal definitions | MIT | Use them in any project, including closed-source ones. |
| Reference documentation | CC BY 4.0 | Copy and adapt with attribution. |

The SDKs are MIT on purpose, so adding Trace to your product does not make your product AGPL. Running the unmodified server for your own site, or embedding it in your backend through the SDKs, is covered by the AGPL's terms for that use; if you are unsure how it applies to your setup, ask a lawyer. This page is a summary, not legal advice, and the licence texts in each folder of the repository are what count.

## Do not copy other vendors

Trace is an independent project. It does not use another vendor's code, weights, assets or branding, and contributions must not either.

## Third-party notices

- **Logos** of technologies shown on this site come from [Simple Icons](https://simpleicons.org) (CC0). Trademarks belong to their owners, and their use here only names the tools Trace works with.
- **Fonts**: Inter and Fragment Mono, under the SIL Open Font License.
- **Icons**: [Lucide](https://lucide.dev) (ISC).
- **Interface components**: built on [Radix UI](https://www.radix-ui.com) and [shadcn/ui](https://ui.shadcn.com) (MIT).

Each package lists its own dependencies and their licences in its `package.json` and lockfile.
