'use client';

import { ArrowUpRight, ChevronDown, Menu, Search as SearchIcon, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Lockup } from './Logo';
import { Search } from './Search';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from './shadcn/navigation-menu';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from './shadcn/sheet';
import { PageIcon } from './docs/icons';
import { DOC_GROUPS, FEATURED_DOCS, FEATURED_USE_CASES, INDUSTRY_GROUP, USE_CASE_GROUPS, type MenuGroup, type MenuLink } from './site-menu-data';
import { Button, IconButton, Kbd } from './ui';
import './site-header.css';

type MenuKey = 'use-cases' | 'docs';
type NavKey = MenuKey | 'demo' | 'github';

function activeKey(path: string): NavKey | null {
  if (path.startsWith('/use-cases') || path.startsWith('/industries')) return 'use-cases';
  if (path.startsWith('/docs')) return 'docs';
  if (path.startsWith('/demo')) return 'demo';
  return null;
}

/* ---------- Desktop dropdown contents (shadcn NavigationMenu, Radix underneath) ---------- */

function MenuIcon({ name, size }: { name?: string; size: number }) {
  return name ? <PageIcon name={name} size={size} /> : null;
}

function LinkColumn({ group }: { group: MenuGroup }) {
  return (
    <div className="sh-col">
      <h3 className="sh-col-title mono-label">{group.title}</h3>
      <ul>
        {group.links.map((l) => (
          <li key={l.href}>
            <NavigationMenuLink asChild>
              <Link href={l.href} title={l.note ? `${l.title} · ${l.note}` : undefined}>
                <MenuIcon name={l.icon} size={15} />
                <span>{l.title}</span>
              </Link>
            </NavigationMenuLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeaturedRows({ label, links }: { label: string; links: MenuLink[] }) {
  return (
    <div className="sh-feat">
      <h3 className="sh-col-title mono-label">{label}</h3>
      <ul>
        {links.map((l) => (
          <li key={l.href}>
            <NavigationMenuLink asChild>
              <Link href={l.href} className="sh-feat-row">
                <span className="sh-feat-ic"><MenuIcon name={l.icon} size={18} /></span>
                <span className="sh-feat-tx">
                  <b>{l.title}</b>
                  {l.desc && <small>{l.desc}</small>}
                </span>
              </Link>
            </NavigationMenuLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function UseCasesPanel() {
  return (
    <div className="sh-mega-inner sh-split">
      <FeaturedRows label="Popular" links={FEATURED_USE_CASES} />
      <div className="sh-uc-main">
        <div className="sh-mega-grid sh-grid-uc3">
          {USE_CASE_GROUPS.map((g) => (
            <LinkColumn key={g.title} group={g} />
          ))}
        </div>
        <div className="sh-ind">
          <h3 className="sh-col-title mono-label">{INDUSTRY_GROUP.title}</h3>
          <ul>
            {INDUSTRY_GROUP.links.map((l) => (
              <li key={l.href}>
                <NavigationMenuLink asChild>
                  <Link href={l.href}>
                    <MenuIcon name={l.icon} size={14} />
                    <span>{l.title}</span>
                  </Link>
                </NavigationMenuLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="sh-mega-foot">
        <span>Each page shows the signals, a sample event and the code to decide.</span>
        <NavigationMenuLink asChild>
          <Link href="/use-cases" className="arrow-link">All use cases</Link>
        </NavigationMenuLink>
      </div>
    </div>
  );
}

function DocsPanel({ onSearch }: { onSearch: () => void }) {
  return (
    <div className="sh-mega-inner sh-split">
      <FeaturedRows label="Start here" links={FEATURED_DOCS} />
      <div className="sh-mega-grid sh-grid-docs">
        {DOC_GROUPS.filter((g) => g.title !== 'Start').map((g) => (
          <LinkColumn key={g.title} group={g} />
        ))}
      </div>
      <div className="sh-mega-foot">
        <button type="button" className="sh-foot-search" onClick={onSearch}>
          <SearchIcon size={14} aria-hidden="true" /> Search the docs <Kbd>/</Kbd>
        </button>
        <NavigationMenuLink asChild>
          <Link href="/docs" className="arrow-link">Docs home</Link>
        </NavigationMenuLink>
      </div>
    </div>
  );
}

/* ---------- Mobile sheet (shadcn Sheet, Radix Dialog underneath: focus trap, scroll lock, Escape, focus return) ---------- */

function MobileMenu({ githubUrl, onClose }: { githubUrl: string; onClose: () => void }) {
  const docsGroups = DOC_GROUPS.filter((g) => g.title !== 'Start');
  return (
    <SheetContent side="top" showCloseButton={false} className="sh-sheet data-[state=open]:duration-200 data-[state=closed]:duration-150">
      <SheetTitle className="sr-only">Site menu</SheetTitle>
      <SheetDescription className="sr-only">Navigate use cases, documentation and the live demo.</SheetDescription>
      <div className="sh-sheet-top">
        <Link href="/" className="brand" aria-label="Trace home" onClick={onClose}>
          <Lockup />
        </Link>
        <SheetClose asChild>
          <IconButton label="Close menu" icon={<X size={20} aria-hidden="true" />} />
        </SheetClose>
      </div>
      <nav className="sh-sheet-body" aria-label="Main">
        <ul className="sh-sheet-primary">
          <li><Link href="/demo" onClick={onClose}>Live demo <ArrowUpRight size={16} aria-hidden="true" /></Link></li>
          <li><Link href="/docs/quickstart" onClick={onClose}>Quickstart <ArrowUpRight size={16} aria-hidden="true" /></Link></li>
          <li><a href={githubUrl} target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRight size={16} aria-hidden="true" /></a></li>
        </ul>

        <section aria-labelledby="sh-m-uc">
          <h2 id="sh-m-uc" className="sh-sheet-h mono-label">
            <span>Use cases</span>
            <Link href="/use-cases" onClick={onClose}>All</Link>
          </h2>
          {[...USE_CASE_GROUPS, INDUSTRY_GROUP].map((g) => (
            <details key={g.title} className="sh-acc">
              <summary>
                {g.title}
                <ChevronDown size={16} aria-hidden="true" />
              </summary>
              <ul>
                {g.links.map((l) => (
                  <li key={l.href}><Link href={l.href} onClick={onClose}>{l.title}</Link></li>
                ))}
              </ul>
            </details>
          ))}
        </section>

        <section aria-labelledby="sh-m-docs">
          <h2 id="sh-m-docs" className="sh-sheet-h mono-label">
            <span>Docs</span>
            <Link href="/docs" onClick={onClose}>All</Link>
          </h2>
          {docsGroups.map((g) => (
            <details key={g.title} className="sh-acc">
              <summary>
                {g.title}
                <ChevronDown size={16} aria-hidden="true" />
              </summary>
              <ul>
                {g.links.map((l) => (
                  <li key={l.href}><Link href={l.href} onClick={onClose}>{l.title}</Link></li>
                ))}
              </ul>
            </details>
          ))}
        </section>
      </nav>
      <div className="sh-sheet-foot">
        <Button href="/docs/quickstart" variant="primary" size="lg" fullWidth onClick={onClose}>Get started</Button>
        <Button href="/demo" variant="secondary" size="lg" fullWidth onClick={onClose}>Live demo</Button>
        <p className="mono-label is-lower">Pre-release. Open source, self-hosted.</p>
      </div>
    </SheetContent>
  );
}

/* ---------- Header ---------- */

/** Flat 56px white bar: logo, centred nav with two dropdowns, search, outline "Live demo", solid "Get started". Dropdowns are shadcn NavigationMenu; below 900px a burger opens a shadcn Sheet. */
export function SiteHeader({ githubUrl }: { githubUrl: string }) {
  const path = usePathname() ?? '/';
  const [menu, setMenu] = useState('');
  const [mobile, setMobile] = useState(false);
  const active = activeKey(path);

  /* Route change closes everything. */
  useEffect(() => {
    setMenu('');
    setMobile(false);
  }, [path]);

  /* Close the sheet when the viewport grows past the mobile breakpoint. */
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)');
    const onMq = () => mq.matches && setMobile(false);
    mq.addEventListener('change', onMq);
    return () => mq.removeEventListener('change', onMq);
  }, []);

  return (
    <header className="site-header">
      <div className="sh-bar">
        <Link href="/" className="brand sh-brand" aria-label="Trace home">
          <Lockup />
        </Link>

        <NavigationMenu viewport={false} value={menu} onValueChange={setMenu} className="sh-nav" aria-label="Main">
          <NavigationMenuList className="sh-list">
            <NavigationMenuItem className="sh-item" data-active={active === 'use-cases' || undefined}>
              <NavigationMenuTrigger className="sh-link">Use cases</NavigationMenuTrigger>
              <NavigationMenuContent className="sh-mega">
                <UseCasesPanel />
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem className="sh-item" data-active={active === 'docs' || undefined}>
              <NavigationMenuTrigger className="sh-link">Docs</NavigationMenuTrigger>
              <NavigationMenuContent className="sh-mega">
                <DocsPanel
                  onSearch={() => {
                    setMenu('');
                    window.dispatchEvent(new Event('trace:search'));
                  }}
                />
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem className="sh-item" data-active={active === 'demo' || undefined}>
              <NavigationMenuLink asChild>
                <Link href="/demo" className="sh-link" aria-current={active === 'demo' ? 'page' : undefined}>Demo</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem className="sh-item">
              <NavigationMenuLink asChild>
                <a href={githubUrl} className="sh-link" target="_blank" rel="noopener noreferrer">
                  GitHub <ArrowUpRight size={13} aria-hidden="true" className="sh-ext" />
                </a>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="sh-right">
          <Search />
          <Button href="/demo" variant="secondary" size="sm" className="sh-demo">Live demo</Button>
          <Button href="/docs/quickstart" variant="primary" size="sm" className="sh-cta">Get started</Button>
          <Sheet open={mobile} onOpenChange={setMobile}>
            <SheetTrigger asChild>
              <IconButton className="sh-burger" label="Open menu" icon={<Menu size={20} aria-hidden="true" />} />
            </SheetTrigger>
            <MobileMenu githubUrl={githubUrl} onClose={() => setMobile(false)} />
          </Sheet>
        </div>
      </div>
    </header>
  );
}
