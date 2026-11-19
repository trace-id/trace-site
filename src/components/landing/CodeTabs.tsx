import { codeToHtml } from 'shiki';
import { Braces } from 'lucide-react';
import { type BrandName } from '../brand';
import { CodeTabsView } from './CodeTabsView';
import { FeatureSection } from './FeatureSection';

const EVENT_ID = '0193a3f2-7c1e-7b4a-9d2f-5e8c1a6b3f40';

const SNIPPETS: { id: string; label: string; file: string; lang: string; brand: BrandName; code: string }[] = [
  {
    id: 'js', brand: 'javascript', label: 'Browser', file: 'signup.js', lang: 'js',
    code: `import { createClient } from '@trace-id/sdk-js';

const trace = createClient({
  apiKey: 'pk_...',
  endpoint: 'https://id.yourapp.com',
});

// On signup: identify, then send the event ID with the form.
const { eventId } = await trace.get({ linkedId: user.id });
await fetch('/api/signup', {
  method: 'POST',
  body: JSON.stringify({ ...form, eventId }),
});`,
  },
  {
    id: 'react', brand: 'react', label: 'React', file: 'SignupForm.tsx', lang: 'tsx',
    code: `import { IdentifyProvider, useVisitorData } from '@trace-id/sdk-react';

// <IdentifyProvider apiKey="pk_..." endpoint="https://id.yourapp.com">

function SignupForm() {
  const { getData } = useVisitorData({ immediate: false });

  async function onSubmit(form: FormValues) {
    const result = await getData({ linkedId: form.userId });
    await submit({ ...form, eventId: result?.eventId });
  }
}`,
  },
  {
    id: 'node', brand: 'node', label: 'Node.js', file: 'api/signup.ts', lang: 'ts',
    code: `import { verifyEvent } from '@trace-id/sdk-node';

const event = await verifyEvent(body.eventId, {
  secretKey: process.env.TRACE_SECRET_KEY!,
  endpoint: process.env.TRACE_ENDPOINT!,
});

if (event.suspectScore >= 60) return block(event);
if (event.suspectScore >= 25) return challenge(event);
return createAccount(body);`,
  },
  {
    id: 'python', brand: 'python', label: 'Python', file: 'signup.py', lang: 'python',
    code: `import os
from trace_device import verify_event

event = verify_event(
    body["eventId"],
    os.environ["TRACE_SECRET_KEY"],
    os.environ["TRACE_ENDPOINT"],
)

if event["suspectScore"] >= 60:
    return block(event)
if event["signals"]["multiAccount"]["detected"]:
    flag_for_review(event)`,
  },
  {
    id: 'php', brand: 'php', label: 'PHP', file: 'signup.php', lang: 'php',
    code: `<?php
$trace = new Trace\\Client(getenv('TRACE_SECRET_KEY'), getenv('TRACE_ENDPOINT'));
$event = $trace->getEvent($_POST['eventId']);

if ($event['suspectScore'] >= 60) {
    return block($event);
}`,
  },
  {
    id: 'java', brand: 'java', label: 'Java', file: 'SignupController.java', lang: 'java',
    code: `import dev.trace.Trace;

Trace trace = new Trace(
    System.getenv("TRACE_SECRET_KEY"),
    System.getenv("TRACE_ENDPOINT"));
Map<String, Object> event = trace.getEvent(form.eventId());

if (((Number) event.get("suspectScore")).intValue() >= 60) {
    return block(event);
}`,
  },
  {
    id: 'curl', brand: 'curl', label: 'cURL', file: 'terminal', lang: 'bash',
    code: `curl https://id.yourapp.com/v1/events/${EVENT_ID} \\
  -H "Authorization: Bearer $TRACE_SECRET_KEY"`,
  },
];

const RESPONSE = `{
  "eventId": "${EVENT_ID}",
  "visitorId": "Q7mZ2xKp9LwR4tVb8NcE",
  "deviceId": "Q7mZ2xKp9LwR4tVb8NcE",
  "matchKind": "new",
  "confidence": 1,
  "suspectScore": 90,
  "reasons": [
    { "signal": "bot", "contribution": 60 },
    { "signal": "datacenterIp", "contribution": 15 },
    { "signal": "virtualMachine", "contribution": 15 }
  ],
  "signals": {
    "bot": { "detected": true },
    "vpn": { "detected": false },
    "incognito": { "detected": false }
  },
  "ip": { "country": "US", "asn": 64501 },
  "linkedId": "user_48213"
}`;

async function hl(code: string, lang: string) {
  return codeToHtml(code, { lang, theme: 'github-dark' });
}

/** Request in a dark code window, the verified event as light JSON beside it. Highlighted at build time. */
export async function CodeTabs() {
  const tabs = await Promise.all(SNIPPETS.map(async (s) => ({ id: s.id, label: s.label, brand: s.brand, file: s.file, html: await hl(s.code, s.lang), raw: s.code })));
  return (
    <FeatureSection
      id="int-title"
      wide
      eyebrow="Integrate by hand"
      icon={<Braces />}
      title={<>Identify in the browser. <span className="accent">Decide</span> on your server.</>}
      text="The browser only hands over an event ID; your backend reads the verified result with a secret key."
      link={{ href: '/docs/integration', label: 'Integration guide' }}
    >
      <CodeTabsView tabs={tabs} response={RESPONSE} />
    </FeatureSection>
  );
}
