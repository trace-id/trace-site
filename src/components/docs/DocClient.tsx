'use client';

import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { Check, ChevronDown, Copy, FileText, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Brand } from '../brand';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../shadcn/dropdown-menu';
import { copyText } from '../install/prompt';
import { DUR, EASE_OUT, SPRING } from '../ui/motion';

interface Heading {
  depth: number;
  text: string;
  id: string;
}

/** Right-hand "On this page": the section in view is marked by a cobalt tick that slides between entries. */
export function Toc({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState(headings[0]?.id ?? '');
  useEffect(() => {
    if (headings.length === 0) return;
    const els = headings.map((h) => document.getElementById(h.id)).filter((e): e is HTMLElement => e !== null);
    // Recomputed synchronously on every scroll (cheap: a handful of rect reads) so programmatic jumps never leave it stale.
    const update = () => {
      const bar = document.querySelector('.docs-tabs')?.getBoundingClientRect().bottom ?? 110;
      const line = Math.max(bar, 0) + 28;
      let cur = els[0]?.id ?? '';
      if (window.scrollY > 2) {
        for (const el of els) if (el.getBoundingClientRect().top <= line) cur = el.id;
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = els.at(-1)?.id ?? cur;
      }
      setActive(cur);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('scrollend', update);
    window.addEventListener('resize', update);
    window.addEventListener('hashchange', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('scrollend', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('hashchange', update);
    };
  }, [headings]);

  if (headings.length === 0) return null;
  return (
    <nav className="toc-list" aria-label="On this page">
      <h4>On this page</h4>
      {headings.map((h) => {
        const on = h.id === active;
        return (
          <a key={h.id} href={`#${h.id}`} className={h.depth === 3 ? 'sub' : undefined} aria-current={on ? 'location' : undefined}>
            {on && <motion.span layoutId="toc-marker" className="toc-marker" transition={SPRING} />}
            {h.text}
          </a>
        );
      })}
    </nav>
  );
}

const TAB_KEY = 'trace-docs-tab';

/** Slide the indicator under the selected tab of a code group. */
function placeIndicator(tabs: HTMLElement) {
  const sel = tabs.querySelector<HTMLElement>('[aria-selected="true"]');
  if (!sel) return;
  tabs.style.setProperty('--ind-x', `${sel.offsetLeft}px`);
  tabs.style.setProperty('--ind-w', `${sel.offsetWidth}px`);
  tabs.dataset.ind = 'true';
}

/** Show the panel labelled `label` in every code group that has one, so npm / pnpm / yarn stays in step. */
function selectTab(label: string) {
  document.querySelectorAll<HTMLElement>('.code-group').forEach((g) => {
    if (!g.querySelector(`[data-panel="${CSS.escape(label)}"]`)) return;
    g.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) => {
      const on = b.dataset.tab === label;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    g.querySelectorAll<HTMLElement>('[data-panel]').forEach((p) => (p.hidden = p.dataset.panel !== label));
    const tabs = g.querySelector<HTMLElement>('.code-tabs');
    if (tabs) placeIndicator(tabs);
  });
}

/** Copy buttons, code-group tabs and step reveals (all rendered server-side); one delegated listener for the page. */
export function CodeCopy() {
  const [announce, setAnnounce] = useState('');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TAB_KEY);
      if (saved) selectTab(saved);
    } catch {
      /* storage unavailable */
    }
    document.querySelectorAll<HTMLElement>('.code-tabs').forEach((tabs) => {
      tabs.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) => (b.tabIndex = b.getAttribute('aria-selected') === 'true' ? 0 : -1));
      placeIndicator(tabs);
    });
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver((entries) => entries.forEach((e) => placeIndicator(e.target as HTMLElement)));
    document.querySelectorAll<HTMLElement>('.code-tabs').forEach((t) => ro?.observe(t));

    // Steps: the trace line between numbered steps draws when each step scrolls into view.
    const steps = Array.from(document.querySelectorAll<HTMLElement>('.prose .step'));
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            (e.target as HTMLElement).dataset.draw = 'in';
            io?.unobserve(e.target);
          }),
        { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
      );
      steps.forEach((s) => {
        if (s.dataset.draw !== 'in') {
          s.dataset.draw = 'wait';
          io?.observe(s);
        }
      });
    }

    // Tables: edge shadows show which side still has columns to scroll to.
    const wraps = Array.from(document.querySelectorAll<HTMLElement>('.table-wrap'));
    const edge = (w: HTMLElement) => {
      const f = w.parentElement;
      if (!f) return;
      f.dataset.l = String(w.scrollLeft > 1);
      f.dataset.r = String(w.scrollLeft + w.clientWidth < w.scrollWidth - 1);
    };
    const edgeAll = () => wraps.forEach(edge);
    wraps.forEach((w) => w.addEventListener('scroll', () => edge(w), { passive: true }));
    const tro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(edgeAll);
    wraps.forEach((w) => tro?.observe(w));
    edgeAll();

    let timer: ReturnType<typeof setTimeout> | undefined;
    const onClick = (e: MouseEvent) => {
      const tab = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-tab]');
      if (tab?.dataset.tab) {
        selectTab(tab.dataset.tab);
        try {
          localStorage.setItem(TAB_KEY, tab.dataset.tab);
        } catch {
          /* storage unavailable */
        }
        return;
      }
      const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>('.prose a.anchor');
      if (anchor) {
        const url = `${window.location.origin}${window.location.pathname}${anchor.getAttribute('href') ?? ''}`;
        void copyText(url).then(() => toast('Link copied'));
        return;
      }
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-copy]');
      if (!btn) return;
      const block = btn.closest('.code');
      const code = (block?.querySelector('.code-panel:not([hidden]) pre') ?? block?.querySelector('pre'))?.textContent ?? '';
      void copyText(code).then(() => {
        btn.dataset.done = 'true';
        const label = btn.querySelector('i');
        if (label) label.textContent = 'Copied';
        setAnnounce('Code copied to clipboard');
        clearTimeout(timer);
        timer = setTimeout(() => {
          delete btn.dataset.done;
          if (label) label.textContent = 'Copy';
          setAnnounce('');
        }, 1600);
      });
    };
    // Arrow keys move between the tabs of a code group.
    const onKey = (e: globalThis.KeyboardEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-tab]');
      if (!t || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      const all = Array.from(t.parentElement?.querySelectorAll<HTMLButtonElement>('[data-tab]') ?? []);
      const i = all.indexOf(t);
      const to = e.key === 'Home' ? 0 : e.key === 'End' ? all.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length;
      e.preventDefault();
      all[to]?.focus();
      all[to]?.click();
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
      ro?.disconnect();
      io?.disconnect();
      tro?.disconnect();
      clearTimeout(timer);
    };
  }, []);
  return (
    <span className="sr-only" role="status" aria-live="polite">
      {announce}
    </span>
  );
}

/** "Copy page" for pasting a page into an AI tool, plus the raw Markdown and one-click open in Claude or ChatGPT. */
export function PageActions({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mdPath = `/docs/${slug}.md`;

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      const md = await fetch(mdPath).then((r) => r.text());
      await copyText(md);
    } catch {
      toast.error('Could not copy the page');
      return;
    }
    toast('Copied page as Markdown');
    setDone(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(false), 1800);
  };
  const ask = () => `Read ${window.location.origin}${mdPath} so I can ask questions about it.`;
  const openIn = (base: string) => window.open(`${base}${encodeURIComponent(ask())}`, '_blank', 'noopener,noreferrer');

  return (
    <div className="page-actions">
      <button type="button" className="pa-main" onClick={() => void copy()}>
        <span className="pa-ic-slot" aria-hidden="true">
          <AnimatePresence mode="popLayout" initial={false}>
            {done ? (
              <motion.span key="ok" className="pa-slot" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: DUR.component, ease: EASE_OUT }}>
                <Check size={14} strokeWidth={2.2} />
              </motion.span>
            ) : (
              <motion.span key="cp" className="pa-slot" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: DUR.component, ease: EASE_OUT }}>
                <Copy size={14} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <span>{done ? 'Copied' : 'Copy page'}</span>
        <span className="sr-only" role="status" aria-live="polite">{done ? 'Page copied as Markdown' : ''}</span>
      </button>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button type="button" className="pa-more" aria-label="More page actions">
            <ChevronDown size={14} aria-hidden="true" className="pa-chev" data-open={open} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="pa-menu" align="end" sideOffset={8} collisionPadding={12}>
          <DropdownMenuItem className="pa-item" onSelect={() => void copy()}>
            <span className="pa-ic"><Copy size={15} aria-hidden="true" /></span>
            <span><b>Copy as Markdown</b><small>For pasting into a language model</small></span>
          </DropdownMenuItem>
          <DropdownMenuItem className="pa-item" asChild>
            <a href={mdPath} target="_blank" rel="noopener">
              <span className="pa-ic"><FileText size={15} aria-hidden="true" /></span>
              <span><b>View as Markdown</b><small>Plain text of this page</small></span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="pa-sep" />
          <DropdownMenuItem className="pa-item" onSelect={() => openIn('https://claude.ai/new?q=')}>
            <span className="pa-ic"><Brand name="claude" size={15} /></span>
            <span><b>Open in Claude</b><small>Ask questions about this page</small></span>
          </DropdownMenuItem>
          <DropdownMenuItem className="pa-item" onSelect={() => openIn('https://chatgpt.com/?q=')}>
            <span className="pa-ic"><Brand name="openai" size={15} /></span>
            <span><b>Open in ChatGPT</b><small>Ask questions about this page</small></span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** A search field look-alike that opens the site search dialog. */
export function SearchTrigger({ label = 'Search the docs', className = 'docs-search' }: { label?: string; className?: string }) {
  return (
    <button type="button" className={className} aria-label={label} onClick={() => window.dispatchEvent(new Event('trace:search'))}>
      <Search size={14} aria-hidden="true" />
      <span>{label}</span>
      <kbd aria-hidden="true">Ctrl K</kbd>
    </button>
  );
}
