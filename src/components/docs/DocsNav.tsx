'use client';

import { AnimatePresence, MotionConfig, motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { ArrowUpRight, ChevronDown, House } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { DOC_LINKS, DOC_PAGES, DOC_TABS, type DocTab, GROUP_ICONS, docHref } from '@/lib/docs-nav';
import { DUR, EASE_IN, EASE_OUT, SPRING } from '../ui/motion';
import { SearchTrigger } from './DocClient';
import { PageIcon } from './icons';

const slugOf = (path: string) => path.replace(/^\/docs\/?/, '').replace(/\/$/, '');
const tabOf = (path: string): DocTab | 'home' => DOC_PAGES.find((p) => p.slug === slugOf(path))?.tab ?? 'home';

/** Icons for groups that docs-nav does not give one. */
const FALLBACK_GROUP_ICONS: Record<string, string> = { 'Getting started': 'rocket', Integrate: 'plug', 'Run in production': 'server' };

/** A 2px accent hairline under the tabs row: how far down the page you are. */
function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const reduce = useReducedMotion();
  const smooth = useSpring(scrollYProgress, { stiffness: 220, damping: 34, mass: 0.4 });
  return <motion.div className="docs-progress" aria-hidden="true" style={{ scaleX: reduce ? scrollYProgress : smooth }} />;
}

/** The docs section bar under the site header. The active tab has a sliding trace underline. */
export function DocsTabs() {
  const path = usePathname() ?? '/docs';
  const tab = tabOf(path);
  const items = [
    { id: 'home', label: 'Home', href: '/docs', icon: null as string | null },
    ...DOC_TABS.map((t) => ({ id: t.id as string, label: t.id === 'reference' ? 'API reference' : t.label, href: t.href, icon: t.icon as string | null })),
  ];
  return (
    <div className="docs-tabs">
      <div className="docs-tabs-in">
        <nav aria-label="Docs sections">
          {items.map((t) => {
            const on = tab === t.id;
            return (
              <Link key={t.id} href={t.href} aria-current={on ? 'page' : undefined}>
                {t.icon ? <PageIcon name={t.icon} size={15} /> : <House size={15} strokeWidth={1.75} aria-hidden="true" />}
                {t.label}
                {on && <motion.span layoutId="docs-tab-line" className="docs-tab-line" transition={SPRING} />}
              </Link>
            );
          })}
        </nav>
        <SearchTrigger className="docs-search" label="Search docs" />
      </div>
      {tab !== 'home' && <ReadingProgress />}
    </div>
  );
}

/** Pages of the current tab, grouped. Groups collapse; the active page has a pill that slides between items. */
function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname() ?? '/docs';
  const slug = slugOf(path);
  const tab = tabOf(path);
  const pages = DOC_PAGES.filter((p) => p.tab === tab);
  const groups = [...new Set(pages.map((p) => p.group))];
  const currentGroup = DOC_PAGES.find((p) => p.slug === slug)?.group;
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const uid = useId();

  // Navigating to a page in a collapsed group opens that group.
  useEffect(() => {
    if (currentGroup) setClosed((c) => (c[currentGroup] ? { ...c, [currentGroup]: false } : c));
  }, [currentGroup]);

  return (
    <>
      {groups.map((g) => {
        const isOpen = !closed[g];
        const panelId = `${uid}-${g.replace(/\W+/g, '-')}`;
        const links = DOC_LINKS.filter((l) => l.tab === tab && l.group === g);
        const inGroup = pages.filter((p) => p.group === g);
        return (
          <div key={`${tab}-${g}`} className="docs-group">
            <h4>
              <button type="button" aria-expanded={isOpen} aria-controls={panelId} onClick={() => setClosed((c) => ({ ...c, [g]: isOpen }))}>
                <PageIcon name={GROUP_ICONS[g] ?? FALLBACK_GROUP_ICONS[g] ?? 'book-open'} size={15} />
                <span>{g}</span>
                <i className="dg-count" aria-hidden="true">{inGroup.length + links.length}</i>
                <ChevronDown size={14} aria-hidden="true" className="dg-chev" data-open={isOpen} />
              </button>
            </h4>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  className="docs-group-items"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1, transition: { height: { duration: DUR.component, ease: EASE_OUT }, opacity: { duration: DUR.component, delay: 0.04 } } }}
                  exit={{ height: 0, opacity: 0, transition: { duration: DUR.micro + 0.06, ease: EASE_IN } }}
                >
                  {inGroup.map((p) => {
                    const on = p.slug === slug;
                    return (
                      <Link key={p.slug} href={docHref(p.slug)} aria-current={on ? 'page' : undefined} onClick={onNavigate}>
                        {on && <motion.span layoutId="docs-side-pill" className="ds-pill" transition={SPRING} />}
                        <PageIcon name={p.icon} />
                        <span className="ds-label">{p.title}</span>
                      </Link>
                    );
                  })}
                  {links.map((l) => (
                    <Link key={l.href} href={l.href} className="ext" onClick={onNavigate}>
                      <PageIcon name={l.icon} />
                      <span className="ds-label">{l.title}</span>
                      <ArrowUpRight size={13} aria-hidden="true" className="ext-ic" />
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </>
  );
}

/** Persistent sidebar (lives in the docs layout so its scroll position, open groups and sliding pill survive navigation).
 *  Below 900px it becomes a toggle bar that drops a sheet. */
export function DocsSidebar() {
  const path = usePathname() ?? '/docs';
  const slug = slugOf(path);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const current = DOC_PAGES.find((p) => p.slug === slug);
  const sheetId = useId();

  useEffect(() => setOpen(false), [path]);

  // Keep the active page in view in the sidebar (its scroll position itself survives navigation: the sidebar lives in the layout).
  useEffect(() => {
    const box = root.current;
    if (!box || !window.matchMedia('(min-width: 901px)').matches) return;
    const id = requestAnimationFrame(() => {
      const el = box.querySelector<HTMLElement>('[aria-current="page"]');
      if (!el) return;
      const r = el.getBoundingClientRect();
      const c = box.getBoundingClientRect();
      if (r.top < c.top + 40) box.scrollTop -= c.top + 40 - r.top;
      else if (r.bottom > c.bottom - 40) box.scrollTop += r.bottom - (c.bottom - 40);
    });
    return () => cancelAnimationFrame(id);
  }, [path]);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key);
    };
  }, [open]);

  return (
    <aside ref={root} className="docs-side" data-open={open} aria-label="Docs pages">
      <button ref={toggle} type="button" className="docs-side-toggle" aria-expanded={open} aria-controls={sheetId} onClick={() => setOpen((o) => !o)}>
        {current && <PageIcon name={current.icon} />}
        <span>{current?.title ?? 'Menu'}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      <div id={sheetId} className="docs-side-list">
        <SidebarBody onNavigate={() => setOpen(false)} />
      </div>
    </aside>
  );
}

/** Layout shell: the docs sections bar always, plus the persistent sidebar on every page but the docs home. */
export function DocsShell({ children }: { children: ReactNode }) {
  const path = usePathname() ?? '/docs';
  const home = slugOf(path) === '';
  return (
    <MotionConfig reducedMotion="user">
      <DocsTabs />
      {home ? (
        children
      ) : (
        <div className="docs frame">
          <DocsSidebar />
          <div className="docs-content">{children}</div>
        </div>
      )}
    </MotionConfig>
  );
}
