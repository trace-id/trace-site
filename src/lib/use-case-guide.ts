import { HANDWRITTEN_GUIDES, USE_CASES, type UseCase, guideSlug, useCase } from './use-cases';

/** Use cases whose docs guide is generated from the use-case data (no handwritten page). */
export const GENERATED_GUIDES = USE_CASES.filter((u) => !(u.slug in HANDWRITTEN_GUIDES));

const SIGNAL_IDS = new Set([
  'bot', 'tampering', 'tor', 'datacenterIp', 'ipBlocklist', 'velocity', 'incognito', 'devtools', 'virtualMachine', 'privacyBrowser',
  'highActivity', 'crossBrowser', 'antiDetect', 'vpn', 'tlsMismatch', 'multiAccount', 'accountSharing', 'automatedInput', 'aiAgent', 'proxy', 'rareDevice', 'tamperedRequest', 'replayedRequest', 'flaggedNetwork', 'emulator', 'rootedDevice',
]);

/** Event fields that are not signals but show up in use cases. */
const FIELD_DOCS: Record<string, string> = {
  deviceId: 'Shared by every browser on one device. Store it with the account or the action.',
  visitorId: 'Stable id of this browser, through private windows and cleared cookies.',
  confidence: 'How sure the match to a returning visitor is, from 0 to 1.',
  history: 'Past events of a visitor: `GET /v1/visitors/:visitorId`.',
};

const ACCOUNT_SIGNALS = ['multiAccount', 'accountSharing', 'velocity'];
const VERDICT = { allow: 'Allow', review: 'Verify', block: 'Block' } as const;

function signalRow(s: UseCase['signals'][number]): string {
  const name = SIGNAL_IDS.has(s.id) ? `[\`${s.id}\`](signals.md#signal-${s.id})` : `\`${s.id}\``;
  return `| ${name} | ${s.why} |`;
}

/** Markdown for a use case's docs guide, built from the same data as its /use-cases page. */
export function useCaseGuide(slug: string): string | null {
  const u = useCase(slug);
  if (!u || slug in HANDWRITTEN_GUIDES) return null;
  const usesAccounts = u.signals.some((s) => ACCOUNT_SIGNALS.includes(s.id));
  const getCall = usesAccounts
    ? `const { eventId } = await trace.get({ linkedId: user?.id, tags: { action: '${u.slug}' } });`
    : `const { eventId } = await trace.get({ tags: { action: '${u.slug}' } });`;
  const related = u.related
    .map(useCase)
    .filter((r): r is UseCase => r !== undefined)
    .map((r) => `- [${r.title}](${guideSlug(r.slug)}.md): ${r.short}`);

  return `# ${u.title}

${u.sub}

**What you will build:** a check on the action you protect that allows normal users, asks doubtful ones to verify, and blocks the clear cases. See the [${u.title.toLowerCase()} overview](/use-cases/${u.slug}) for the attack in pictures.

> [!NOTE]
> **Before you start**
> Finish one Web quickstart (for example [JavaScript](javascript.md) or [React](react.md)) and one Server quickstart (for example [Node.js](node.md)). The decision code below is TypeScript; every server SDK returns the same event.

## How the attack works

${u.attacks.map((a) => `- **${a.title}.** ${a.text}`).join('\n')}

## What to look at

| Field | Why it matters here |
| --- | --- |
${u.signals.map((s) => (FIELD_DOCS[s.id] ? `| \`${s.id}\` | ${s.why} ${FIELD_DOCS[s.id]} |` : signalRow(s))).join('\n')}

## 1. Identify on the action

Call the browser SDK when the user performs the action, not on page load, and send the \`eventId\` with the request.${usesAccounts ? ' Pass your own user id as `linkedId` whenever you have one: the account signals count by it.' : ''}

\`\`\`ts
${getCall}
\`\`\`

## 2. Verify on your server

::: code-group
\`\`\`ts [Node.js]
import { verifyEvent } from '@trace-id/sdk-node';

const event = await verifyEvent(eventId, { secretKey: process.env.TRACE_SECRET_KEY!, endpoint, timeoutMs: 1500 }).catch(() => null);
\`\`\`
\`\`\`python [Python]
try:
    event = client.get_event(event_id)
except trace_device.VerifyError:
    event = None  # fail open
\`\`\`
\`\`\`php [PHP]
try { $event = $client->getEvent($eventId); } catch (Trace\\VerifyError $e) { $event = null; }
\`\`\`
\`\`\`java [Java]
Map<String, Object> event = null;
try { event = trace.getEvent(eventId); } catch (Trace.VerifyException e) { /* fail open */ }
\`\`\`
\`\`\`ts [Embedded]
const event = await trace.verify(eventId).catch(() => null);
\`\`\`
:::

Events can be verified for 60 minutes. If verification fails, decide whether to [fail open or closed](integration.md#fail-open-or-fail-closed); for most of this flow, fail open.

## 3. Decide

\`\`\`ts
${u.code}
\`\`\`

\`trace.verify()\` is the [embedded](embedded.md) call; with a server SDK, use the \`event\` from step 2 instead. The thresholds are yours. Trace scores and explains; \`event.reasons\` lists which signals added how much, so log it with every decision.

## Example decisions

${u.scenario.caption}, illustrative:

| ${u.scenario.columns[0]} | ${u.scenario.columns[1]} | Decision | Why |
| --- | --- | --- | --- |
${u.scenario.rows.map((r) => `| ${r.a} | ${r.b} | **${VERDICT[r.verdict]}** | ${r.note} |`).join('\n')}

## Roll it out

1. Ship steps 1 to 3 with logging only: record the decision, block nothing.
2. After a week, look at who would have been blocked or asked to verify. Shared computers, offices and privacy tools are the usual false positives.
3. Turn on **Verify** first, then **Block** for the clearest cases.

## Related guides

::: cards
${related.join('\n')}
:::
`;
}
