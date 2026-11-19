/** Public origin of the site, for absolute URLs in the sitemap, robots and social metadata. Set SITE_URL in production. */
export const SITE_URL = (process.env.SITE_URL ?? 'http://localhost:3100').replace(/\/+$/, '');
