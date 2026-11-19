import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LEGAL_PAGES, readLegal } from '@/lib/legal';
import { JsonLd, breadcrumbLd, pageMetadata } from '@/lib/seo';
import { renderDoc } from '@/lib/docs';

type Params = { legal: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return LEGAL_PAGES.map((p) => ({ legal: p.slug }));
}

const find = (slug: string) => LEGAL_PAGES.find((p) => p.slug === slug);

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const page = find((await params).legal);
  if (!page) return {};
  return pageMetadata({ title: page.title, description: page.description, path: `/${page.slug}`, type: 'article' });
}

export default async function LegalPage({ params }: { params: Promise<Params> }) {
  const page = find((await params).legal);
  if (!page) notFound();
  const doc = await renderDoc(`legal-${page.slug}`, await readLegal(page.slug));
  return (
    <main className="legal-in">
      <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: page.title, path: `/${page.slug}` }])} />
      <nav aria-label="Policies">
        <ul className="legal-nav">
          {LEGAL_PAGES.map((p) => (
            <li key={p.slug}>
              <Link href={`/${p.slug}`} aria-current={p.slug === page.slug ? 'page' : undefined}>{p.title}</Link>
            </li>
          ))}
        </ul>
      </nav>
      <header className="doc-head">
        <div className="doc-title">
          <h1>{doc.title || page.title}</h1>
        </div>
        <p className="legal-updated">Last updated <time dateTime={page.updated}>{page.updated}</time></p>
      </header>
      <article className="prose" dangerouslySetInnerHTML={{ __html: doc.html }} />
    </main>
  );
}
