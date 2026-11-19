// Copies the docs pages the open-source repository owns into content/docs, so the site shows exactly what self-hosters
// read in the repo. Pages the site owns (overview, quickstart, agents) are edited here directly.
// Usage: npm run sync-docs   (TRACE_REPO=/path/to/trace to override the default ../trace)
import { copyFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const OSS_PAGES = ['api', 'configuration', 'self-hosting', 'embedded', 'signals', 'privacy', 'security-checklist', 'accuracy', 'integration'];

const repo = resolve(process.env.TRACE_REPO ?? join(import.meta.dirname, '..', '..', 'trace'));
const from = join(repo, 'docs');
if (!existsSync(from)) {
  console.error(`No docs folder at ${from}; set TRACE_REPO`);
  process.exit(1);
}
for (const page of OSS_PAGES) {
  copyFileSync(join(from, `${page}.md`), join(import.meta.dirname, '..', 'content', 'docs', `${page}.md`));
}
console.log(`synced ${OSS_PAGES.length} pages from ${from}`);
