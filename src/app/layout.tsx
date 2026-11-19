import type { Metadata, Viewport } from 'next';
import { SITE_URL } from '@/lib/site';
import { JsonLd, organizationLd, SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_TAGLINE, websiteLd } from '@/lib/seo';
import { Fragment_Mono, Inter } from 'next/font/google';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { GITHUB_URL } from '@/lib/trace';
import { MotionProvider } from '@/components/MotionProvider';
import { Toaster } from '@/components/shadcn/sonner';
import './tailwind.css';
import './globals.css';
import '@/components/ui/ui.css';

/* Inter is the only sans: headlines use it too (--font-display aliases --font-sans in globals.css). */
const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = Fragment_Mono({ subsets: ['latin'], weight: ['400'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME}: ${SITE_TAGLINE}`, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: SITE_KEYWORDS,
  authors: [{ name: 'The Trace contributors' }],
  creator: 'The Trace contributors',
  alternates: { canonical: '/' },
  openGraph: { type: 'website', siteName: SITE_NAME, locale: 'en_US', url: '/', title: `${SITE_NAME}: ${SITE_TAGLINE}`, description: SITE_DESCRIPTION },
  twitter: { card: 'summary_large_image', title: `${SITE_NAME}: ${SITE_TAGLINE}`, description: SITE_DESCRIPTION },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  // Search Console and Bing Webmaster tokens, set in the environment when the site is claimed.
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : {}),
    ...(process.env.BING_SITE_VERIFICATION ? { other: { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } } : {}),
  },
  formatDetection: { email: false, address: false, telephone: false },
};

export const viewport: Viewport = { themeColor: '#f8f8f6' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <JsonLd data={[organizationLd(), websiteLd()]} />
        <MotionProvider>
          <SiteHeader githubUrl={GITHUB_URL} />
          {children}
          <SiteFooter githubUrl={GITHUB_URL} />
          <Toaster position="bottom-right" />
        </MotionProvider>
      </body>
    </html>
  );
}
