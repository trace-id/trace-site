import type { SceneKind } from '@/components/use-cases/Scenes';
/* Use-case pages: one data entry per page. Samples use real event fields only; scenario tables are illustrative. */

export type Verdict = 'allow' | 'review' | 'block';

export interface UseCase {
  slug: string;
  /** Animated hero scene, fed by this case's scenario rows. */
  scene: SceneKind;
  title: string;
  /** One line for cards. */
  short: string;
  icon: string;
  tone: 'cobalt' | 'red' | 'violet' | 'amber' | 'green' | 'ink';
  category: 'Abuse and fraud' | 'Security and payments' | 'Revenue protection';
  headline: string;
  sub: string;
  attacks: { title: string; text: string }[];
  scenario: { caption: string; columns: [string, string]; rows: { a: string; b: string; verdict: Verdict; note: string }[] };
  signals: { id: string; why: string; sample: string }[];
  code: string;
  related: string[];
}

export const USE_CASES: UseCase[] = [
  {
    slug: 'new-account-fraud',
    scene: 'graph',
    title: 'New account fraud',
    short: 'Stop one person opening many accounts.',
    icon: 'user-plus',
    tone: 'violet',
    category: 'Abuse and fraud',
    headline: 'One device. One account.',
    sub: 'Recognise the device behind every sign-up, even after a new email, cleared cookies, a private window or another browser.',
    attacks: [
      { title: 'Fresh emails', text: 'Disposable addresses make each sign-up look new.' },
      { title: 'Private windows', text: 'Incognito and cleared cookies wipe the usual traces.' },
      { title: 'Second browser', text: 'Chrome, then Firefox, then Edge on the same laptop.' },
    ],
    scenario: {
      caption: 'Four sign-ups from one laptop',
      columns: ['Email', 'Browser'],
      rows: [
        { a: 'sam@mail.com', b: 'Chrome', verdict: 'allow', note: 'First account on this device' },
        { a: 'sam.k@mail.com', b: 'Chrome, private', verdict: 'allow', note: 'Second account, under the limit' },
        { a: 'sk1990@temp.io', b: 'Firefox', verdict: 'review', note: 'Third account: multiAccount' },
        { a: 'free4me@temp.io', b: 'Edge', verdict: 'block', note: 'Fourth account, same deviceId' },
      ],
    },
    signals: [
      { id: 'multiAccount', why: 'Counts accounts per device, across browsers.', sample: '"multiAccount": {\n  "detected": true,\n  "details": { "accountsOnDevice": 3, "threshold": 2 }\n}' },
      { id: 'crossBrowser', why: 'Links other browsers on the same machine.', sample: '"linkedVisitors": [\n  { "browser": "chrome", "confidence": 0.93, "sameNetwork": true }\n]' },
      { id: 'incognito', why: 'Private windows still get the same visitorId.', sample: '"incognito": { "detected": true }' },
    ],
    code: `const event = await trace.verify(eventId);

if (event.suspectScore >= 60) return block();
if (event.signals.multiAccount.detected) return requirePhone();

await createUser(email, { deviceId: event.deviceId });`,
    related: ['promo-abuse', 'ban-evasion', 'bot-detection'],
  },
  {
    slug: 'account-takeover',
    scene: 'map',
    title: 'Account takeover',
    short: 'Spot logins from devices the account has never used.',
    icon: 'key-round',
    tone: 'red',
    category: 'Security and payments',
    headline: 'Know the device before the password.',
    sub: 'Compare each login with the devices an account normally uses. Step up only when something is off, and leave known devices alone.',
    attacks: [
      { title: 'Credential stuffing', text: 'Leaked passwords tried at scale from scripts.' },
      { title: 'Stolen sessions', text: 'A valid login from a device the user never had.' },
      { title: 'Proxy rotation', text: 'Every attempt from a new IP to dodge rate limits.' },
    ],
    scenario: {
      caption: 'Logins to one account',
      columns: ['Device', 'Network'],
      rows: [
        { a: 'MacBook, Safari', b: 'Home, Cairo', verdict: 'allow', note: 'Known device for this account' },
        { a: 'iPhone, Safari', b: 'Mobile, Cairo', verdict: 'allow', note: 'Known device' },
        { a: 'Windows, Chrome', b: 'Datacenter, NL', verdict: 'review', note: 'New device, hosting IP: ask for a code' },
        { a: 'Headless Chrome', b: 'Proxy, US', verdict: 'block', note: 'bot and velocity' },
      ],
    },
    signals: [
      { id: 'velocity', why: 'Many accounts or IPs per visitor in a short window.', sample: '"velocity": {\n  "detected": true,\n  "details": { "exceeded": ["linkedIdsPerVisitor24h"] }\n}' },
      { id: 'vpn', why: 'Timezone that does not fit the IP country.', sample: '"vpn": {\n  "detected": true,\n  "details": { "methods": ["timezoneMismatch"] }\n}' },
      { id: 'bot', why: 'Automation frameworks driving the login form.', sample: '"bot": { "detected": true }' },
    ],
    code: `const event = await trace.verify(eventId);
const known = await db.devices.exists({ userId, deviceId: event.deviceId });

if (event.signals.bot.detected) return block();
if (!known || event.suspectScore >= 25) return askForOtp();
return signIn();`,
    related: ['trusted-devices', 'bot-detection', 'vpn-detection'],
  },
  {
    slug: 'bot-detection',
    scene: 'pointer',
    title: 'Bot detection',
    short: 'Block headless browsers and scripted input.',
    icon: 'bot',
    tone: 'ink',
    category: 'Abuse and fraud',
    headline: 'Catch the automation, not just the IP.',
    sub: 'Trace looks at the browser itself: automation frameworks, input no person produces, and browsers that contradict themselves.',
    attacks: [
      { title: 'Headless browsers', text: 'Puppeteer, Playwright and Selenium at scale.' },
      { title: 'Anti-detect profiles', text: 'Browsers that fake a new device each time.' },
      { title: 'Residential proxies', text: 'Clean IPs that make blocklists useless.' },
    ],
    scenario: {
      caption: 'Requests to a sign-up form',
      columns: ['Browser', 'Input'],
      rows: [
        { a: 'Chrome 131', b: 'Typed, mouse path', verdict: 'allow', note: 'Normal visitor' },
        { a: 'Firefox 133', b: 'Pasted, touch', verdict: 'allow', note: 'Normal visitor' },
        { a: 'Chrome, odd worker UA', b: 'Typed', verdict: 'review', note: 'antiDetect: browser contradicts itself' },
        { a: 'HeadlessChrome', b: 'Synthetic clicks', verdict: 'block', note: 'bot + automatedInput' },
      ],
    },
    signals: [
      { id: 'bot', why: 'webdriver, headless user agents, automation globals.', sample: '"bot": { "detected": true }' },
      { id: 'automatedInput', why: 'Clicks and keys created by scripts.', sample: '"automatedInput": { "detected": true }' },
      { id: 'antiDetect', why: 'A worker or iframe reports a different device.', sample: '"antiDetect": {\n  "detected": true,\n  "details": { "reasons": ["workerMismatch"] }\n}' },
    ],
    code: `const { signals, suspectScore } = await trace.verify(eventId);

if (signals.bot.detected || signals.tlsMismatch.detected) return block();
if (signals.automatedInput.detected || suspectScore >= 40) return captcha();`,
    related: ['sms-pumping', 'card-testing', 'account-takeover'],
  },
  {
    slug: 'promo-abuse',
    scene: 'graph',
    title: 'Promo and bonus abuse',
    short: 'One welcome offer per person, not per email.',
    icon: 'gift',
    tone: 'amber',
    category: 'Revenue protection',
    headline: 'One welcome bonus per device.',
    sub: 'Coupons, referral credit and sign-up bonuses go to new customers, not to the same person with ten accounts.',
    attacks: [
      { title: 'Coupon farming', text: 'New accounts just to reuse a first-order code.' },
      { title: 'Referral loops', text: 'Inviting yourself from a second browser.' },
      { title: 'Bonus hunting', text: 'Claim, withdraw, repeat with a fresh email.' },
    ],
    scenario: {
      caption: 'Redemptions of WELCOME20',
      columns: ['Account', 'Device'],
      rows: [
        { a: 'acct_1042', b: 'Device A', verdict: 'allow', note: 'First redemption on device A' },
        { a: 'acct_1043', b: 'Device B', verdict: 'allow', note: 'Different device' },
        { a: 'acct_1051', b: 'Device A', verdict: 'block', note: 'Code already used on this device' },
        { a: 'acct_1066', b: 'Device A, Firefox', verdict: 'block', note: 'Linked browser on device A' },
      ],
    },
    signals: [
      { id: 'deviceId', why: 'One id for every browser on the machine.', sample: '"deviceId": "Xk3pQ9vLmT2aR7sBn4Wc"' },
      { id: 'multiAccount', why: 'Too many accounts on one device.', sample: '"multiAccount": {\n  "detected": true,\n  "details": { "accountsOnDevice": 4, "threshold": 2 }\n}' },
      { id: 'privacyBrowser', why: 'Explains lower confidence, never a block on its own.', sample: '"privacyBrowser": { "detected": true }' },
    ],
    code: `const event = await trace.verify(eventId);
const used = await db.redemptions.exists({ code, deviceId: event.deviceId });

if (used) return reject('Offer already used on this device');
await db.redemptions.insert({ code, deviceId: event.deviceId, userId });`,
    related: ['new-account-fraud', 'free-trial-abuse', 'fake-engagement'],
  },
  {
    slug: 'account-sharing',
    scene: 'seats',
    title: 'Account sharing',
    short: 'See when one login runs on too many devices.',
    icon: 'users',
    tone: 'green',
    category: 'Revenue protection',
    headline: 'One subscription, how many devices?',
    sub: 'Count the distinct devices behind each account and turn heavy sharing into a prompt to upgrade or sign in again.',
    attacks: [
      { title: 'Password sharing', text: 'One paid plan used by a whole group.' },
      { title: 'Resold accounts', text: 'Logins sold on to strangers.' },
      { title: 'Seat dodging', text: 'A team on a single-seat plan.' },
    ],
    scenario: {
      caption: 'Devices on one subscription, 30 days',
      columns: ['Device', 'City'],
      rows: [
        { a: 'MacBook', b: 'Cairo', verdict: 'allow', note: 'Device 1' },
        { a: 'iPhone', b: 'Cairo', verdict: 'allow', note: 'Device 2' },
        { a: 'Windows laptop', b: 'Alexandria', verdict: 'allow', note: 'Device 5, at the limit' },
        { a: 'Android tablet', b: 'Riyadh', verdict: 'review', note: 'Device 6: accountSharing' },
      ],
    },
    signals: [
      { id: 'accountSharing', why: 'Distinct devices per account in the window.', sample: '"accountSharing": {\n  "detected": true,\n  "details": { "devicesForAccount": 6, "threshold": 5 }\n}' },
      { id: 'deviceId', why: 'Browsers on one machine count once.', sample: '"deviceId": "Qp8wL2mXv7RtN4sKe9Ya"' },
    ],
    code: `const event = await trace.verify(eventId);

if (event.signals.accountSharing.detected) {
  return showUpgrade({ devices: event.signals.accountSharing.details.devicesForAccount });
}`,
    related: ['paywall', 'account-takeover', 'trusted-devices'],
  },
  {
    slug: 'ban-evasion',
    scene: 'stack',
    title: 'Ban evasion',
    short: 'Keep banned users out after they switch browser.',
    icon: 'ban',
    tone: 'red',
    category: 'Abuse and fraud',
    headline: 'Ban the device, not the email.',
    sub: 'Banned users come back with a new address and a fresh browser. A device ban follows them across browsers, private windows and cleared cookies.',
    attacks: [
      { title: 'New email', text: 'The first thing a banned user tries.' },
      { title: 'Cleared cookies', text: 'Wipes cookie-based bans.' },
      { title: 'Another browser', text: 'Gets a new visitorId, but the same deviceId.' },
    ],
    scenario: {
      caption: 'After banning @spammer',
      columns: ['Account', 'Browser'],
      rows: [
        { a: '@spammer', b: 'Chrome', verdict: 'block', note: 'Banned, device stored' },
        { a: '@new_user_88', b: 'Chrome, private', verdict: 'block', note: 'Same visitorId' },
        { a: '@hello_world', b: 'Firefox', verdict: 'block', note: 'Linked to banned deviceId' },
        { a: '@friend', b: 'Other laptop', verdict: 'allow', note: 'Different device' },
      ],
    },
    signals: [
      { id: 'deviceId', why: 'Stable across every browser on the machine.', sample: '"deviceId": "Xk3pQ9vLmT2aR7sBn4Wc"' },
      { id: 'crossBrowser', why: 'Other browsers that look like this device.', sample: '"linkedVisitors": [\n  { "browser": "firefox", "confidence": 0.91, "sameNetwork": true }\n]' },
    ],
    code: `const e = await trace.verify(eventId);
const ids = [e.deviceId, e.visitorId, ...e.linkedVisitors.map((v) => v.visitorId)];

if (await db.bans.any(ids)) return block();`,
    related: ['new-account-fraud', 'fake-engagement', 'account-takeover'],
  },
  {
    slug: 'card-testing',
    scene: 'burst',
    title: 'Card testing',
    short: 'Stop stolen cards being checked on your checkout.',
    icon: 'credit-card',
    tone: 'red',
    category: 'Security and payments',
    headline: 'Your checkout is not a card checker.',
    sub: 'Fraudsters run stolen cards through small payments to see which work. Trace sees the same device and script behind the burst.',
    attacks: [
      { title: 'Micro-charges', text: 'Dozens of small payments in minutes.' },
      { title: 'Scripted checkout', text: 'Automated forms, not people.' },
      { title: 'Rotating cards', text: 'A new card each try, same device.' },
    ],
    scenario: {
      caption: 'Payments in ten minutes',
      columns: ['Card', 'Amount'],
      rows: [
        { a: '•••• 4242', b: '$1.00', verdict: 'allow', note: 'First attempt' },
        { a: '•••• 0019', b: '$1.00', verdict: 'review', note: 'Same visitor, new card' },
        { a: '•••• 7731', b: '$1.00', verdict: 'block', note: 'velocity' },
        { a: '•••• 5120', b: '$1.00', verdict: 'block', note: 'velocity + automatedInput' },
      ],
    },
    signals: [
      { id: 'velocity', why: 'Events per visitor in 5 minutes and per hour.', sample: '"velocity": {\n  "detected": true,\n  "details": { "exceeded": ["eventsPerVisitor5m"] }\n}' },
      { id: 'automatedInput', why: 'Card fields filled by a script.', sample: '"automatedInput": { "detected": true }' },
      { id: 'datacenterIp', why: 'Checkouts from hosting ranges.', sample: '"datacenterIp": { "detected": true }' },
    ],
    code: `const { signals, suspectScore } = await trace.verify(eventId);

if (signals.velocity.detected || suspectScore >= 60) return declineQuietly();
return chargeCard();`,
    related: ['bot-detection', 'account-takeover', 'vpn-detection'],
  },
  {
    slug: 'vpn-detection',
    scene: 'clock',
    title: 'VPN and proxy detection',
    short: 'Know when the location is not where the user is.',
    icon: 'globe',
    tone: 'cobalt',
    category: 'Security and payments',
    headline: 'Where is this visitor, really?',
    sub: 'Compare the device clock with the IP country, and check Tor exits, hosting ranges and your own blocklists.',
    attacks: [
      { title: 'Region hopping', text: 'Prices, content or offers from another country.' },
      { title: 'Hidden origin', text: 'Fraud from high-risk regions through a VPN.' },
      { title: 'Tor', text: 'Anonymous traffic on sensitive flows.' },
    ],
    scenario: {
      caption: 'Visitors to a regional offer',
      columns: ['IP country', 'Device clock'],
      rows: [
        { a: 'Egypt', b: 'UTC+2', verdict: 'allow', note: 'Consistent' },
        { a: 'Germany', b: 'UTC+1', verdict: 'allow', note: 'Consistent' },
        { a: 'United States', b: 'UTC+2', verdict: 'review', note: 'vpn: timezone mismatch' },
        { a: 'Tor exit', b: 'UTC', verdict: 'block', note: 'tor' },
      ],
    },
    signals: [
      { id: 'vpn', why: 'Device offset that no zone of the IP country has.', sample: '"vpn": {\n  "detected": true,\n  "details": { "methods": ["timezoneMismatch"] }\n}' },
      { id: 'tor', why: 'Request IP in your Tor exit list.', sample: '"tor": { "detected": true }' },
      { id: 'datacenterIp', why: 'Hosting and cloud ranges most VPNs exit from.', sample: '"datacenterIp": { "detected": true }' },
    ],
    code: `const { signals, ip } = await trace.verify(eventId);

if (signals.tor.detected) return block();
if (signals.vpn.detected) return priceFor(defaultRegion);
return priceFor(ip.country);`,
    related: ['account-takeover', 'paywall', 'card-testing'],
  },
  {
    slug: 'paywall',
    scene: 'meter',
    title: 'Paywall and metering',
    short: 'Free article limits that survive private windows.',
    icon: 'newspaper',
    tone: 'cobalt',
    category: 'Revenue protection',
    headline: 'Five free articles means five.',
    sub: 'Count reads per visitor instead of per cookie, so a private window or cleared storage does not reset the meter.',
    attacks: [
      { title: 'Private windows', text: 'A fresh meter in every incognito tab.' },
      { title: 'Cleared cookies', text: 'One click resets cookie-based limits.' },
      { title: 'Browser switching', text: 'Five more reads in another browser.' },
    ],
    scenario: {
      caption: 'Reads from one reader, this month',
      columns: ['Article', 'Browser'],
      rows: [
        { a: 'Read 4 of 5', b: 'Chrome', verdict: 'allow', note: 'Within the meter' },
        { a: 'Read 5 of 5', b: 'Chrome, private', verdict: 'allow', note: 'Same visitorId, meter continues' },
        { a: 'Read 6', b: 'Chrome, cookies cleared', verdict: 'block', note: 'Show subscribe' },
        { a: 'Read 7', b: 'Firefox', verdict: 'block', note: 'Linked to the same device' },
      ],
    },
    signals: [
      { id: 'visitorId', why: 'Survives private windows and cleared cookies.', sample: '"visitorId": "Xk3pQ9vLmT2aR7sBn4Wc",\n"confidence": 0.97' },
      { id: 'incognito', why: 'Know a read came from a private window.', sample: '"incognito": { "detected": true }' },
    ],
    code: `const { visitorId } = await trace.verify(eventId);
const reads = await db.reads.countThisMonth(visitorId);

return reads >= 5 ? showPaywall() : showArticle();`,
    related: ['free-trial-abuse', 'account-sharing', 'vpn-detection'],
  },
  {
    slug: 'free-trial-abuse',
    scene: 'meter',
    title: 'Free trial abuse',
    short: 'One free trial per device.',
    icon: 'timer',
    tone: 'amber',
    category: 'Revenue protection',
    headline: 'Trials are for trying, once.',
    sub: 'Stop endless trials from the same machine with new emails, and turn repeat trial users into paying ones.',
    attacks: [
      { title: 'Trial cycling', text: 'A new email every 14 days.' },
      { title: 'Team on trials', text: 'Each teammate starts their own trial on one machine.' },
      { title: 'Throwaway cards', text: 'Virtual cards to pass the card check.' },
    ],
    scenario: {
      caption: 'Trial starts from one device',
      columns: ['Email', 'Month'],
      rows: [
        { a: 'ana@work.com', b: 'March', verdict: 'allow', note: 'First trial' },
        { a: 'ana.w@mail.com', b: 'April', verdict: 'review', note: 'Second trial on device: offer a discount' },
        { a: 'aw2@temp.io', b: 'May', verdict: 'block', note: 'Third trial: ask for payment' },
      ],
    },
    signals: [
      { id: 'deviceId', why: 'Store it with every trial you grant.', sample: '"deviceId": "Xk3pQ9vLmT2aR7sBn4Wc"' },
      { id: 'multiAccount', why: 'Many accounts on the device.', sample: '"multiAccount": {\n  "detected": true,\n  "details": { "accountsOnDevice": 3, "threshold": 2 }\n}' },
    ],
    code: `const { deviceId } = await trace.verify(eventId);
const trials = await db.trials.count({ deviceId });

if (trials > 0) return startPaidPlan();
await db.trials.insert({ deviceId, userId });`,
    related: ['promo-abuse', 'new-account-fraud', 'paywall'],
  },
  {
    slug: 'sms-pumping',
    scene: 'otp',
    title: 'SMS pumping',
    short: 'Stop bots draining your OTP budget.',
    icon: 'message-square',
    tone: 'ink',
    category: 'Security and payments',
    headline: 'Send codes to people, not to fraud rings.',
    sub: 'SMS pumping triggers thousands of verification texts to premium numbers. Check the device before you pay for the message.',
    attacks: [
      { title: 'OTP floods', text: 'Scripts requesting codes in a loop.' },
      { title: 'Premium numbers', text: 'Texts routed to numbers that pay the attacker.' },
      { title: 'Rotating IPs', text: 'Per-IP limits never trigger.' },
    ],
    scenario: {
      caption: 'Code requests from one visitor',
      columns: ['Number', 'Time'],
      rows: [
        { a: '+20 10 •••• 4412', b: '10:00:02', verdict: 'allow', note: 'First code' },
        { a: '+20 10 •••• 4412', b: '10:01:30', verdict: 'allow', note: 'Resend' },
        { a: '+882 •••• 0917', b: '10:01:34', verdict: 'block', note: 'velocity: new numbers, same visitor' },
        { a: '+882 •••• 0918', b: '10:01:35', verdict: 'block', note: 'bot' },
      ],
    },
    signals: [
      { id: 'velocity', why: 'Events per visitor, per IP and per account.', sample: '"velocity": {\n  "detected": true,\n  "details": { "exceeded": ["eventsPerVisitor5m"] }\n}' },
      { id: 'bot', why: 'Automated browsers requesting codes.', sample: '"bot": { "detected": true }' },
      { id: 'highActivity', why: 'Hundreds of events from one visitor a day.', sample: '"highActivity": { "detected": true }' },
    ],
    code: `const { signals, suspectScore } = await trace.verify(eventId);

if (signals.bot.detected || signals.velocity.detected) return tooManyRequests();
if (suspectScore >= 40) return captchaFirst();
return sendOtp(phone);`,
    related: ['bot-detection', 'new-account-fraud', 'card-testing'],
  },
  {
    slug: 'trusted-devices',
    scene: 'map',
    title: 'Trusted devices',
    short: 'Skip extra checks on devices a user always uses.',
    icon: 'shield-check',
    tone: 'green',
    category: 'Security and payments',
    headline: 'Less friction for the devices you know.',
    sub: 'Remember the devices each user signs in from. Skip the extra code on those, and save it for the ones you have never seen.',
    attacks: [
      { title: 'MFA fatigue', text: 'Users tired of codes on every login.' },
      { title: 'Blanket checks', text: 'Everyone pays the friction the attacker should.' },
      { title: 'Cookie-only trust', text: 'Lost when storage is cleared.' },
    ],
    scenario: {
      caption: 'Logins for one user',
      columns: ['Device', 'Seen before'],
      rows: [
        { a: 'Work laptop', b: '40 times', verdict: 'allow', note: 'Trusted: no code' },
        { a: 'Phone', b: '12 times', verdict: 'allow', note: 'Trusted: no code' },
        { a: 'Hotel PC', b: 'Never', verdict: 'review', note: 'New device: send a code' },
      ],
    },
    signals: [
      { id: 'visitorId', why: 'Recognise the browser across sessions.', sample: '"visitorId": "Xk3pQ9vLmT2aR7sBn4Wc",\n"matchKind": "token"' },
      { id: 'confidence', why: 'Trust only strong matches.', sample: '"confidence": 0.99' },
    ],
    code: `const event = await trace.verify(eventId);
const trusted = await db.trusted.has(userId, event.visitorId);

if (trusted && event.confidence > 0.9 && event.suspectScore < 25) return signIn();
return askForOtp();`,
    related: ['account-takeover', 'account-sharing', 'bot-detection'],
  },
  {
    slug: 'fake-engagement',
    scene: 'poll',
    title: 'Fake reviews and votes',
    short: 'One person, one vote, one review.',
    icon: 'star',
    tone: 'violet',
    category: 'Abuse and fraud',
    headline: 'Keep ratings honest.',
    sub: 'Reviews, polls, likes and surveys are only useful if each one comes from a different person. Group them by device.',
    attacks: [
      { title: 'Sock puppets', text: 'Many accounts praising one product.' },
      { title: 'Poll stuffing', text: 'Voting again in a private window.' },
      { title: 'Survey farms', text: 'One device collecting many survey rewards.' },
    ],
    scenario: {
      caption: 'Votes on one poll',
      columns: ['Account', 'Device'],
      rows: [
        { a: '@lina', b: 'Device A', verdict: 'allow', note: 'Counted' },
        { a: '@omar', b: 'Device B', verdict: 'allow', note: 'Counted' },
        { a: '@lina_2', b: 'Device A', verdict: 'block', note: 'Already voted from this device' },
        { a: 'anonymous', b: 'Device A, private', verdict: 'block', note: 'Same visitorId' },
      ],
    },
    signals: [
      { id: 'deviceId', why: 'One vote per device, across accounts.', sample: '"deviceId": "Xk3pQ9vLmT2aR7sBn4Wc"' },
      { id: 'multiAccount', why: 'Flags the device behind many accounts.', sample: '"multiAccount": {\n  "detected": true,\n  "details": { "accountsOnDevice": 5, "threshold": 2 }\n}' },
    ],
    code: `const { deviceId } = await trace.verify(eventId);

if (await db.votes.exists({ pollId, deviceId })) return alreadyVoted();
await db.votes.insert({ pollId, deviceId, choice });`,
    related: ['new-account-fraud', 'ban-evasion', 'bot-detection'],
  },
  {
    slug: 'web-scraping',
    scene: 'burst',
    title: 'Web scraping',
    short: 'Keep prices, listings and content from being harvested.',
    icon: 'scan-search',
    tone: 'cobalt',
    category: 'Abuse and fraud',
    headline: 'Your data, read by people.',
    sub: 'Scrapers copy prices, listings and content at machine speed. Spot the automated browsers and the visitors reading far more than anyone does.',
    attacks: [
      { title: 'Price monitoring', text: 'Competitors pulling every price, every hour.' },
      { title: 'Listing harvests', text: 'Whole catalogues copied in one night.' },
      { title: 'Hosted fleets', text: 'Headless browsers on cloud servers.' },
    ],
    scenario: {
      caption: 'Product page views, one hour',
      columns: ['Visitor', 'Pages'],
      rows: [
        { a: 'Xk3p…9Wc', b: '14 pages', verdict: 'allow', note: 'Normal browsing' },
        { a: 'Qp8w…kYa', b: '60 pages', verdict: 'allow', note: 'Heavy, but a real browser' },
        { a: 'Mn2r…e8Q', b: '900 pages', verdict: 'review', note: 'velocity + datacenterIp' },
        { a: 'Zt7c…1Lb', b: '4,000 pages', verdict: 'block', note: 'bot + highActivity' },
      ],
    },
    signals: [
      { id: 'bot', why: 'Headless and automated browsers.', sample: '"bot": { "detected": true }' },
      { id: 'velocity', why: 'Events per visitor and visitors per IP.', sample: '"velocity": {\n  "detected": true,\n  "details": { "exceeded": ["eventsPerVisitor1h"] }\n}' },
      { id: 'datacenterIp', why: 'Traffic from cloud and hosting ranges.', sample: '"datacenterIp": { "detected": true }' },
    ],
    code: `const { signals } = await trace.verify(eventId);

if (signals.bot.detected) return block();
if (signals.velocity.detected || signals.datacenterIp.detected) return slowDown();
return renderPage();`,
    related: ['bot-detection', 'vpn-detection', 'sms-pumping'],
  },
  {
    slug: 'chargebacks',
    scene: 'evidence',
    title: 'Chargeback disputes',
    short: 'Show the device history behind a disputed order.',
    icon: 'receipt',
    tone: 'green',
    category: 'Revenue protection',
    headline: 'Evidence for every dispute.',
    sub: '"I never ordered that." Trace keeps the device history behind each account, so you can show the same browser placed earlier orders the customer did not dispute.',
    attacks: [
      { title: 'Friendly fraud', text: 'A real order, disputed after delivery.' },
      { title: 'Family purchases', text: 'Someone else in the house used the card.' },
      { title: 'Weak evidence', text: 'An IP address alone rarely wins a dispute.' },
    ],
    scenario: {
      caption: 'Orders on one disputed account',
      columns: ['Order', 'Device'],
      rows: [
        { a: '#10214', b: 'Device A', verdict: 'allow', note: 'Delivered, not disputed' },
        { a: '#10560', b: 'Device A', verdict: 'allow', note: 'Delivered, not disputed' },
        { a: '#11032', b: 'Device A', verdict: 'review', note: 'Disputed: same visitorId as past orders' },
      ],
    },
    signals: [
      { id: 'visitorId', why: 'The same browser across orders.', sample: '"visitorId": "Xk3pQ9vLmT2aR7sBn4Wc",\n"matchKind": "token",\n"confidence": 0.99' },
      { id: 'history', why: 'GET /v1/visitors/:id lists past events.', sample: '"eventCount": 12,\n"firstSeenAt": "2026-08-02T09:00:00.000Z"' },
    ],
    code: `// at checkout: keep the visitor with the order
const event = await trace.verify(eventId);
await db.orders.update(orderId, { visitorId: event.visitorId });

// on a dispute: past orders from the same browser
const sameDevice = await db.orders.find({ visitorId: order.visitorId, disputed: false });`,
    related: ['card-testing', 'account-takeover', 'promo-abuse'],
  },
  {
    slug: 'ai-free-tier-abuse',
    scene: 'stack',
    title: 'AI free-tier abuse',
    short: 'Stop farming free credits on your AI product.',
    icon: 'sparkles',
    tone: 'violet',
    category: 'Abuse and fraud',
    headline: 'Free credits for people, not farms.',
    sub: 'Every new account on an AI product costs real compute. Stop one person cycling accounts to run a business on your free tier.',
    attacks: [
      { title: 'Credit cycling', text: 'A new account when the free credits run out.' },
      { title: 'Scripted sign-ups', text: 'Bots creating accounts to resell access.' },
      { title: 'API key farming', text: 'Many keys, one machine, pooled usage.' },
    ],
    scenario: {
      caption: 'Free accounts from one device',
      columns: ['Account', 'Credits used'],
      rows: [
        { a: 'dev@mail.com', b: '100 of 100', verdict: 'allow', note: 'First free tier' },
        { a: 'dev2@mail.com', b: '100 of 100', verdict: 'allow', note: 'Second account, under the limit' },
        { a: 'd3@temp.io', b: 'new', verdict: 'review', note: 'multiAccount: ask for a card' },
        { a: 'd4@temp.io', b: 'new', verdict: 'block', note: 'multiAccount + automatedInput' },
      ],
    },
    signals: [
      { id: 'multiAccount', why: 'Accounts per device, across browsers.', sample: '"multiAccount": {\n  "detected": true,\n  "details": { "accountsOnDevice": 4, "threshold": 2 }\n}' },
      { id: 'velocity', why: 'Many accounts from one visitor in a day.', sample: '"velocity": {\n  "detected": true,\n  "details": { "exceeded": ["linkedIdsPerVisitor24h"] }\n}' },
      { id: 'bot', why: 'Automated sign-up scripts.', sample: '"bot": { "detected": true }' },
    ],
    code: `const event = await trace.verify(eventId);

if (event.signals.bot.detected) return block();
const credits = event.signals.multiAccount.detected ? 0 : FREE_CREDITS;
await createAccount(email, { credits, deviceId: event.deviceId });`,
    related: ['new-account-fraud', 'free-trial-abuse', 'bot-detection'],
  },
  {
    slug: 'scalping',
    scene: 'queue',
    title: 'Ticket and drop scalping',
    short: 'Give limited releases to fans, not bots.',
    icon: 'ticket',
    tone: 'ink',
    category: 'Abuse and fraud',
    headline: 'Limited drops, fair queues.',
    sub: 'Concert tickets and sneaker drops sell out to scripts in seconds. Spot automated checkouts and one buyer behind many carts.',
    attacks: [
      { title: 'Checkout bots', text: 'Carts filled faster than any person can click.' },
      { title: 'Account armies', text: 'Many accounts to beat per-person limits.' },
      { title: 'Cloud fleets', text: 'Hundreds of headless browsers at release time.' },
    ],
    scenario: {
      caption: 'Orders in the first minute of a drop',
      columns: ['Account', 'Time to checkout'],
      rows: [
        { a: '@fan_lina', b: '48 s', verdict: 'allow', note: 'Normal buyer' },
        { a: '@omar', b: '35 s', verdict: 'allow', note: 'Normal buyer' },
        { a: '@buyer_17', b: '2 s', verdict: 'block', note: 'automatedInput' },
        { a: '@buyer_18', b: '2 s', verdict: 'block', note: 'Same device as @buyer_17' },
      ],
    },
    signals: [
      { id: 'automatedInput', why: 'Clicks and keys no person produces.', sample: '"automatedInput": { "detected": true }' },
      { id: 'bot', why: 'Headless and automated browsers.', sample: '"bot": { "detected": true }' },
      { id: 'multiAccount', why: 'One device behind many buyer accounts.', sample: '"multiAccount": {\n  "detected": true,\n  "details": { "accountsOnDevice": 6, "threshold": 2 }\n}' },
    ],
    code: `const { signals, deviceId } = await trace.verify(eventId);

if (signals.bot.detected || signals.automatedInput.detected) return soldOut();
if (await db.orders.exists({ dropId, deviceId })) return limitReached();`,
    related: ['bot-detection', 'card-testing', 'promo-abuse'],
  },
  {
    slug: 'giveaway-abuse',
    scene: 'poll',
    title: 'Giveaway and contest abuse',
    short: 'One entry per person.',
    icon: 'trophy',
    tone: 'amber',
    category: 'Abuse and fraud',
    headline: 'One entry. One chance.',
    sub: 'Giveaways, sweepstakes and contests only work if each entry is a different person. Count entries by device.',
    attacks: [
      { title: 'Entry stuffing', text: 'Dozens of entries under different emails.' },
      { title: 'Private windows', text: 'A fresh entry in every incognito tab.' },
      { title: 'Entry bots', text: 'Scripts submitting the form all day.' },
    ],
    scenario: {
      caption: 'Entries to one giveaway',
      columns: ['Email', 'Browser'],
      rows: [
        { a: 'mona@mail.com', b: 'Safari', verdict: 'allow', note: 'Counted' },
        { a: 'mona.s@mail.com', b: 'Safari, private', verdict: 'block', note: 'Same visitorId' },
        { a: 'ms1@temp.io', b: 'Chrome', verdict: 'block', note: 'Same deviceId' },
      ],
    },
    signals: [
      { id: 'incognito', why: 'Private windows keep the same visitorId.', sample: '"incognito": { "detected": true }' },
      { id: 'deviceId', why: 'One entry per device, across browsers.', sample: '"deviceId": "Xk3pQ9vLmT2aR7sBn4Wc"' },
    ],
    code: `const { deviceId } = await trace.verify(eventId);

if (await db.entries.exists({ contestId, deviceId })) return alreadyEntered();
await db.entries.insert({ contestId, deviceId, email });`,
    related: ['fake-engagement', 'promo-abuse', 'new-account-fraud'],
  },
  {
    slug: 'credential-stuffing',
    scene: 'pointer',
    title: 'Credential stuffing',
    short: 'Slow down leaked-password attacks on your login.',
    icon: 'lock-keyhole',
    tone: 'red',
    category: 'Security and payments',
    headline: 'Many accounts, one attacker.',
    sub: 'Leaked username and password lists get tried against your login. Rate limits per IP miss it; counting accounts per visitor does not.',
    attacks: [
      { title: 'Combo lists', text: 'Millions of leaked pairs, tried in bulk.' },
      { title: 'IP rotation', text: 'A new proxy for every attempt.' },
      { title: 'Low and slow', text: 'Few tries per account, many accounts.' },
    ],
    scenario: {
      caption: 'Login attempts from one visitor',
      columns: ['Account', 'IP'],
      rows: [
        { a: 'user_1182', b: '81.4.x.x', verdict: 'allow', note: 'First attempt' },
        { a: 'user_2093', b: '102.33.x.x', verdict: 'review', note: 'New account, new IP' },
        { a: 'user_7731', b: '45.12.x.x', verdict: 'block', note: 'velocity: linkedIdsPerVisitor24h' },
        { a: 'user_0420', b: '188.2.x.x', verdict: 'block', note: 'velocity + tlsMismatch' },
      ],
    },
    signals: [
      { id: 'velocity', why: 'Distinct accounts and IPs per visitor.', sample: '"velocity": {\n  "detected": true,\n  "details": { "exceeded": ["linkedIdsPerVisitor24h", "ipsPerVisitor24h"] }\n}' },
      { id: 'tlsMismatch', why: 'An HTTP client pretending to be a browser.', sample: '"tlsMismatch": {\n  "detected": true,\n  "details": { "reasons": ["noAlpn"] }\n}' },
      { id: 'bot', why: 'Automated login forms.', sample: '"bot": { "detected": true }' },
    ],
    code: `const { signals } = await trace.verify(eventId);

if (signals.bot.detected || signals.tlsMismatch.detected) return block();
if (signals.velocity.detected) return captchaBeforePassword();
return checkPassword();`,
    related: ['account-takeover', 'bot-detection', 'trusted-devices'],
  },
  {
    slug: 'application-fraud',
    scene: 'stack',
    title: 'Loan and BNPL application fraud',
    short: 'Catch repeat and synthetic credit applications.',
    icon: 'landmark',
    tone: 'cobalt',
    category: 'Security and payments',
    headline: 'One applicant, many identities.',
    sub: 'Fraudsters apply again and again with different or synthetic identities from the same setup. Link applications by device before you approve.',
    attacks: [
      { title: 'Identity cycling', text: 'A new name for every application.' },
      { title: 'Anti-detect setups', text: 'Browsers that fake a fresh device.' },
      { title: 'Hidden location', text: 'Applying through a VPN from abroad.' },
    ],
    scenario: {
      caption: 'Applications this week',
      columns: ['Applicant', 'Device'],
      rows: [
        { a: 'A. Hassan', b: 'Device A', verdict: 'allow', note: 'First application' },
        { a: 'M. Youssef', b: 'Device A', verdict: 'review', note: 'Second identity, same device' },
        { a: 'K. Adel', b: 'Device B', verdict: 'review', note: 'antiDetect + vpn' },
      ],
    },
    signals: [
      { id: 'multiAccount', why: 'Several applicants on one device.', sample: '"multiAccount": {\n  "detected": true,\n  "details": { "accountsOnDevice": 3, "threshold": 2 }\n}' },
      { id: 'antiDetect', why: 'A browser that contradicts itself.', sample: '"antiDetect": {\n  "detected": true,\n  "details": { "reasons": ["iframeMismatch"] }\n}' },
      { id: 'vpn', why: 'Device clock that does not fit the IP country.', sample: '"vpn": {\n  "detected": true,\n  "details": { "methods": ["timezoneMismatch"] }\n}' },
    ],
    code: `const event = await trace.verify(eventId);
const { multiAccount, antiDetect, vpn } = event.signals;

if (multiAccount.detected || antiDetect.detected) return manualReview(event.reasons);
if (vpn.detected) return requestDocuments();
return scoreApplication();`,
    related: ['new-account-fraud', 'vpn-detection', 'account-takeover'],
  },
  {
    slug: 'gift-card-fraud',
    scene: 'burst',
    title: 'Gift card fraud',
    short: 'Stop balance checking and gift card draining.',
    icon: 'wallet-cards',
    tone: 'amber',
    category: 'Security and payments',
    headline: 'Gift cards for the people who own them.',
    sub: 'Attackers guess and check gift card numbers, then drain the balances. Spot the one visitor behind thousands of balance checks.',
    attacks: [
      { title: 'Balance checking', text: 'Scripts trying card numbers in bulk.' },
      { title: 'Fast redemption', text: 'Found balances drained in minutes.' },
      { title: 'Hosting IPs', text: 'Checks run from rented servers.' },
    ],
    scenario: {
      caption: 'Balance checks in five minutes',
      columns: ['Card', 'Result'],
      rows: [
        { a: '•••• 8812', b: 'Valid', verdict: 'allow', note: 'Owner checking a balance' },
        { a: '•••• 0001', b: 'Invalid', verdict: 'review', note: 'Same visitor, new card' },
        { a: '•••• 0002', b: 'Invalid', verdict: 'block', note: 'velocity: eventsPerVisitor5m' },
      ],
    },
    signals: [
      { id: 'velocity', why: 'Many checks from one visitor.', sample: '"velocity": {\n  "detected": true,\n  "details": { "exceeded": ["eventsPerVisitor5m"] }\n}' },
      { id: 'datacenterIp', why: 'Checks from cloud servers.', sample: '"datacenterIp": { "detected": true }' },
      { id: 'bot', why: 'Automated forms.', sample: '"bot": { "detected": true }' },
    ],
    code: `const { signals } = await trace.verify(eventId);

if (signals.velocity.detected || signals.bot.detected) return tooManyRequests();
return checkBalance(cardNumber);`,
    related: ['card-testing', 'bot-detection', 'loyalty-fraud'],
  },
  {
    slug: 'referral-fraud',
    scene: 'graph',
    title: 'Referral fraud',
    short: 'Pay referral rewards for real new users.',
    icon: 'share-2',
    tone: 'green',
    category: 'Revenue protection',
    headline: 'Refer friends, not yourself.',
    sub: 'Referral programs pay for each new user. Check that the referrer and the new account are not the same device.',
    attacks: [
      { title: 'Self-referral', text: 'Inviting your own second account.' },
      { title: 'Browser hopping', text: 'The invite opened in another browser.' },
      { title: 'Referral rings', text: 'One device signing up many invitees.' },
    ],
    scenario: {
      caption: 'Referrals from @nour',
      columns: ['New account', 'Device'],
      rows: [
        { a: '@sara', b: 'Other device', verdict: 'allow', note: 'Reward paid' },
        { a: '@nour_2', b: "Nour's laptop, Firefox", verdict: 'block', note: "Linked to the referrer's device" },
        { a: '@friend_x', b: "Nour's laptop, private", verdict: 'block', note: "Same visitorId as the referrer" },
      ],
    },
    signals: [
      { id: 'deviceId', why: 'Compare referrer and invitee devices.', sample: '"deviceId": "Xk3pQ9vLmT2aR7sBn4Wc"' },
      { id: 'crossBrowser', why: 'Catches the invite opened in another browser.', sample: '"linkedVisitors": [\n  { "browser": "firefox", "confidence": 0.9, "sameNetwork": true }\n]' },
    ],
    code: `const invitee = await trace.verify(eventId);
const referrer = await db.users.get(referrerId);
const linked = invitee.linkedVisitors.map((v) => v.visitorId);

if (invitee.deviceId === referrer.deviceId || linked.includes(referrer.visitorId)) return noReward();`,
    related: ['promo-abuse', 'new-account-fraud', 'giveaway-abuse'],
  },
  {
    slug: 'loyalty-fraud',
    scene: 'map',
    title: 'Loyalty points fraud',
    short: 'Protect points and miles from being drained.',
    icon: 'coins',
    tone: 'amber',
    category: 'Revenue protection',
    headline: 'Points belong to the member.',
    sub: 'Loyalty balances are cash that is rarely watched. Spot logins from new devices and the burst of redemptions that follows a takeover.',
    attacks: [
      { title: 'Account takeover', text: 'Stolen logins to reach the points.' },
      { title: 'Fast transfers', text: 'Points moved out within minutes.' },
      { title: 'Shared accounts', text: 'One member account used everywhere.' },
    ],
    scenario: {
      caption: 'Redemptions on one member account',
      columns: ['Device', 'Points'],
      rows: [
        { a: 'Known phone', b: '2,000', verdict: 'allow', note: 'Usual device' },
        { a: 'New laptop, VPN', b: '40,000', verdict: 'review', note: 'New device + vpn: confirm by email' },
        { a: 'New laptop, VPN', b: '40,000', verdict: 'block', note: 'velocity' },
      ],
    },
    signals: [
      { id: 'accountSharing', why: 'One member on many devices.', sample: '"accountSharing": {\n  "detected": true,\n  "details": { "devicesForAccount": 7, "threshold": 5 }\n}' },
      { id: 'velocity', why: 'Redemptions bunched in minutes.', sample: '"velocity": {\n  "detected": true,\n  "details": { "exceeded": ["eventsPerVisitor5m"] }\n}' },
      { id: 'vpn', why: 'Location that does not fit the device.', sample: '"vpn": { "detected": true }' },
    ],
    code: `const event = await trace.verify(eventId);
const known = await db.devices.exists({ memberId, deviceId: event.deviceId });

if (!known && points > 10_000) return confirmByEmail();
if (event.signals.velocity.detected) return holdRedemption();`,
    related: ['account-takeover', 'account-sharing', 'gift-card-fraud'],
  },
  {
    slug: 'regional-pricing',
    scene: 'clock',
    title: 'Regional pricing abuse',
    short: 'Keep local prices for local customers.',
    icon: 'map-pin',
    tone: 'cobalt',
    category: 'Revenue protection',
    headline: 'Local prices, local buyers.',
    sub: 'Lower prices in some countries attract buyers from others through a VPN. Compare the device with the IP before you show the discount.',
    attacks: [
      { title: 'VPN shopping', text: 'Checking out through a cheaper country.' },
      { title: 'Hosting exits', text: 'Commercial VPNs on datacenter ranges.' },
      { title: 'Timezone tells', text: 'A Cairo clock on a Brazilian IP.' },
    ],
    scenario: {
      caption: 'Visitors to a regional price',
      columns: ['IP country', 'Device clock'],
      rows: [
        { a: 'Brazil', b: 'UTC-3', verdict: 'allow', note: 'Local price' },
        { a: 'Brazil', b: 'UTC+2', verdict: 'review', note: 'vpn: show the default price' },
        { a: 'Brazil, hosting', b: 'UTC+1', verdict: 'review', note: 'datacenterIp + vpn' },
      ],
    },
    signals: [
      { id: 'vpn', why: 'Device offset no zone of the IP country has.', sample: '"vpn": {\n  "detected": true,\n  "details": { "methods": ["timezoneMismatch"] }\n}' },
      { id: 'datacenterIp', why: 'Hosting ranges most VPNs exit from.', sample: '"datacenterIp": { "detected": true }' },
    ],
    code: `const { signals, ip } = await trace.verify(eventId);
const suspicious = signals.vpn.detected || signals.datacenterIp.detected;

return priceFor(suspicious ? 'default' : ip.country);`,
    related: ['vpn-detection', 'paywall', 'promo-abuse'],
  },
];

export interface Industry {
  slug: string;
  title: string;
  icon: string;
  text: string;
  headline: string;
  sub: string;
  pains: { title: string; text: string }[];
  cases: string[];
}

export const INDUSTRIES: Industry[] = [
  {
    slug: 'fintech',
    title: 'Fintech and banking',
    icon: 'landmark',
    text: 'Protect logins, payouts and onboarding.',
    headline: 'Trust the device before you move the money.',
    sub: 'Onboarding, logins and payouts are where fintech fraud lands. Recognise the device behind each one and step up only when something is off.',
    pains: [
      { title: 'Synthetic applicants', text: 'Many identities applying from one setup.' },
      { title: 'Account takeover', text: 'Stolen logins draining balances.' },
      { title: 'Payout abuse', text: 'Fast transfers out from new devices.' },
    ],
    cases: ['application-fraud', 'account-takeover', 'credential-stuffing', 'trusted-devices'],
  },
  {
    slug: 'e-commerce',
    title: 'E-commerce',
    icon: 'shopping-cart',
    text: 'Clean checkouts, fair drops and promotions.',
    headline: 'Checkouts for customers, not scripts.',
    sub: 'From card testing to coupon farming, most store abuse comes from a few devices doing a lot. Find them at checkout.',
    pains: [
      { title: 'Card testing', text: 'Stolen cards checked with tiny orders.' },
      { title: 'Coupon farming', text: 'First-order codes used again and again.' },
      { title: 'Chargebacks', text: 'Disputes with little evidence to answer them.' },
    ],
    cases: ['card-testing', 'promo-abuse', 'chargebacks', 'scalping'],
  },
  {
    slug: 'marketplaces',
    title: 'Marketplaces',
    icon: 'store',
    text: 'Trustworthy buyers, sellers and listings.',
    headline: 'Real buyers, real sellers, real reviews.',
    sub: 'A marketplace runs on trust between strangers. Keep banned sellers out, reviews honest and listings your own.',
    pains: [
      { title: 'Returning bad actors', text: 'Banned sellers back under a new name.' },
      { title: 'Review farms', text: 'One device rating its own products.' },
      { title: 'Scraped listings', text: 'Your catalogue copied overnight.' },
    ],
    cases: ['ban-evasion', 'fake-engagement', 'web-scraping', 'new-account-fraud'],
  },
  {
    slug: 'gaming',
    title: 'Gaming and iGaming',
    icon: 'gamepad-2',
    text: 'One bonus per player, no multi-accounting.',
    headline: 'One player, one welcome bonus.',
    sub: 'Bonus hunters and multi-accounters cost real money. Tie every account, bonus and referral to the device behind it.',
    pains: [
      { title: 'Bonus abuse', text: 'A new account for every welcome offer.' },
      { title: 'Referral loops', text: 'Players inviting themselves.' },
      { title: 'Bots', text: 'Scripts farming rewards around the clock.' },
    ],
    cases: ['promo-abuse', 'new-account-fraud', 'referral-fraud', 'bot-detection'],
  },
  {
    slug: 'saas',
    title: 'SaaS and AI',
    icon: 'layout-dashboard',
    text: 'Honest trials, paid seats and fair AI credits.',
    headline: 'Free tiers that convert, not leak.',
    sub: 'Trials and free credits are a cost of growth. Stop the few devices that cycle accounts, and see who shares one paid seat.',
    pains: [
      { title: 'Trial cycling', text: 'A new email when the trial ends.' },
      { title: 'Credit farming', text: 'Free AI credits pooled across accounts.' },
      { title: 'Seat sharing', text: 'A team on a single-user plan.' },
    ],
    cases: ['free-trial-abuse', 'ai-free-tier-abuse', 'account-sharing', 'account-takeover'],
  },
  {
    slug: 'media',
    title: 'Media and streaming',
    icon: 'play-square',
    text: 'Meters and subscriptions that hold.',
    headline: 'Meters and subscriptions that hold.',
    sub: 'Paywalls reset in a private window, and one subscription ends up on a dozen screens. Count by device instead.',
    pains: [
      { title: 'Meter resets', text: 'Free reads again in incognito.' },
      { title: 'Password sharing', text: 'One plan, many households.' },
      { title: 'Region hopping', text: 'Content and prices from another country.' },
    ],
    cases: ['paywall', 'account-sharing', 'vpn-detection', 'regional-pricing'],
  },
  {
    slug: 'social',
    title: 'Social and communities',
    icon: 'messages-square',
    text: 'Bans that stick and real engagement.',
    headline: 'Bans that stick. Voices that count.',
    sub: 'Communities need moderation that survives a new account, and engagement that comes from real people.',
    pains: [
      { title: 'Ban evasion', text: 'Banned users back the same day.' },
      { title: 'Sock puppets', text: 'Fake accounts amplifying one voice.' },
      { title: 'Spam bots', text: 'Automated sign-ups and posts.' },
    ],
    cases: ['ban-evasion', 'fake-engagement', 'bot-detection', 'new-account-fraud'],
  },
  {
    slug: 'travel',
    title: 'Travel and delivery',
    icon: 'plane',
    text: 'Protect loyalty points, fares and first-order offers.',
    headline: 'Points, fares and offers for real customers.',
    sub: 'Loyalty balances, regional fares and first-order discounts are all worth stealing. Protect them by device.',
    pains: [
      { title: 'Points theft', text: 'Taken-over accounts drained of miles.' },
      { title: 'Fare arbitrage', text: 'Booking through a cheaper country.' },
      { title: 'Welcome offers', text: 'First-order discounts used many times.' },
    ],
    cases: ['loyalty-fraud', 'regional-pricing', 'promo-abuse', 'sms-pumping'],
  },
];

export const industry = (slug: string) => INDUSTRIES.find((i) => i.slug === slug);

export const useCase = (slug: string) => USE_CASES.find((u) => u.slug === slug);

/** Use cases with a handwritten docs guide (content/docs/<slug>.md); every other case gets a generated guide at /docs/<slug>. */
export const HANDWRITTEN_GUIDES: Record<string, string> = {
  'new-account-fraud': 'new-account-fraud',
  'account-sharing': 'account-sharing',
  'ban-evasion': 'ban-evasion',
  'bot-detection': 'bot-protection',
};

export const guideSlug = (slug: string) => HANDWRITTEN_GUIDES[slug] ?? slug;
