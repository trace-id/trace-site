'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Brand, type BrandName } from '../brand';
import { FeatureSection } from '../landing/FeatureSection';
import { CopyButton, TabPanel, Tabs, WindowCard } from '@/components/ui';
import { ToastCopy } from '../landing/controls';
import { installPrompt } from './prompt';
import './install.css';

gsap.registerPlugin(ScrollTrigger);

const TOOLS: { id: string; name: string; brand: BrandName; where: React.ReactNode }[] = [
  { id: 'claude', name: 'Claude Code', brand: 'claude', where: <>Run <code>claude</code> in your app&apos;s repository and paste.</> },
  { id: 'cursor', name: 'Cursor', brand: 'cursor', where: <>Open the Agent panel and paste.</> },
  { id: 'codex', name: 'Codex', brand: 'openai', where: <>Run <code>codex</code> in your app&apos;s repository and paste.</> },
  { id: 'copilot', name: 'Copilot', brand: 'copilot', where: <>Open Copilot Chat in agent mode and paste.</> },
];

type Line = { k: 'read' | 'ok' | 'run' | 'edit' | 'code' | 'pass' | 'done'; t: string; d?: string };
const RUN: Line[] = [
  { k: 'read', t: 'Read install.md' },
  { k: 'ok', t: 'Found Next.js (app router) with API routes' },
  { k: 'run', t: 'npm install @trace-id/sdk-react @trace-id/sdk-node' },
  { k: 'edit', t: 'app/providers.tsx', d: '+9' },
  { k: 'edit', t: 'app/signup/form.tsx', d: '+12 −2' },
  { k: 'edit', t: 'app/api/signup/route.ts', d: '+21' },
  { k: 'code', t: 'const e = await verifyEvent(eventId, { secretKey, endpoint });' },
  { k: 'code', t: 'if (e.suspectScore >= 60) return deny(e.eventId);' },
  { k: 'edit', t: '.env.example', d: '+3' },
  { k: 'pass', t: 'npm test', d: '14 passed' },
  { k: 'done', t: 'Signup now sends an eventId; the API verifies it before creating the account.' },
];

const Glyph = ({ k }: { k: Line['k'] }) => {
  const map: Record<Line['k'], string> = { read: '◇', ok: '✓', run: '›', edit: '✎', code: ' ', pass: '✓', done: '●' };
  return <span className={`g ${k}`} aria-hidden="true">{map[k]}</span>;
};

/** Install with AI: the prompt card (light) beside an illustrative agent run (dark terminal window). */
export function InstallSection() {
  const [tool, setTool] = useState('claude');
  const [origin, setOrigin] = useState('https://trace.dev');
  const root = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  useEffect(() => setOrigin(window.location.origin), []);
  const prompt = installPrompt(origin);
  const current = TOOLS.find((t) => t.id === tool)!;
  // The typed line is written by the animation, not React, so React never fights it for the text node.
  const promptRef = useRef(prompt);
  const typedRef = useRef<HTMLElement>(null);
  const typing = useRef(false);
  promptRef.current = prompt;
  useEffect(() => {
    if (typedRef.current && !typing.current) typedRef.current.textContent = prompt;
  }, [prompt]);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const q = gsap.utils.selector(el);
      const lines = q('.run li');
      const typed = typedRef.current!;
      const prog = { n: 0 };
      const t = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } });
      t.set(lines, { opacity: 0, y: 6 })
        .call(() => { typing.current = true; typed.textContent = ''; prog.n = 0; })
        .to(prog, { n: 1, duration: 1.6, ease: 'none', onUpdate: () => { const full = promptRef.current; typed.textContent = full.slice(0, Math.round(full.length * prog.n)); } })
        .call(() => { typing.current = false; typed.textContent = promptRef.current; })
        .to(lines, { opacity: 1, y: 0, duration: 0.35, stagger: 0.32 }, '+=0.3');
      tl.current = t;
      ScrollTrigger.create({ trigger: q('.run')[0], start: 'top 75%', once: true, onEnter: () => t.play(0) });
    });
    return () => mm.revert();
  }, []);

  const card = (
    <div className="prompt-card">
      <Tabs
        idBase="inst"
        label="Coding agent"
        value={tool}
        onChange={setTool}
        items={TOOLS.map((t) => ({ id: t.id, label: t.name, icon: <Brand name={t.brand} size={14} /> }))}
      />
      <div className="pc-head">
        {TOOLS.map((t) => (
          <TabPanel key={t.id} idBase="inst" id={t.id} value={tool}><span>{t.where}</span></TabPanel>
        ))}
        <ToastCopy message="Install prompt copied"><CopyButton text={prompt} label="Copy prompt" ariaLabel="Copy the install prompt" className="pc-copy" /></ToastCopy>
      </div>
      <p className="pc-body"><code>{prompt}</code></p>
      <div className="pc-foot">
        <a href="/install.md">install.md</a>
        <a href="/llms-full.txt">llms-full.txt</a>
        <a href="/docs/agents">MCP server</a>
      </div>
    </div>
  );

  return (
    <FeatureSection
      id="install-title"
      white
      eyebrow="Install with AI"
      icon={<Sparkles />}
      title={<>One prompt. Your agent does the <span className="accent">integration</span>.</>}
      text="The prompt points your coding agent at a guide written for agents: which SDK fits your stack, where to identify, how to verify on the server and what to do when Trace is down. You review the diff."
      aside={card}
    >
      <div ref={root}>
        <WindowCard
          dark
          as="figure"
          className="run"
          title={<span className="rb-tool"><Brand name={current.brand} size={13} />{current.name} · your-app</span>}
          action={<em className="rb-note">illustrative run</em>}
          aria-label="Illustrative run of a coding agent following the Trace install guide"
        >
          <p className="ask"><span className="g you" aria-hidden="true">›</span><b ref={typedRef} /></p>
          <ol>
            {RUN.map((l, i) => (
              <li key={i} className={l.k}>
                <Glyph k={l.k} />
                <span className="t">{l.t}</span>
                {l.d && <span className="d">{l.d}</span>}
              </li>
            ))}
          </ol>
          <button type="button" className="replay" onClick={() => tl.current?.play(0)} aria-label="Replay the run">Replay</button>
        </WindowCard>
      </div>
    </FeatureSection>
  );
}
