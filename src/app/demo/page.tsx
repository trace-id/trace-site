import type { Metadata } from 'next';
import { Playground } from '@/components/playground/Playground';
import { JsonLd, absoluteUrl, breadcrumbLd, pageMetadata, SITE_NAME } from '@/lib/seo';
import './playground.css';

export const metadata: Metadata = pageMetadata({
  title: 'Live demo',
  description: 'Trace identifies your browser live: visitor and device IDs, every fraud signal with its reason, the device graph and the raw responses.',
  path: '/demo',
});

export default function DemoPage() {
  return (
    <main className="pg-main">
      <JsonLd
        data={[
          { '@context': 'https://schema.org', '@type': 'WebApplication', name: `${SITE_NAME} live demo`, url: absoluteUrl('/demo'), applicationCategory: 'SecurityApplication', operatingSystem: 'Any (web browser)', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
          breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Live demo', path: '/demo' }]),
        ]}
      />
      <Playground />
    </main>
  );
}
