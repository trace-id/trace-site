'use client';

import { Dialog as DialogPrimitive } from 'radix-ui';
import { CornerDownLeft, History, Search as SearchIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/shadcn/command';
import { Dialog, DialogDescription, DialogOverlay, DialogPortal, DialogTitle } from '@/components/shadcn/dialog';
import { DOC_PAGES } from '@/lib/docs-nav';
import { PageIcon } from './docs/icons';
import { Kbd } from './ui';
import './search.css';

interface Entry {
  slug: string;
  page: string;
  heading: string;
  id: string;
  text: string;
}

interface Hit {
  entry: Entry;
  group: string;
  icon: string;
  crumb: string;
  score: number;
}

const RECENT_KEY = 'trace-search-recent';
const USE_CASE_GROUPS = new Set(['Abuse and fraud', 'Security and payments', 'Revenue protection']);
/** Real pages offered before anything is typed and nothing was searched yet. */
const SUGGESTED = ['quickstart', 'browser-sdk', 'signals', 'api', 'configuration'];

const pageOf = (slug: string) => DOC_PAGES.find((p) => p.slug === slug);

function groupOf(slug: string): string {
  const p = pageOf(slug);
  if (!p) return 'Docs';
  if (p.slug === 'signals') return 'Signals';
  if (USE_CASE_GROUPS.has(p.group)) return 'Use cases';
  if (p.tab === 'reference') return 'API reference';
  return 'Docs';
}
const GROUP_ORDER = ['Docs', 'Signals', 'Use cases', 'API reference'];

const hrefOf = (e: Pick<Entry, 'slug' | 'id'>) => `${e.slug ? `/docs/${e.slug}` : '/docs'}${e.id ? `#${e.id}` : ''}`;
const norm = (s: string) => s.toLowerCase();

/** Letters of `w` appear in order in `s` (a loose, typo-tolerant match for headings and page titles). */
function subsequence(w: string, s: string): boolean {
  if (w.length < 3) return false;
  let i = 0;
  for (const ch of s) if (ch === w[i] && ++i === w.length) return true;
  return false;
}

function score(e: Entry, words: string[]): number {
  const heading = norm(e.heading);
  const page = norm(e.page);
  const text = norm(e.text);
  let total = 0;
  for (const w of words) {
    let s = 0;
    if (heading.startsWith(w)) s = 8;
    else if (heading.includes(` ${w}`)) s = 6;
    else if (heading.includes(w)) s = 5;
    else if (page.includes(w)) s = 3;
    else if (text.includes(w)) s = 1;
    else if (subsequence(w, heading) || subsequence(w, page)) s = 0.5;
    if (s === 0) return 0;
    total += s;
  }
  // The page's own top section ranks a little above its sub-sections.
  return total + (e.id === '' ? 0.5 : 0);
}

function Marked({ text, words }: { text: string; words: string[] }): ReactNode {
  if (words.length === 0) return text;
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'ig');
  return text.split(re).map((part, i) => (i % 2 === 1 ? <mark key={i}>{part}</mark> : part));
}

function loadRecent(): Entry[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as unknown;
    return Array.isArray(raw) ? (raw.filter((r) => r && typeof r.slug === 'string' && typeof r.heading === 'string') as Entry[]).slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveRecent(list: Entry[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.map(({ slug, page, heading, id }) => ({ slug, page, heading, id, text: '' }))));
  } catch {
    /* storage unavailable */
  }
}

const hitFor = (e: Entry, s = 0): Hit => {
  const p = pageOf(e.slug);
  const sameAsPage = e.heading === e.page || e.heading === p?.title;
  return { entry: e, group: groupOf(e.slug), icon: p?.icon ?? 'book', crumb: sameAsPage ? (p?.group ?? e.page) : e.page, score: s };
};

/** Docs search: a command palette. The index loads on first open; matching runs in the browser. Opens with / or Ctrl/Cmd+K. */
export function Search() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<Entry[] | null>(null);
  const [q, setQ] = useState('');
  const [recent, setRecent] = useState<Entry[]>([]);
  const router = useRouter();

  const show = useCallback(() => {
    setRecent(loadRecent());
    setOpen(true);
    if (!index) void fetch('/search-index.json').then((r) => r.json()).then(setIndex).catch(() => setIndex([]));
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement || t.isContentEditable);
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (open) setOpen(false);
        else show();
      } else if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey && !open) {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('trace:search', show);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('trace:search', show);
    };
  }, [show, open]);

  const words = useMemo(() => norm(q).split(/\s+/).filter(Boolean), [q]);

  const hits = useMemo(() => {
    if (!index || words.length === 0) return [];
    return index
      .map((e) => ({ e, s: score(e, words) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 24)
      .map((x) => hitFor(x.e, x.s));
  }, [index, words]);

  const grouped = useMemo(() => {
    const map = new Map<string, Hit[]>();
    for (const h of hits) map.set(h.group, [...(map.get(h.group) ?? []), h]);
    // Groups ordered by their best hit, then by the fixed order for ties.
    return [...map.entries()].sort((a, b) => b[1][0]!.score - a[1][0]!.score || GROUP_ORDER.indexOf(a[0]) - GROUP_ORDER.indexOf(b[0]));
  }, [hits]);

  const suggested = useMemo(
    () => SUGGESTED.map((s) => pageOf(s)).filter((p): p is NonNullable<typeof p> => !!p).map((p) => hitFor({ slug: p.slug, page: p.title, heading: p.title, id: '', text: '' })),
    [],
  );

  const go = (e: Entry) => {
    saveRecent([e, ...recent.filter((r) => !(r.slug === e.slug && r.id === e.id))].slice(0, 5));
    setOpen(false);
    router.push(hrefOf(e));
  };

  const loading = words.length > 0 && !index;
  const status = words.length === 0 ? '' : loading ? 'Loading results' : hits.length === 0 ? 'No results' : `${hits.length} result${hits.length === 1 ? '' : 's'}`;

  const renderItem = (h: Hit, key: string, recentItem = false) => (
    <CommandItem key={key} value={key} onSelect={() => go(h.entry)} className="sp-item">
      <span className="sp-ic" aria-hidden="true">{recentItem ? <History size={15} strokeWidth={1.75} /> : <PageIcon name={h.icon} size={15} />}</span>
      <span className="sp-title"><Marked text={h.entry.heading} words={words} /></span>
      <span className="sp-crumb">{h.crumb}</span>
    </CommandItem>
  );

  return (
    <>
      <button type="button" className="search-btn" onClick={show} aria-label="Search the docs" aria-haspopup="dialog" aria-expanded={open}>
        <SearchIcon size={14} aria-hidden="true" />
        <span>Search docs</span>
        <kbd>/</kbd>
      </button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setQ('');
        }}
      >
        <DialogPortal>
          <DialogOverlay className="sp-overlay" />
          <DialogPrimitive.Content className="sp">
            <DialogTitle className="sr-only">Search the docs</DialogTitle>
            <DialogDescription className="sr-only">
              Type to search pages and sections. Use the arrow keys to move, Enter to open, Escape to close.
            </DialogDescription>
            <Command shouldFilter={false} loop label="Search the docs" className="sp-cmd">
              <CommandInput value={q} onValueChange={setQ} placeholder="Search signals, SDKs, configuration..." aria-label="Search" />
              <CommandList className="sp-list">
                <CommandEmpty className="sp-empty">
                  {loading ? 'Loading...' : (
                    <>
                      <b>No matches for &ldquo;{q.trim()}&rdquo;</b>
                      <span>Try a signal name, an SDK, or a setting such as TRACE_&hellip;</span>
                    </>
                  )}
                </CommandEmpty>
                {words.length === 0 ? (
                  <>
                    {recent.length > 0 && (
                      <CommandGroup heading="Recent">{recent.map((e, i) => renderItem(hitFor(e), `recent-${i}-${e.slug}#${e.id}`, true))}</CommandGroup>
                    )}
                    <CommandGroup heading="Suggested">{suggested.map((h) => renderItem(h, `sug-${h.entry.slug}`))}</CommandGroup>
                  </>
                ) : (
                  grouped.map(([g, items]) => (
                    <CommandGroup key={g} heading={g}>
                      {items.map((h, i) => renderItem(h, `${h.entry.slug}#${h.entry.id}#${i}`))}
                    </CommandGroup>
                  ))
                )}
              </CommandList>
              <div className="sp-foot">
                <span><Kbd>&uarr;</Kbd><Kbd>&darr;</Kbd> to navigate</span>
                <span><Kbd><CornerDownLeft size={11} aria-hidden="true" /></Kbd> to open</span>
                <span><Kbd>esc</Kbd> to close</span>
                {words.length === 0 && recent.length > 0 && (
                  <button
                    type="button"
                    className="sp-clear"
                    onClick={() => {
                      saveRecent([]);
                      setRecent([]);
                    }}
                  >
                    Clear recent
                  </button>
                )}
              </div>
            </Command>
            <div className="sr-only" role="status" aria-live="polite">{status}</div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  );
}
