'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { Badge, CopyButton, ENTER, JsonView, WindowCard } from '@/components/ui';
import type { BrandName } from '../brand';
import { ToastCopy } from './controls';

interface Tab { id: string; label: string; brand: BrandName; file: string; html: string; raw: string }

/** Language tabs in the header of a dark code window; the verified event as light JSON in a window beside it. */
export function CodeTabsView({ tabs, response }: { tabs: Tab[]; response: string }) {
  const [id, setId] = useState(tabs[0]!.id);
  const reduce = useReducedMotion();
  const tab = tabs.find((t) => t.id === id)!;
  return (
    <div className="ct">
      <WindowCard
        dark
        className="ct-req"
        title={tab.file}
        tabs={tabs.map((t) => ({ id: t.id, label: t.label }))}
        activeTab={id}
        onTabChange={setId}
        action={<ToastCopy><CopyButton on="night" size="sm" label="Copy" text={tab.raw} ariaLabel={`Copy ${tab.file}`} /></ToastCopy>}
      >
        <motion.div key={id} className="ct-code" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={ENTER} tabIndex={0} role="region" aria-label={`${tab.label} example`} dangerouslySetInnerHTML={{ __html: tab.html }} />
      </WindowCard>
      <WindowCard className="ct-res" title="GET /v1/events/:id" action={<Badge tone="low" size="sm" mono dot>200 · verified</Badge>}>
        <JsonView text={response} lineNumbers maxHeight={420} label="Verified event response" className="ct-json" />
      </WindowCard>
    </div>
  );
}
