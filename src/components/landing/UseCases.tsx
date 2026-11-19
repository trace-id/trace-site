'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Layers } from 'lucide-react';
import { useState } from 'react';
import { UcIcon } from '@/components/use-cases/UcIcon';
import { type Verdict, USE_CASES, useCase as findCase } from '@/lib/use-cases';
import { Accordion, AccordionItem, Badge, Button, EASE_OUT, IconTile, WindowCard } from '@/components/ui';
import { NAMES } from '@/components/playground/explain';
import { FeatureSection } from './FeatureSection';

/** Five of the real use cases, each with the scenario table and signals from its guide. */
const SHOWN = ['account-takeover', 'card-testing', 'new-account-fraud', 'bot-detection', 'promo-abuse'];

const VERDICT: Record<Verdict, { word: string; tone: 'low' | 'med' | 'high' }> = {
  allow: { word: 'Allow', tone: 'low' },
  review: { word: 'Review', tone: 'med' },
  block: { word: 'Block', tone: 'high' },
};

/** All mockups sit in one grid cell, so the cell is as tall as the tallest and switching only cross-fades. */
function Mock({ slug, active }: { slug: string; active: boolean }) {
  const u = findCase(slug)!;
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="uc-mock-layer"
      initial={false}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: reduce ? 0 : 0.2, ease: EASE_OUT }}
      style={{ pointerEvents: active ? 'auto' : 'none', visibility: active ? 'visible' : 'hidden', transitionProperty: 'visibility', transitionDuration: active ? '0s' : '0.2s' }}
      aria-hidden={!active}
      inert={!active}
    >
    <WindowCard className="uc-mock" title={`event · ${u.slug}`} action={<Badge size="sm" mono>Example</Badge>}>
      <div className="uc-mock-body">
        <p className="uc-cap mono-label">{u.scenario.caption}</p>
        <table className="uc-table">
          <thead>
            <tr><th scope="col">{u.scenario.columns[0]}</th><th scope="col">{u.scenario.columns[1]}</th><th scope="col">Decision</th></tr>
          </thead>
          <tbody>
            {u.scenario.rows.map((r) => {
              const V = VERDICT[r.verdict];
              return (
                <tr key={r.a}>
                  <td><code>{r.a}</code><small>{r.note}</small></td>
                  <td>{r.b}</td>
                  <td><Badge tone={V.tone} dot size="sm">{V.word}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="uc-sigs">
          <span className="mono-label">Signals used</span>
          <div>{u.signals.map((s) => <Badge key={s.id} mono size="sm" tone="accent">{NAMES[s.id] ?? s.id}</Badge>)}</div>
        </div>
      </div>
    </WindowCard>
    </motion.div>
  );
}

export function UseCases() {
  const [open, setOpen] = useState(SHOWN[0]!);
  return (
    <FeatureSection
      id="uc-title"
      white
      wide
      eyebrow="Use cases"
      icon={<Layers />}
      title={<>One event. <span className="accent">{USE_CASES.length}</span> ways to use it.</>}
      text="The same verified result answers sign-up, login, checkout and moderation questions. Pick one to see the signals it leans on."
      link={{ href: '/use-cases', label: `See all ${USE_CASES.length} use cases` }}
    >
      <div className="uc-split">
        <Accordion type="single" collapsible={false} headingLevel={3} value={open} onValueChange={(v) => typeof v === 'string' && setOpen(v)} className="uc-acc">
          {SHOWN.map((slug) => {
            const u = findCase(slug)!;
            return (
              <AccordionItem key={slug} value={slug} title={u.title} icon={<IconTile size="sm" icon={<UcIcon name={u.icon} />} />}>
                <p>{u.short}</p>
                <Button href={`/use-cases/${slug}`} variant="tertiary" size="sm">Read the guide</Button>
              </AccordionItem>
            );
          })}
        </Accordion>
        <div className="uc-mock-cell">{SHOWN.map((slug) => <Mock key={slug} slug={slug} active={slug === open} />)}</div>
      </div>
    </FeatureSection>
  );
}
