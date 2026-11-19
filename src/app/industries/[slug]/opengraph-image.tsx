import { OG_SIZE, ogCard } from '@/lib/og';
import { INDUSTRIES, industry } from '@/lib/use-cases';

export const alt = 'Trace for your industry';
export const size = OG_SIZE;
export const contentType = 'image/png';
export const dynamicParams = false;

export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ slug: i.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const ind = industry((await params).slug);
  return ogCard({ eyebrow: 'Industry', title: ind ? `${ind.title}: fraud prevention` : 'Fraud prevention', subtitle: ind?.sub });
}
