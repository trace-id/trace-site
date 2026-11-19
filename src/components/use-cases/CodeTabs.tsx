'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';
import { ToastCopy } from '@/components/landing/controls';
import { CopyButton, EASE_IN, EASE_OUT, JsonView, TabPanel, Tabs } from '@/components/ui';

export interface CodeTab {
  id: string;
  label: string;
  file: string;
  /** Pre-highlighted HTML from shiki (server side). */
  html: string;
  /** Raw source for the copy button. */
  text: string;
  /** What the call returns (illustrative), shown in a light JSON viewer beside the code. */
  response?: unknown;
  responseLabel?: string;
}

/** Implementation tabs: a sliding underline over a dark code panel (file name, copy button) and, where there is one, the response in a light JSON viewer. */
export function CodeTabs({ tabs }: { tabs: CodeTab[] }) {
  const base = useId().replace(/:/g, '');
  const [id, setId] = useState(tabs[0]!.id);
  return (
    <div className="uc-impl-tabs">
      <Tabs items={tabs.map((t) => ({ id: t.id, label: t.label }))} value={id} onChange={setId} label="Implementation step" idBase={base} />
      {tabs.map((t) => (
        <TabPanel key={t.id} idBase={base} id={t.id} value={id} className="uc-impl-panel">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={t.id}
              className="uc-impl-grid"
              data-single={t.response === undefined}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT } }}
              exit={{ opacity: 0, transition: { duration: 0.15, ease: EASE_IN } }}
            >
              <div className="uc-code">
                <div className="uc-code-head">
                  <span className="uc-code-file">{t.file}</span>
                  <ToastCopy><CopyButton on="night" size="sm" text={t.text} ariaLabel={`Copy ${t.file}`} /></ToastCopy>
                </div>
                <div className="uc-code-body" dangerouslySetInnerHTML={{ __html: t.html }} />
              </div>
              {t.response !== undefined && (
                <div className="uc-resp">
                  <span className="mono-label">{t.responseLabel ?? 'Response'}</span>
                  <JsonView value={t.response} label={`${t.label} response`} maxHeight={300} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </TabPanel>
      ))}
    </div>
  );
}
