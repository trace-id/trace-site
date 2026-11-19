import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** Legal and policy pages. Content lives in content/legal/<slug>.md and is rendered with the docs renderer. */
export interface LegalPage {
  slug: string;
  title: string;
  description: string;
  /** ISO date of the last substantive change. Update it whenever the text changes. */
  updated: string;
}

export const LEGAL_PAGES: LegalPage[] = [
  { slug: 'privacy', title: 'Privacy notice', description: 'What this website and its live demo handle, why, and your choices', updated: '2026-11-19' },
  { slug: 'terms', title: 'Terms of use', description: 'Terms for using this website, the documentation and the live demo', updated: '2026-11-19' },
  { slug: 'cookies', title: 'Cookies and browser storage', description: 'Everything this site stores in your browser, and how to remove it', updated: '2026-11-19' },
  { slug: 'security', title: 'Security policy', description: 'How to report a vulnerability in Trace, and what to expect', updated: '2026-11-19' },
  { slug: 'license', title: 'Licensing', description: 'Which licence applies to each part of Trace, and third-party notices', updated: '2026-11-19' },
];

export async function readLegal(slug: string): Promise<string> {
  return readFile(join(process.cwd(), 'content', 'legal', `${slug}.md`), 'utf8');
}
