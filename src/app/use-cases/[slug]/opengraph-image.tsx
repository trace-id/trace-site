import { OG_SIZE, ogCard } from '@/lib/og';
import { USE_CASES, useCase } from '@/lib/use-cases';

export const alt = 'Trace use case';
export const size = OG_SIZE;
export const contentType = 'image/png';
export const dynamicParams = false;

export function generateStaticParams() {
  return USE_CASES.map((u) => ({ slug: u.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const u = useCase((await params).slug);
  return ogCard({ eyebrow: 'Use case', title: u?.title ?? 'Use case', subtitle: u?.sub });
}
