import { GITHUB_URL } from '@/lib/trace';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

/** RFC 9116. Contact is the repository's private vulnerability reporting, so no email address is published here. */
export function GET() {
  const expires = new Date(Date.UTC(new Date().getUTCFullYear() + 1, 0, 1)).toISOString();
  const repo = GITHUB_URL.replace(/\/+$/, '');
  const lines = [
    ...(repo !== 'https://github.com' ? [`Contact: ${repo}/security/advisories/new`] : []),
    `Expires: ${expires}`,
    'Preferred-Languages: en',
    `Canonical: ${SITE_URL}/.well-known/security.txt`,
    `Policy: ${SITE_URL}/security`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' } });
}
