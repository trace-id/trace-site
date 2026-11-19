import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Marked, type Tokens } from 'marked';
import { codeToHtml } from 'shiki';
import * as simpleIcons from 'simple-icons';
import { useCaseGuide } from './use-case-guide';

import { DOC_PAGES, docHref } from './docs-nav';

export { DOC_PAGES, DOC_TABS, OSS_SLUGS, docHref, type DocPage, type DocTab } from './docs-nav';

const SLUGS = new Set(DOC_PAGES.map((p) => p.slug));
const CONTENT = join(process.cwd(), 'content', 'docs');


export async function readDoc(slug: string): Promise<string> {
  try {
    return await readFile(join(CONTENT, `${slug === 'overview' || !slug ? 'index' : slug}.md`), 'utf8');
  } catch (err) {
    const generated = useCaseGuide(slug);
    if (generated) return generated;
    throw err;
  }
}

/** GitHub-style heading anchors, so links work the same here and in the repository. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s/g, '-');
}

const ICON_PATHS: Record<string, string> = {
  tip: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  note: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  warning: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  caution: '<path d="M12 16h.01"/><path d="M12 8v4"/><path d="M15.31 2a2 2 0 0 1 1.41.59l4.7 4.7a2 2 0 0 1 .58 1.4v6.62a2 2 0 0 1-.59 1.41l-4.7 4.7a2 2 0 0 1-1.4.58H8.7a2 2 0 0 1-1.41-.59l-4.7-4.7A2 2 0 0 1 2 15.3V8.7a2 2 0 0 1 .59-1.41l4.7-4.7A2 2 0 0 1 8.7 2z"/>',
};
const svg = (inner: string, size = 16) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
const calloutIcon = (k: string) => svg(ICON_PATHS[k === 'important' ? 'warning' : k === 'info' ? 'note' : k] ?? ICON_PATHS.note!);

const ALERT_TITLES: Record<string, string> = { tip: 'Tip', note: 'Note', warning: 'Warning', important: 'Important', caution: 'Caution', info: 'Note' };

/** VitePress containers (::: tip Title) and GitHub alerts (> [!TIP]) become callout blocks. */
function preprocess(md: string): string {
  let out = md.replace(/^---[\s\S]*?---\n/, '');
  out = out.replace(/^:::\s*(tip|warning|info|danger|details)\s*(.*)\n([\s\S]*?)^:::\s*$/gm, (_m, kind: string, title: string, body: string) => {
    if (kind === 'details') return `<details class="callout"><summary>${title || 'Details'}</summary>\n\n${body}\n</details>\n`;
    const k = kind === 'danger' ? 'caution' : kind;
    return `<div class="callout callout-${k}" role="note"><span class="callout-ic">${calloutIcon(k)}</span><div class="callout-body"><p class="callout-title">${title || ALERT_TITLES[k] || 'Note'}</p>\n\n${body}\n</div></div>\n`;
  });
  out = out.replace(/^> \[!(TIP|NOTE|WARNING|IMPORTANT|CAUTION)\]\n((?:^>.*\n?)*)/gm, (_m, kind: string, body: string) => {
    const k = kind.toLowerCase();
    let inner = body.replace(/^> ?/gm, '');
    // A bold first line is the alert's title (how the repo writes titled callouts).
    let title = ALERT_TITLES[k];
    const t = /^\*\*(.+?)\*\*\n/.exec(inner);
    if (t) {
      title = t[1]!;
      inner = inner.slice(t[0].length);
    }
    return `<div class="callout callout-${k}" role="note"><span class="callout-ic">${calloutIcon(k)}</span><div class="callout-body"><p class="callout-title">${title}</p>\n\n${inner}\n</div></div>\n`;
  });
  return out;
}

const REPO = (process.env.NEXT_PUBLIC_GITHUB_URL ?? 'https://github.com/trace-id/trace').replace(/\/+$/, '');

/** Links between pages: /signals#x and signals.md#x both become /docs/signals#x; links into the repo go to GitHub. */
export function rewriteHref(href: string): string {
  if (href.startsWith('../')) return `${REPO}/blob/main/${href.slice(3)}`;
  const m = /^(?:\/|\.\/)?([\w-]+?)(?:\.md)?(#.*)?$/.exec(href);
  if (href === '/' || href === './index.md' || href === '/overview' || href === 'index.md' || href === 'README.md') return '/docs/overview';
  if (m && SLUGS.has(m[1]!) && !href.startsWith('http')) return `/docs/${m[1]}${m[2] ?? ''}`;
  if (href.startsWith('#')) return href;
  return href;
}

export interface Heading {
  depth: number;
  text: string;
  id: string;
}

export interface RenderedDoc {
  html: string;
  headings: Heading[];
  title: string;
}

/** Rows that start with a `code` name (the signal catalog) get an anchor: #signal-bot, #signal-vpn. */
const rowId = (first?: string) => {
  const m = /^`([A-Za-z][\w.]*)`$/.exec(first?.trim() ?? '');
  return m ? ` id="signal-${m[1]!.replace(/\./g, '-')}"` : '';
};

const LANG_LABEL: Record<string, string> = {
  sh: 'Terminal', bash: 'Terminal', shell: 'Terminal', ts: 'TypeScript', typescript: 'TypeScript', tsx: 'TSX', js: 'JavaScript', javascript: 'JavaScript',
  jsx: 'JSX', json: 'JSON', html: 'HTML', python: 'Python', py: 'Python', php: 'PHP', java: 'Java', yaml: 'YAML', yml: 'YAML', nginx: 'nginx',
  caddy: 'Caddyfile', sql: 'SQL', http: 'HTTP', text: 'Text', env: '.env', dotenv: '.env', vue: 'Vue', svelte: 'Svelte', dockerfile: 'Dockerfile',
};
const COPY_ICON = svg('<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>', 14);

/** Numbered h2s ("## 1. Start Trace") become a steps list with a rail. */
function wrapSteps(html: string): string {
  const parts = html.split(/(?=<h2 )/);
  let inSteps = false;
  const out: string[] = [];
  for (const part of parts) {
    const m = /^<h2 id="([^"]*)"><a class="anchor"[^>]*>#<\/a>(\d+)\.\s*/.exec(part);
    if (m) {
      if (!inSteps) out.push('<ol class="steps">');
      inSteps = true;
      out.push(`<li class="step"><span class="step-n">${m[2]}</span>${part.replace(m[0], `<h2 id="${m[1]}"><a class="anchor" href="#${m[1]}" aria-hidden="true" tabindex="-1">#</a>`)}</li>`);
    } else {
      if (inSteps) out.push('</ol>');
      inSteps = false;
      out.push(part);
    }
  }
  if (inSteps) out.push('</ol>');
  return out.join('');
}

const decode = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

async function highlight(code: string, lang: string): Promise<string> {
  try {
    return await codeToHtml(code, { lang: lang === 'sh' ? 'bash' : lang, themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false });
  } catch {
    return codeToHtml(code, { lang: 'text', themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false });
  }
}

const CHECK_ICON =
  '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8" pathLength="1"/></svg>';
const COPY_BTN = `<button type="button" class="code-copy" data-copy aria-label="Copy code"><span class="cc-ic">${COPY_ICON}${CHECK_ICON}</span><i>Copy</i></button>`;
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function brandSvg(name: string, size = 20): string {
  const key = `si${name.charAt(0).toUpperCase()}${name.slice(1)}` as keyof typeof simpleIcons;
  const icon = simpleIcons[key] as { path: string; hex: string } | undefined;
  if (!icon || typeof icon !== 'object' || !('path' in icon)) return '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${icon.path}"/></svg>`;
}

/**
 * Site-only blocks, rendered after Markdown:
 *   ::: code-group            fences tagged ```sh [npm]  become tabs (the choice is remembered across the page)
 *   ::: cards                 "- [Title](href) brand:react: description" lines become a grid of link cards
 */
async function extractBlocks(md: string): Promise<{ md: string; blocks: string[] }> {
  const blocks: string[] = [];
  const jobs: Promise<void>[] = [];
  const out = md.replace(/^:::\s*(code-group|cards)\s*\n([\s\S]*?)^:::\s*$/gm, (_m, kind: string, body: string) => {
    const i = blocks.push('') - 1;
    if (kind === 'code-group') {
      const fences = [...body.matchAll(/^```([\w-]*)\s*(?:\[([^\]]+)\])?\s*\n([\s\S]*?)^```\s*$/gm)];
      jobs.push(
        (async () => {
          const panels = await Promise.all(fences.map((f) => highlight(f[3]!.replace(/\n$/, ''), f[1] || 'text')));
          const labels = fences.map((f) => f[2] ?? LANG_LABEL[f[1] ?? ''] ?? f[1] ?? 'Code');
          const tabs = labels.map((l, j) => `<button type="button" role="tab" data-tab="${esc(l)}" aria-selected="${j === 0}">${esc(l)}</button>`).join('');
          const bodies = panels.map((h, j) => `<div class="code-panel" role="tabpanel" data-panel="${esc(labels[j]!)}"${j === 0 ? '' : ' hidden'}>${h}</div>`).join('');
          blocks[i] = `<div class="code code-group"><div class="code-head"><div class="code-tabs" role="tablist" aria-label="Code variants">${tabs}<span class="code-ind" aria-hidden="true"></span></div>${COPY_BTN}</div>${bodies}</div>`;
        })(),
      );
    } else {
      const items = [...body.matchAll(/^- \[([^\]]+)\]\(([^)]+)\)(?:\s+(brand:[\w]+))?(?::\s*(.*))?$/gm)];
      blocks[i] = `<div class="cards">${items
        .map((c) => {
          const href = rewriteHref(c[2]!);
          const icon = c[3] ? `<span class="card-ic">${brandSvg(c[3].slice(6))}</span>` : '';
          return `<a class="card-link" href="${href}">${icon}<span><b>${esc(c[1]!)}</b>${c[4] ? `<small>${esc(c[4])}</small>` : ''}</span><i aria-hidden="true">&rarr;</i></a>`;
        })
        .join('')}</div>`;
    }
    return `\n\nBLOCK${i}PLACEHOLDER\n\n`;
  });
  await Promise.all(jobs);
  return { md: out, blocks };
}

/** Renders a page. `markdown` replaces the file's content (pages that render part of it themselves). */
export async function renderDoc(slug: string, markdown?: string): Promise<RenderedDoc> {
  const extracted = await extractBlocks(markdown ?? (await readDoc(slug)));
  const source = preprocess(extracted.md);
  const headings: Heading[] = [];
  let title = '';
  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth, text }: Tokens.Heading) {
        const inner = this.parser.parseInline(tokens);
        const id = slugify(text);
        if (depth === 1 && !title) title = text;
        if (depth === 1) return '';
        if (depth === 2 || depth === 3) headings.push({ depth, text: text.replace(/`/g, '').replace(/^\d+\.\s*/, ''), id });
        return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${inner}</h${depth}>\n`;
      },
      link({ href, title: t, tokens }: Tokens.Link) {
        const inner = this.parser.parseInline(tokens);
        const target = rewriteHref(href);
        const external = /^https?:\/\//.test(target);
        return `<a href="${target}"${t ? ` title="${t}"` : ''}${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${inner}</a>`;
      },
      table(token: Tokens.Table) {
        // Wide tables scroll inside their own box instead of widening the page.
        const head = token.header.map((c) => `<th>${this.parser.parseInline(c.tokens)}</th>`).join('');
        const rows = token.rows.map((r) => `<tr${rowId(r[0]?.text)}>${r.map((c) => `<td>${this.parser.parseInline(c.tokens)}</td>`).join('')}</tr>`).join('');
        return `<div class="table-frame"><div class="table-wrap" tabindex="0" role="region" aria-label="Table, scrollable"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div></div>\n`;
      },
    },
  });
  let html = await marked.parse(source);

  // Syntax highlighting with light and dark themes, switched by CSS.
  const blocks = [...html.matchAll(/<pre><code(?: class="language-([\w-]+)")?>([\s\S]*?)<\/code><\/pre>/g)];
  for (const b of blocks) {
    const lang = b[1] ?? 'text';
    const code = decode(b[2] ?? '').replace(/\n$/, '');
    const highlighted = await highlight(code, lang);
    const label = LANG_LABEL[lang] ?? lang;
    html = html.replace(
      b[0],
      `<div class="code" data-lang="${lang}"><div class="code-head"><span class="code-lang"><i aria-hidden="true"></i>${label}</span>${COPY_BTN}</div>${highlighted}</div>`,
    );
  }
  html = html.replace(/<p>BLOCK(\d+)PLACEHOLDER<\/p>/g, (_m, n: string) => extracted.blocks[Number(n)] ?? '');
  return { html: wrapSteps(html), headings, title };
}

export interface SearchEntry {
  slug: string;
  page: string;
  heading: string;
  id: string;
  text: string;
}

/** One entry per section, for the client-side search box. */
export async function searchIndex(): Promise<SearchEntry[]> {
  const out: SearchEntry[] = [];
  for (const p of DOC_PAGES) {
    const md = preprocess(await readDoc(p.slug));
    const sections = md.split(/^(?=#{1,3} )/m);
    for (const s of sections) {
      const m = /^(#{1,3}) (.+)\n/.exec(s);
      const heading = m ? m[2]!.replace(/`/g, '').replace(/^\d+\.\s*/, '') : p.title;
      const text = s
        .replace(/^#{1,3} .+\n/, '')
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/[`*_|>[\]()#-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 400);
      out.push({ slug: p.slug, page: p.title, heading, id: m && m[1]!.length > 1 ? slugify(m[2]!) : '', text });
    }
  }
  return out;
}

/** llms.txt index and the full plain-text docs, from the same pages the site renders. */
export async function llmsIndex(siteUrl: string): Promise<string> {
  return [
    '# Trace',
    '',
    '> Open-source, self-hostable device identification and fraud signals: a browser SDK returns a visitor id, a server-verified event carries a suspect score and the signals behind it (bots, anti-detect browsers, VPNs, multi-accounting, cross-browser device links).',
    '',
    '## Docs',
    '',
    ...DOC_PAGES.map((p) => `- [${p.title}](${siteUrl}${docHref(p.slug)}): ${p.description}`),
    '',
    '## Machine-readable',
    '',
    `- [All docs in one file](${siteUrl}/llms-full.txt)`,
    '- OpenAPI 3.1: GET /openapi.json on any Trace server',
    '- MCP server: npx @trace-id/mcp',
    '',
  ].join('\n');
}

export async function llmsFull(): Promise<string> {
  const parts: string[] = [];
  for (const p of DOC_PAGES) parts.push(`# ${p.title}\n\nSource: ${docHref(p.slug)}\n\n${preprocess(await readDoc(p.slug)).trim()}`);
  return `${parts.join('\n\n---\n\n')}\n`;
}
