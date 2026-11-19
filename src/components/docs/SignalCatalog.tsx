'use client';

import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Link2, Search, Settings2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CatalogSignal, Where } from '@/lib/signal-catalog';
import { toast } from 'sonner';
import { copyText } from '../install/prompt';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../shadcn/collapsible';
import { ToggleGroup, ToggleGroupItem } from '../shadcn/toggle-group';
import { Badge, Tooltip } from '../ui';
import { DUR, EASE_IN, EASE_OUT, SPRING } from '../ui/motion';
import './signal-catalog.css';

interface Category {
  id: string;
  title: string;
  blurb: string;
}

const WHERE_LABEL: Record<Where, string> = { browser: 'Browser', app: 'Mobile app', both: 'Browser and app' };
const tone = (w: number) => (w >= 40 ? 'high' : w >= 20 ? 'med' : 'low');
const WHERE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'browser', label: 'Browser' },
  { value: 'app', label: 'Mobile app' },
] as const;

export function SignalCatalog({ signals, categories }: { signals: CatalogSignal[]; categories: readonly Category[] }) {
  const [query, setQuery] = useState('');
  const [where, setWhere] = useState<'all' | 'browser' | 'app'>('all');
  const [category, setCategory] = useState<string>('all');
  const [open, setOpen] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  // A link to #signal-<id> opens that card.
  useEffect(() => {
    const openFromHash = () => {
      const m = /^#signal-(.+)$/.exec(window.location.hash);
      if (!m) return;
      const id = decodeURIComponent(m[1]!);
      setOpen((s) => new Set(s).add(id));
      setQuery('');
      setCategory('all');
      setWhere('all');
      requestAnimationFrame(() => document.getElementById(`signal-${id}`)?.scrollIntoView({ block: 'start' }));
    };
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return signals.filter(
      (s) =>
        (category === 'all' || s.category === category) &&
        (where === 'all' || s.where === where || s.where === 'both') &&
        (!q || q.split(/\s+/).every((w) => s.text.includes(w))),
    );
  }, [signals, query, where, category]);

  const filtering = query !== '' || where !== 'all' || category !== 'all';
  const allOpen = visible.length > 0 && visible.every((s) => open.has(s.id));
  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const reset = () => {
    setQuery('');
    setWhere('all');
    setCategory('all');
  };

  return (
    <section className="sc" aria-label="Signals">
      <div className="sc-how">
        <div>
          <b>Weight</b>
          <span>Points a signal adds when it fires. Set yours in <code>scoring.default.json</code>.</span>
        </div>
        <div>
          <b>Suspect score</b>
          <span>The sum of fired weights, capped at 100, on every event.</span>
        </div>
        <div>
          <b>Reasons</b>
          <span>Every event lists the signals that fired and what each added.</span>
        </div>
      </div>

      <div className="sc-bar">
        <label className="sc-search">
          <Search size={16} aria-hidden="true" />
          <input
            ref={searchRef}
            type="search"
            placeholder={`Search ${signals.length} signals: "proxy", "emulator", "time zone"...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search signals"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); searchRef.current?.focus(); }} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </label>
        <ToggleGroup type="single" value={where} onValueChange={(v) => v && setWhere(v as typeof where)} aria-label="Where the signal works" className="sc-tg sc-seg" spacing={0}>
          {WHERE_OPTIONS.map((o) => (
            <ToggleGroupItem key={o.value} value={o.value} className="sc-tg-item">
              {o.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <ToggleGroup type="single" value={category} onValueChange={(v) => v && setCategory(v)} aria-label="Category" className="sc-tg sc-chips" spacing={2}>
        <ToggleGroupItem value="all" className="sc-tg-item sc-chip">
          All <i>{signals.length}</i>
        </ToggleGroupItem>
        {categories.map((c) => (
          <ToggleGroupItem key={c.id} value={c.id} className="sc-tg-item sc-chip">
            {c.title} <i>{signals.filter((s) => s.category === c.id).length}</i>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="sc-meta">
        <span aria-live="polite">{filtering ? `${visible.length} of ${signals.length} signals` : `${signals.length} signals`}</span>
        <button type="button" onClick={() => setOpen(allOpen ? new Set() : new Set(visible.map((s) => s.id)))}>
          {allOpen ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      <AnimatePresence>
        {visible.length === 0 && (
          <motion.p key="empty" className="sc-empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { duration: DUR.component, ease: EASE_OUT } }} exit={{ opacity: 0, transition: { duration: DUR.micro } }}>
            No signal matches. <button type="button" onClick={reset}>Clear filters</button>
          </motion.p>
        )}
      </AnimatePresence>

      {categories.map((c) => {
        const items = visible.filter((s) => s.category === c.id);
        if (items.length === 0) return null;
        return (
          <motion.div key={c.id} layout="position" className="sc-group" transition={SPRING}>
            <h2 id={`cat-${c.id}`}>
              <a className="anchor" href={`#cat-${c.id}`} aria-hidden="true">#</a>
              {c.title}
            </h2>
            <p className="sc-blurb">{c.blurb}</p>
            <ul className="sc-list">
              <AnimatePresence initial={false} mode="popLayout">
                {items.map((s) => {
                  const isOpen = open.has(s.id);
                  return (
                    <motion.li
                      key={s.id}
                      id={`signal-${s.id}`}
                      className={`sc-item${isOpen ? ' open' : ''}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, transition: { duration: DUR.component, ease: EASE_OUT } }}
                      exit={{ opacity: 0, transition: { duration: DUR.micro, ease: EASE_IN } }}
                    >
                      <Collapsible open={isOpen} onOpenChange={() => toggle(s.id)}>
                        <CollapsibleTrigger className="sc-head">
                          <span className="sc-title">
                            <span className="sc-name">{s.name}</span>
                            <code>{s.id}</code>
                          </span>
                          <span className="sc-sum">{s.summary}</span>
                          <span className="sc-tags">
                            <Badge size="sm" tone={s.where === 'app' ? 'cobalt' : 'neutral'}>{WHERE_LABEL[s.where]}</Badge>
                            {s.needs && (
                              <Tooltip content="Needs setup before this signal can fire" side="bottom">
                                <span className="sc-needs">
                                  <Settings2 size={12} aria-hidden="true" />
                                  {s.needs}
                                </span>
                              </Tooltip>
                            )}
                          </span>
                          <span className={`sc-weight ${tone(s.weight)}`} aria-label={`Weight ${s.weight}`}>
                            <Badge mono tone={tone(s.weight)}>+{s.weight}</Badge>
                            <span className="sc-meter" aria-hidden="true">
                              <span style={{ transform: `scaleX(${Math.min(1, s.weight / 60)})` }} />
                            </span>
                          </span>
                          <ChevronDown className="sc-chev" size={18} aria-hidden="true" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="sc-collapse">
                          <div className="sc-body">
                            <div className="sc-block">
                              <h4>How it is detected</h4>
                              <div dangerouslySetInnerHTML={{ __html: s.how }} />
                            </div>
                            <div className="sc-block fp">
                              <h4>False positives</h4>
                              <div dangerouslySetInnerHTML={{ __html: s.falsePositives }} />
                            </div>
                            <a
                              className="sc-link"
                              href={`#signal-${s.id}`}
                              onClick={() => void copyText(`${window.location.origin}${window.location.pathname}#signal-${s.id}`).then(() => toast('Link copied'))}
                            >
                              <Link2 size={13} aria-hidden="true" />
                              Link to this signal
                            </a>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </motion.div>
        );
      })}
    </section>
  );
}
