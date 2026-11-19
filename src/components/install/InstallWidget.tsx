'use client';

import { Check, Copy, Plug, Sparkles, SquareTerminal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { SegmentedControl } from '@/components/ui';
import { Brand } from '../brand';
import { copyText, installPrompt, MCP_COMMAND, NPM_COMMAND } from './prompt';
import './install.css';

type Mode = 'prompt' | 'npm' | 'mcp';
const MODES = [
  { id: 'prompt' as Mode, label: 'AI prompt', Icon: Sparkles },
  { id: 'npm' as Mode, label: 'npm', Icon: SquareTerminal },
  { id: 'mcp' as Mode, label: 'MCP', Icon: Plug },
];

/** Hero install control: three modes in one bar, copy in one click, or open the prompt straight in an AI tool. */
export function InstallWidget() {
  const [mode, setMode] = useState<Mode>('prompt');
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('https://trace.dev');
  useEffect(() => setOrigin(window.location.origin), []);

  const prompt = installPrompt(origin);
  const payload = mode === 'prompt' ? prompt : mode === 'npm' ? NPM_COMMAND : MCP_COMMAND;
  const shown = mode === 'prompt' ? 'Install Trace with AI' : mode === 'npm' ? NPM_COMMAND : 'claude mcp add trace';

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const pick = (m: Mode) => { setMode(m); setCopied(false); };
  const copy = async () => {
    if (await copyText(payload)) {
      setCopied(true);
      toast.success(mode === 'prompt' ? 'Install prompt copied' : 'Copied', { id: 'copied', duration: 1600, description: mode === 'prompt' ? 'Paste it into your coding agent.' : undefined });
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <div className="iw">
      <div className="iw-bar">
        <div className="iw-tabs">
          <SegmentedControl
            label="Install method"
            value={mode}
            onChange={pick}
            options={MODES.map(({ id, label, Icon }) => ({ value: id, label: <span className="iw-lbl">{label}</span>, icon: <Icon size={14} strokeWidth={1.9} aria-hidden="true" /> }))}
          />
        </div>
        <button type="button" className={`iw-copy${copied ? ' done' : ''}`} onClick={copy} aria-label={mode === 'prompt' ? 'Copy the install prompt for your AI coding agent' : `Copy: ${payload}`}>
          <code key={mode}>{shown}</code>
          <span className="iw-icon" aria-hidden="true">{copied ? <Check size={15} strokeWidth={2.2} /> : <Copy size={15} strokeWidth={1.75} />}</span>
        </button>
        <span className="sr-only" aria-live="polite">{copied ? 'Copied to the clipboard' : ''}</span>
      </div>
      <p className="iw-sub">
        {mode === 'prompt' ? (
          <>
            <span>Or open in</span>
            <a className="iw-app" href={`cursor://anysphere.cursor-deeplink/prompt?text=${encodeURIComponent(prompt)}`}><Brand name="cursor" size={13} />Cursor</a>
            <a className="iw-app" href={`https://claude.ai/new?q=${encodeURIComponent(prompt)}`} target="_blank" rel="noopener noreferrer"><Brand name="claude" size={13} />Claude</a>
            <span className="iw-dot" aria-hidden="true">·</span>
            <a href="/install.md">install.md</a>
          </>
        ) : mode === 'npm' ? (
          <>Then follow the <a href="/docs/quickstart">quickstart</a>. Server SDKs for Node, Python, PHP and Java.</>
        ) : (
          <>Lets Claude explain flagged events. <a href="/docs/agents">Setup for other clients</a>.</>
        )}
      </p>
    </div>
  );
}
