'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn/select';
import { FilterToggle } from '@/components/landing/controls';
import { Button, Chip, EASE_IN, EASE_OUT, SPRING } from '@/components/ui';
import { Band, CaseCard, type CardCase } from './parts';

export interface ExplorerCase extends CardCase {
  category: string;
}

export interface ExplorerIndustry {
  slug: string;
  title: string;
  cases: string[];
}

/** The "Solutions" band: toolbar (category, industry, search) over a dashed-divided grid of cards. Cards re-flow with a layout animation as filters change. */
export function Explorer({ cases, categories, industries }: { cases: ExplorerCase[]; categories: readonly string[]; industries: ExplorerIndustry[] }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [ind, setInd] = useState<string | null>(null);

  const indCases = useMemo(() => (ind ? new Set(industries.find((i) => i.slug === ind)?.cases ?? []) : null), [ind, industries]);
  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return cases.filter((c) => {
      if (cat !== 'all' && c.category !== cat) return false;
      if (indCases && !indCases.has(c.slug)) return false;
      const hay = `${c.title} ${c.short} ${c.category} ${c.signals.join(' ')}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [cases, q, cat, indCases]);

  const filtered = q !== '' || cat !== 'all' || ind !== null;
  const reset = () => {
    setQ('');
    setCat('all');
    setInd(null);
  };

  return (
    <>
      <Band id="solutions-h" title="Solutions" note="Pick the problem you have. Each one runs on the same verified event.">
        <label className="uc-search">
          <Search size={15} aria-hidden="true" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search, or try a signal: vpn" aria-label="Search use cases" />
          {q && <button type="button" onClick={() => setQ('')} aria-label="Clear search"><X size={13} /></button>}
        </label>
      </Band>

      <div className="uc-bar">
        <div className="uc-seg-wrap">
          <FilterToggle
            label="Category"
            value={cat}
            onChange={setCat}
            options={[{ value: 'all', label: <>All <i className="uc-count">{cases.length}</i></> }, ...categories.map((c) => ({ value: c, label: <>{c} <i className="uc-count">{cases.filter((x) => x.category === c).length}</i></> }))]}
          />
        </div>
        <div className="uc-bar-ind uc-ind-chips" role="group" aria-label="Industry">
          <span className="mono-label">Industry</span>
          {industries.map((i) => (
            <Chip key={i.slug} selected={ind === i.slug} onClick={() => setInd(ind === i.slug ? null : i.slug)}>{i.title}</Chip>
          ))}
        </div>
        <div className="uc-ind-select">
          <span className="mono-label" id="uc-ind-label">Industry</span>
          <Select value={ind ?? 'all'} onValueChange={(v) => setInd(v === 'all' ? null : v)}>
            <SelectTrigger className="uc-select" aria-labelledby="uc-ind-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="uc-select-pop" position="popper" sideOffset={4}>
              <SelectItem value="all" className="uc-select-item">All industries</SelectItem>
              {industries.map((i) => <SelectItem key={i.slug} value={i.slug} className="uc-select-item">{i.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="uc-bar-status" role="status" aria-live="polite">
          <span className="mono-label">{shown.length} of {cases.length} use cases</span>
          {filtered && <Button variant="ghost" size="sm" onClick={reset} icon={<X size={13} aria-hidden="true" />}>Clear filters</Button>}
        </div>
      </div>

      {shown.length === 0 ? (
        <motion.p className="uc-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, ease: EASE_OUT }}>
          Nothing matches{q ? <> “{q}”</> : ' these filters'}. Try a signal name such as <code>bot</code> or <code>multiAccount</code>.
        </motion.p>
      ) : (
        <motion.ul className="dashed-grid uc-cells" layout transition={SPRING}>
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map((c) => (
              <motion.li
                key={c.slug}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.2, ease: EASE_OUT } }}
                exit={{ opacity: 0, transition: { duration: 0.15, ease: EASE_IN } }}
                transition={{ layout: SPRING }}
              >
                <CaseCard c={c} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </>
  );
}
