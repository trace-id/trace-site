import { Marked, type Tokens } from 'marked';
import { DESC, NAMES } from '@/components/playground/explain';
import { readDoc, rewriteHref } from './docs';

/**
 * The signal catalog page, rendered from the table in docs/signals.md (synced from the OSS repo, the single source of
 * the wording) plus site-only metadata: category, where the signal works, and what it needs to be set up.
 */

export type Where = 'browser' | 'app' | 'both';

export interface SignalMeta {
  category: string;
  where: Where;
  /** What an operator must configure before the signal can fire; omitted when it works out of the box. */
  needs?: string;
}

export const CATEGORIES = [
  { id: 'bots', title: 'Bots and automation', blurb: 'Scripted browsers, AI agents and input no person produced.' },
  { id: 'spoofing', title: 'Spoofing and tampering', blurb: 'Devices and requests that lie about themselves.' },
  { id: 'mobile', title: 'Mobile apps', blurb: 'Signals from the React Native SDK.' },
  { id: 'network', title: 'Network and IP', blurb: 'Where the request comes from.' },
  { id: 'accounts', title: 'Accounts and devices', blurb: 'How accounts, browsers and devices relate.' },
  { id: 'activity', title: 'Activity', blurb: 'How fast and how much.' },
  { id: 'privacy', title: 'Privacy tools', blurb: 'Legitimate privacy choices, reported for context.' },
] as const;

export const SIGNAL_META: Record<string, SignalMeta> = {
  bot: { category: 'bots', where: 'browser' },
  aiAgent: { category: 'bots', where: 'browser', needs: 'Optional: CRAWLER_RANGES_FILE to verify agents by IP range' },
  automatedInput: { category: 'bots', where: 'browser' },
  devtools: { category: 'bots', where: 'browser' },
  tlsMismatch: { category: 'bots', where: 'browser', needs: 'TLS_FINGERPRINT_HEADER from a TLS-terminating proxy' },
  antiDetect: { category: 'spoofing', where: 'browser' },
  tampering: { category: 'spoofing', where: 'browser' },
  tamperedRequest: { category: 'spoofing', where: 'both' },
  replayedRequest: { category: 'spoofing', where: 'both', needs: 'SDKs that send a nonce (all current ones)' },
  virtualMachine: { category: 'spoofing', where: 'browser' },
  rareDevice: { category: 'spoofing', where: 'browser', needs: '1,000 visitors in the project' },
  emulator: { category: 'mobile', where: 'app' },
  rootedDevice: { category: 'mobile', where: 'app' },
  vpn: { category: 'network', where: 'both', needs: 'GEOIP_COUNTRY_DB, a VPN list, or an IP data provider' },
  proxy: { category: 'network', where: 'both', needs: 'PROXY_CIDR_FILE or an IP data provider' },
  tor: { category: 'network', where: 'both', needs: 'TOR_EXIT_LIST_FILE (npm run ip-data) or an IP data provider' },
  datacenterIp: { category: 'network', where: 'both', needs: 'DATACENTER_CIDR_FILE (npm run ip-data) or an IP data provider' },
  ipBlocklist: { category: 'network', where: 'both', needs: 'IP_BLOCKLIST_FILE' },
  flaggedNetwork: { category: 'network', where: 'both', needs: 'Cross-browser linking on (the default)' },
  multiAccount: { category: 'accounts', where: 'both', needs: 'linkedId on identify calls' },
  accountSharing: { category: 'accounts', where: 'both', needs: 'linkedId on identify calls' },
  crossBrowser: { category: 'accounts', where: 'browser' },
  velocity: { category: 'activity', where: 'both' },
  highActivity: { category: 'activity', where: 'both' },
  incognito: { category: 'privacy', where: 'browser' },
  privacyBrowser: { category: 'privacy', where: 'browser' },
};

export interface CatalogSignal {
  id: string;
  name: string;
  summary: string;
  weight: number;
  /** HTML of the "how it is detected" and "false positives" cells. */
  how: string;
  falsePositives: string;
  /** Plain text of both, for search. */
  text: string;
  category: string;
  where: Where;
  needs: string | null;
}

const inline = new Marked({
  gfm: true,
  renderer: {
    link({ href, tokens }: Tokens.Link) {
      const target = rewriteHref(href);
      const external = /^https?:\/\//.test(target);
      return `<a href="${target}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${this.parser.parseInline(tokens)}</a>`;
    },
  },
});

const plain = (s: string) => s.replace(/`/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*/g, '');

/** The catalog table as signals, and the page's Markdown without it (the prose sections that follow stay). */
export async function loadSignalCatalog(): Promise<{ signals: CatalogSignal[]; rest: string }> {
  const md = await readDoc('signals');
  const table = new Marked({ gfm: true }).lexer(md).find((t): t is Tokens.Table => t.type === 'table');
  if (!table) return { signals: [], rest: md };
  const signals: CatalogSignal[] = table.rows.map((row) => {
    const id = row[0]!.text.replace(/`/g, '').trim();
    const meta = SIGNAL_META[id] ?? { category: 'bots', where: 'both' as Where };
    const how = row[2]?.text ?? '';
    const fp = row[3]?.text ?? '';
    return {
      id,
      name: NAMES[id] ?? id,
      summary: DESC[id] ?? '',
      weight: Number(row[1]?.text ?? 0),
      how: inline.parseInline(how) as string,
      falsePositives: inline.parseInline(fp) as string,
      text: `${id} ${NAMES[id] ?? ''} ${DESC[id] ?? ''} ${plain(how)} ${plain(fp)}`.toLowerCase(),
      category: meta.category,
      where: meta.where,
      needs: meta.needs ?? null,
    };
  });
  // Drop the title-adjacent intro and the table: the page header and the catalog replace them.
  const start = md.indexOf(table.raw);
  const firstSection = md.indexOf('\n## ', start);
  const rest = `# Signal catalog\n\n${firstSection >= 0 ? md.slice(firstSection + 1) : ''}`;
  return { signals, rest };
}
