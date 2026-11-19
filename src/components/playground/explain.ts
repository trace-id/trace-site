/* eslint-disable @typescript-eslint/no-explicit-any */
// Plain-language explanations of each signal's details, as shown on the live demo.

export type Details = Record<string, any>;
export interface SignalResult {
  detected: boolean;
  details: Details;
}
export interface TraceEvent {
  eventId: string;
  visitorId: string;
  deviceId: string;
  confidence: number;
  matchKind: 'token' | 'similar' | 'new';
  suspectScore: number;
  reasons: { signal: string; contribution: number }[];
  signals: Record<string, SignalResult>;
  components: Record<string, string>;
  attributes: Record<string, any>;
  ip: { address: string | null; country: string | null; asn: number | null };
  linkedId: string | null;
  linkedVisitors: { visitorId: string; confidence: number; browser: string; via: string; sharedNetworks: number; lastSeenAt: string }[];
  createdAt: string;
  expiresAt: string;
}
export interface DeviceGraph {
  deviceId: string;
  visitors: { visitorId: string; browser: string | null }[];
  accounts: { linkedId: string; visitorIds: string[]; lastSeenAt: string }[];
}

export const GROUPS: [string, string[]][] = [
  ['Automation & spoofing', ['bot', 'aiAgent', 'antiDetect', 'tampering', 'tamperedRequest', 'replayedRequest', 'emulator', 'rootedDevice', 'virtualMachine', 'rareDevice', 'tlsMismatch', 'devtools']],
  ['Network', ['vpn', 'proxy', 'tor', 'datacenterIp', 'ipBlocklist', 'flaggedNetwork']],
  ['Accounts & devices', ['multiAccount', 'accountSharing', 'crossBrowser']],
  ['Behaviour & privacy', ['automatedInput', 'velocity', 'highActivity', 'incognito', 'privacyBrowser']],
];

export const NAMES: Record<string, string> = {
  bot: 'Bot / automation', aiAgent: 'AI agent', proxy: 'Proxy', rareDevice: 'Rare device', tamperedRequest: 'Tampered request', replayedRequest: 'Replayed request', emulator: 'Emulator', rootedDevice: 'Rooted device', antiDetect: 'Anti-detect browser', tampering: 'Browser tampering', virtualMachine: 'Virtual machine',
  tlsMismatch: 'TLS client mismatch', devtools: 'Developer tools', vpn: 'VPN', tor: 'Tor exit node',
  datacenterIp: 'Datacenter IP', ipBlocklist: 'IP blocklist', flaggedNetwork: 'Flagged network', multiAccount: 'Many accounts on one device',
  accountSharing: 'Account on many devices', crossBrowser: 'Same device, other browser', velocity: 'Velocity',
  highActivity: 'High activity', incognito: 'Private window', privacyBrowser: 'Privacy browser', automatedInput: 'Automated input',
};

/** What each signal looks for, in one line. */
export const DESC: Record<string, string> = {
  bot: 'Webdriver flags, headless user agents and other marks of a scripted browser.',
  aiAgent: 'An AI assistant acting for a person, without a verified Web Bot Auth signature.',
  proxy: 'The IP is a listed residential or datacenter proxy exit.',
  rareDevice: 'Hardware almost no other visitor of this site has.',
  tamperedRequest: 'The request was edited after the browser collected it.',
  replayedRequest: 'The same request was sent twice: a captured request re-sent by a script.',
  emulator: 'A mobile app running on an emulator or simulator.',
  rootedDevice: 'A mobile app on a rooted or jailbroken phone.',
  antiDetect: 'A browser built to show a fresh, fake identity: page, workers and iframes disagree.',
  tampering: 'Native browser functions overridden to hide or fake traits.',
  virtualMachine: 'Software GPU renderers and hardware typical of a VM.',
  tlsMismatch: 'The TLS handshake does not match the browser the user agent claims.',
  devtools: 'Developer tools are open in a docked panel.',
  vpn: 'IP country does not fit the device time zone, or the IP is a listed VPN exit.',
  tor: 'The request came from a published Tor exit node.',
  datacenterIp: 'The IP belongs to a hosting or cloud network, not a home or mobile ISP.',
  ipBlocklist: 'The IP is on a blocklist you configured.',
  flaggedNetwork: 'Other visitors on this network were flagged recently.',
  multiAccount: 'More accounts have used this device than your threshold allows.',
  accountSharing: 'This account signed in from more devices than your threshold.',
  crossBrowser: 'Another browser on this device is already known.',
  automatedInput: 'Pointer and typing patterns too regular to be a person.',
  velocity: 'Many events from this visitor in a short window.',
  highActivity: 'Unusually many events from this visitor today.',
  incognito: 'The browser is in a private or incognito window.',
  privacyBrowser: 'A browser that blocks or randomises traits.',
};

const ANTI_DETECT: Record<string, string> = {
  workerMismatch: 'a Web Worker reports different values',
  iframeMismatch: 'an iframe reports different values',
  timezoneOffsetMismatch: 'the clock offset contradicts the time zone',
  appleGpuOnNonApple: 'Apple GPU on a non-Apple OS',
  direct3dOnNonWindows: 'Direct3D on a non-Windows OS',
  mobileGpuOnDesktop: 'mobile GPU on a desktop OS',
  desktopGpuOnMobile: 'desktop GPU on a phone OS',
  macFontsOnWindows: 'macOS-only fonts on Windows',
  windowsFontsOnMac: 'Windows-only fonts on macOS',
  clientHintsMismatch: 'HTTP client hints name another OS',
  engineMismatch: 'the JavaScript engine does not match the browser',
  languageHeaderMismatch: 'page languages differ from the Accept-Language header',
  uaVersionMismatch: 'client hints report another browser version',
};

const join = (a: unknown) => (Array.isArray(a) && a.length ? a.join(', ') : '');
export const pct = (n: number) => `${Math.round(n * 100)}%`;
export type SigState = 'on' | 'off' | 'na';

export function explain(id: string, s: SignalResult): { state: SigState; text: string } {
  const d = s.details || {};
  const on = s.detected;
  if (d.available === false) {
    const why: Record<string, string> = {
      vpn: d.timezoneCheck === 'noCountry' ? 'Needs a GeoIP database or VPN lists on the server' : d.timezoneCheck === 'locationless' ? 'Device is set to UTC, so it is not judged' : 'Not enough data to judge',
      tlsMismatch: 'Needs a TLS-terminating proxy that passes JA4',
      velocity: 'Needs Redis on the server',
      highActivity: 'Needs Redis on the server',
      crossBrowser: 'Cross-browser linking is off on this server',
      multiAccount: 'Sign in as an account to turn this on',
      accountSharing: 'Sign in as an account to turn this on',
    };
    return { state: 'na', text: why[id] || 'Not available' };
  }
  let text: string;
  switch (id) {
    case 'bot': {
      const strong = [d.webdriver && 'webdriver flag', d.headlessUserAgent && 'headless user agent', join(d.automationGlobals) && `automation globals: ${join(d.automationGlobals)}`, d.userAgentHeaderMismatch && 'user agent differs from the HTTP header'].filter(Boolean);
      text = on ? strong.join('; ') || `${d.weakIndicatorCount} weak indicators` : d.weakIndicatorCount ? `${d.weakIndicatorCount} weak indicator; 2 are needed` : 'No automation traces';
      break;
    }
    case 'aiAgent':
      text = on ? `${d.name ?? 'AI agent'} (${d.provider ?? 'unknown'}), unsigned` : d.identity === 'signed' ? `${d.name} with a verified signature` : 'No AI agent declared';
      break;
    case 'antiDetect': {
      const r = ((d.reasons as string[]) || []).map((x) => ANTI_DETECT[x] || x);
      const fields = join([...(d.workerMismatch || []), ...(d.iframeMismatch || [])]);
      text = on ? `${r.join('; ')}${fields ? ` (${fields})` : ''}` : d.workerChecked ? 'Page, worker and iframe agree; GPU and fonts fit the OS' : 'GPU and fonts fit the OS; worker check unavailable';
      break;
    }
    case 'tampering':
      text = (d.anomalyScore ? `anomaly ${Math.round(d.anomalyScore * 100)}% · ` : '') + (on ? [join(d.nativeOverrides) && `patched: ${join(d.nativeOverrides)}`, join(d.navigatorOwnProperties) && `shadowed: ${join(d.navigatorOwnProperties)}`, d.uaPlatformMismatch && 'user agent vs platform', d.uaFeatureMismatch && 'user agent vs features'].filter(Boolean).join('; ') : d.canvasNoise ? 'Native APIs intact; canvas output is randomised' : 'Native APIs intact');
      break;
    case 'virtualMachine': text = on ? `Renderer: ${d.renderer}` : 'Real GPU'; break;
    case 'tlsMismatch': text = on ? `${join(d.reasons)} · ${d.ja4}` : `Handshake fits a browser · ${d.ja4}`; break;
    case 'devtools': text = on ? `Detected by ${d.method}` : 'Not detected (docked tools only)'; break;
    case 'vpn': {
      const parts: string[] = [];
      if ((d.methods || []).includes('timezoneMismatch')) parts.push(`IP in ${d.ipCountry} (UTC ${join(d.countryOffsets)}), device at UTC ${d.deviceOffset}`);
      if ((d.methods || []).includes('publicVpn')) parts.push('IP is a listed VPN exit');
      if (!on) parts.push(d.timezoneCheck === 'match' ? `IP in ${d.ipCountry} fits UTC ${d.deviceOffset}` : 'Not on a VPN list');
      if (d.relay) parts.push('privacy relay (not counted)');
      text = parts.join('; ');
      break;
    }
    case 'tor': text = on ? 'IP is a listed Tor exit' : 'Not a listed Tor exit'; break;
    case 'datacenterIp': text = on ? `Hosting network${d.asnOrg ? `: ${d.asnOrg}` : ''}` : d.asnOrg ? `${d.asnOrg} (AS${d.asn})` : 'Not a listed hosting range'; break;
    case 'ipBlocklist': text = on ? 'IP is on your blocklist' : 'Not on your blocklist'; break;
    case 'multiAccount': text = `${d.accountsOnDevice} account${d.accountsOnDevice === 1 ? '' : 's'} on this device · limit ${d.threshold}`; break;
    case 'accountSharing': text = `This account on ${d.devicesForAccount} device${d.devicesForAccount === 1 ? '' : 's'} · limit ${d.threshold}`; break;
    case 'crossBrowser': text = d.linkedVisitors ? `${d.linkedVisitors} other browser${d.linkedVisitors > 1 ? 's' : ''} (${join(d.browsers)}) · best ${pct(d.topConfidence)}` : 'No other browser of this device yet'; break;
    case 'velocity': text = on ? `Over the limit: ${join(d.exceeded)}` : `${d.eventsPerVisitor1h ?? 0} events this hour`; break;
    case 'highActivity': text = `${d.eventsPerVisitor24h} events in 24 h · limit ${d.threshold}`; break;
    case 'incognito': text = on ? `Detected by ${d.method}` : 'Regular window'; break;
    case 'privacyBrowser': text = on ? join(d.reasons) : 'Not detected'; break;
    case 'automatedInput': text = on ? join(d.reasons) : `${d.pointerMoves} pointer moves, ${d.clicks} clicks, ${d.keys} keys, all from a person`; break;
    default: text = on ? 'Detected' : 'Not detected';
  }
  return { state: on ? 'on' : 'off', text };
}

export interface Task {
  id: string;
  t: string;
  h: string;
  ok: (e: TraceEvent, c: { forgotten: string | null }) => boolean;
}

export const TASKS: Task[] = [
  { id: 'return', t: 'Come back', h: 'Reload the page. The visitor ID stays the same.', ok: (e) => e.matchKind !== 'new' },
  { id: 'forget', t: 'Clear storage, stay recognised', h: 'Press "Forget this browser". The ID survives on device signals alone.', ok: (e, c) => Boolean(c.forgotten) && e.matchKind === 'similar' && e.visitorId === c.forgotten },
  { id: 'incognito', t: 'Open a private window', h: 'Same browser, private mode: same ID, and the private window is detected.', ok: (e) => Boolean(e.signals?.incognito?.detected) && e.matchKind !== 'new' },
  { id: 'browser', t: 'Open another browser', h: 'Chrome, Edge or Firefox on this computer. They share one device ID.', ok: (e) => (e.linkedVisitors || []).length > 0 || e.deviceId !== e.visitorId },
  { id: 'accounts', t: 'Sign in as three accounts', h: 'Type three different names above, identifying each time.', ok: (e) => Boolean(e.signals?.multiAccount?.detected) },
  { id: 'spoof', t: 'Fake your device', h: 'DevTools device emulation, or a user-agent switcher extension.', ok: (e) => Boolean(e.signals?.antiDetect?.detected || e.signals?.tampering?.detected) },
  { id: 'vpn', t: 'Turn on a VPN', h: 'Exit in another country. Needs a GeoIP database on the server.', ok: (e) => Boolean(e.signals?.vpn?.detected || e.signals?.datacenterIp?.detected) },
  { id: 'bot', t: 'Visit with automation', h: 'Open this page from Playwright, Puppeteer or Selenium.', ok: (e) => Boolean(e.signals?.bot?.detected) },
];

/** Escaped, syntax-coloured JSON for the raw responses panel. */
export function highlightJson(value: unknown): string {
  const esc = JSON.stringify(value, null, 2).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc.replace(/("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/g, (m, str, colon, lit) => {
    if (str) return colon ? `<span class="k">${str}</span>${colon}` : `<span class="s">${str}</span>`;
    if (lit) return `<span class="l">${m}</span>`;
    return `<span class="n">${m}</span>`;
  });
}

export const tone = (score: number) => (score >= 60 ? 'bad' : score >= 25 ? 'warn' : 'ok');
export type Level = 'low' | 'med' | 'high';
export const level = (score: number): Level => (score >= 60 ? 'high' : score >= 25 ? 'med' : 'low');
export const LEVEL_WORD: Record<Level, string> = { low: 'Low risk', med: 'Medium', high: 'High risk' };
export const short = (id: string | null | undefined) => (id && id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id || '–');
export function ago(t: number): string {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}
