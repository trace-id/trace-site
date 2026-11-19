import { OG_SIZE, ogCard } from '@/lib/og';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/seo';

export const alt = `${SITE_NAME}: ${SITE_TAGLINE}`;
export const size = OG_SIZE;
export const contentType = 'image/png';

/** Default social card: the headline and the three things Trace returns. */
export default function OpenGraphImage() {
  return ogCard({ eyebrow: 'Open source · self-hosted', title: 'Same device. Same ID.', subtitle: 'Device identification and fraud signals, on your own servers.' });
}
