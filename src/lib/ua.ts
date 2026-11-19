/** Short "Chrome 131" / "macOS" labels from a user-agent string. Display only. */
export function browserName(ua: string): string {
  const m =
    ua.match(/HeadlessChrome\/(\d+)/) ? ['HeadlessChrome', ua.match(/HeadlessChrome\/(\d+)/)![1]] :
    ua.match(/Edg\/(\d+)/) ? ['Edge', ua.match(/Edg\/(\d+)/)![1]] :
    ua.match(/OPR\/(\d+)/) ? ['Opera', ua.match(/OPR\/(\d+)/)![1]] :
    ua.match(/Firefox\/(\d+)/) ? ['Firefox', ua.match(/Firefox\/(\d+)/)![1]] :
    ua.match(/Chrome\/(\d+)/) ? ['Chrome', ua.match(/Chrome\/(\d+)/)![1]] :
    ua.match(/Version\/(\d+).*Safari/) ? ['Safari', ua.match(/Version\/(\d+)/)![1]] :
    null;
  return m ? `${m[0]} ${m[1]}` : 'Browser';
}

export function osName(ua: string): string {
  if (/Windows NT/.test(ua)) return 'Windows';
  if (/iPhone|iPad/.test(ua)) return 'iOS';
  if (/Mac OS X/.test(ua)) return 'macOS';
  if (/Android/.test(ua)) return 'Android';
  if (/CrOS/.test(ua)) return 'ChromeOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown';
}

export const cap = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);
