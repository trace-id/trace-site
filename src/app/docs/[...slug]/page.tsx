import { ArrowLeft, ArrowRight, Clock, SquarePen } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CodeCopy, PageActions, Toc } from '@/components/docs/DocClient';
import { SignalCatalog } from '@/components/docs/SignalCatalog';
import { DOC_PAGES, DOC_TABS, OSS_SLUGS, docHref, renderDoc } from '@/lib/docs';
import { CATEGORIES, loadSignalCatalog } from '@/lib/signal-catalog';
import { USE_CASES } from '@/lib/use-cases';
import { JsonLd, articleLd, breadcrumbLd, pageMetadata } from '@/lib/seo';
import { GITHUB_URL } from '@/lib/trace';

type Params = { slug: string[] };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return DOC_PAGES.map((p) => ({ slug: [p.slug] }));
}

const find = (params: Params) => DOC_PAGES.find((p) => p.slug === params.slug.join('/'));

/** Title and description for search results. A guide shares its name with the use-case page, so it says what it is. */
function seoText(page: NonNullable<ReturnType<typeof find>>): { title: string; description: string } {
  const sameName = USE_CASES.some((u) => u.title === page.title);
  const title = sameName ? `${page.title}: step-by-step guide` : page.title;
  const description =
    page.description.length < 70
      ? `${page.description}. A step-by-step guide with code to identify the device, verify the event on your server and decide.`
      : page.description;
  return { title, description };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const page = find(await params);
  if (!page) return {};
  const { title, description } = seoText(page);
  return pageMetadata({ title, description, path: `/docs/${page.slug}`, type: 'article', image: `/og/docs/${page.slug}` });
}

export default async function DocPage({ params }: { params: Promise<Params> }) {
  const page = find(await params);
  if (!page) notFound();
  // The signal catalog renders its table as searchable cards; the prose sections after it render as usual.
  const catalog = page.slug === 'signals' ? await loadSignalCatalog() : null;
  const doc = await renderDoc(page.slug, catalog?.rest);
  const headings = catalog
    ? [
        ...CATEGORIES.filter((c) => catalog.signals.some((s) => s.category === c.id)).map((c) => ({ depth: 2, text: c.title, id: `cat-${c.id}` })),
        ...doc.headings,
      ]
    : doc.headings;
  const inTab = DOC_PAGES.filter((p) => p.tab === page.tab);
  const i = inTab.indexOf(page);
  const prev = inTab[i - 1];
  const next = inTab[i + 1];
  const tab = DOC_TABS.find((t) => t.id === page.tab)!;
  const editUrl = OSS_SLUGS.has(page.slug) && GITHUB_URL !== 'https://github.com' ? `${GITHUB_URL.replace(/\/+$/, '')}/blob/main/docs/${page.slug}.md` : null;

  return (
    <div className="docs-page">
      <JsonLd
        data={[
          articleLd({ title: seoText(page).title, description: seoText(page).description, path: `/docs/${page.slug}` }),
          breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Documentation', path: '/docs' }, { name: page.title, path: `/docs/${page.slug}` }]),
        ]}
      />
      <main className="docs-main">
        <header className="doc-head">
          <nav className="doc-crumb" aria-label="Breadcrumb">
            <Link href={tab.href}>{tab.id === 'reference' ? 'API reference' : tab.label}</Link>
            <i aria-hidden="true">/</i>
            <span>{page.group}</span>
          </nav>
          <div className="doc-title">
            <h1>{doc.title || page.title}</h1>
            <PageActions slug={page.slug} />
          </div>
          <p className="doc-desc">{page.description}.</p>
          {page.time && (
            <p className="doc-time">
              <Clock size={14} aria-hidden="true" />
              {page.time}
            </p>
          )}
        </header>
        {catalog && (
          <div className="prose">
            <SignalCatalog signals={catalog.signals} categories={CATEGORIES} />
          </div>
        )}
        <article className="prose" dangerouslySetInnerHTML={{ __html: doc.html }} />
        <CodeCopy />
        <nav className="pager" aria-label="Pages">
          {prev ? (
            <Link href={docHref(prev.slug)}>
              <small><ArrowLeft size={13} aria-hidden="true" />Previous</small>
              {prev.title}
            </Link>
          ) : <span />}
          {next && (
            <Link href={docHref(next.slug)} className="next">
              <small>Next<ArrowRight size={13} aria-hidden="true" /></small>
              {next.title}
            </Link>
          )}
        </nav>
      </main>
      <aside className="toc" aria-label="Page tools">
        <Toc headings={headings} />
        {editUrl && (
          <a className="toc-edit" href={editUrl} target="_blank" rel="noopener noreferrer">
            <SquarePen size={14} aria-hidden="true" />
            Edit on GitHub
          </a>
        )}
      </aside>
    </div>
  );
}
