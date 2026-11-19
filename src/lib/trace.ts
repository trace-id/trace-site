/** Server-only settings for talking to the Trace server behind the demo. */
export function traceConfig() {
  const endpoint = (process.env.TRACE_ENDPOINT ?? '').replace(/\/+$/, '');
  return {
    endpoint,
    apiUrl: (process.env.TRACE_API_URL ?? endpoint).replace(/\/+$/, ''),
    publicKey: process.env.TRACE_PUBLIC_KEY ?? '',
    secretKey: process.env.TRACE_SECRET_KEY ?? '',
  };
}

export function demoConfigured(): boolean {
  const c = traceConfig();
  return Boolean(c.endpoint && c.publicKey.startsWith('pk_') && c.secretKey.startsWith('sk_'));
}

/** Project links. The repository and npm links can be overridden per deployment; the rest are fixed. */
export const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL ?? 'https://github.com/trace-id/trace';
export const GITHUB_ORG_URL = 'https://github.com/trace-id';
export const NPM_URL = process.env.NEXT_PUBLIC_NPM_URL ?? 'https://www.npmjs.com/org/trace-id';
export const PYPI_URL = 'https://pypi.org/project/trace-device/';
