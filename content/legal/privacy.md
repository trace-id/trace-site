# Privacy notice

This notice explains what personal data this website and its live demo handle, why, and what your choices are. It covers the Trace website only. It does not cover the Trace software you run yourself; that is described at the end.

## Who is responsible

This site is run by the maintainers of the Trace open-source project (the "operator"). To contact us about privacy, open an issue in the project repository or use the private channel on the [security page](/security).

## What the website itself collects

- **Server logs.** Like any web server, our hosting records the IP address, time, requested address and browser user agent of each request. We use them to keep the site working and to investigate abuse, and keep them only as long as the hosting provider's log retention allows.
- **Nothing for advertising or analytics.** The site does not use advertising trackers, social-media pixels or third-party analytics scripts, and the site's own code sets no cookies. The only cookie is the demo's visitor token, described below.
- **Preferences stored on your device.** The docs remember your last code-tab choice and your recent searches, and the demo remembers your history and completed tasks. These live in your browser's local storage, never leave it, and you can clear them any time. See the [cookie and storage notice](/cookies).

## The live demo
<a id="live-demo"></a>

The home page and the [live demo](/demo) run Trace on your own browser so that you can see what it does. When you open them:

1. Trace's browser SDK reads your browser's characteristics: screen size, time zone, languages, platform, user agent, graphics and audio fingerprints (hashed in your browser), installed-font hints, input behaviour counts and similar signals. The [signal catalog](/docs/signals) lists every one, and the [privacy guide](/docs/privacy) lists what is stored. The SDK asks for no permissions and reads no files, location or devices.
2. Those readings are sent to a demonstration Trace server, which stores them with a visitor ID, your IP address (truncated, unless the demo is configured otherwise) and the result, and sends the result back to you.
3. A visitor token is saved in your browser (a first-party cookie that lasts 400 days, local storage and IndexedDB) so the demo can show that it recognises you when you return.

**Why:** you asked to see the demo by opening the page, and showing it is the purpose of the site. We rely on your request to view it and, for security and abuse prevention, on our legitimate interest. If you would rather not take part, do not open the demo, or block the SDK script in your browser; the rest of the site works without it.

**Who sees it:** the operator of the demo server. We do not sell the data, do not share it with advertisers, and do not use it to identify you as a person or to link it to anything outside the demo.

**How long:** demo data is kept for the demo project's retention period (the Trace default is 30 days unless the operator sets it shorter), then deleted.

**Your controls:** the demo's "Forget me" button clears the stored token and starts a fresh visitor. You can also clear this site's storage and cookies in your browser settings. The SDK stays off when you block its script.

## Your rights

Depending on where you live, you may have the right to access, correct or delete personal data we hold about you, to object to or restrict processing, to data portability, and to complain to your data-protection authority. To exercise them for demo data, contact us as above and tell us the visitor ID shown on the demo (or the date and IP address of your visit). We cannot look up data without an identifier, because the demo deliberately holds none about who you are.

## Children

The site is a developer tool and is not aimed at children.

## International transfers

The site and demo are served from the regions of the hosting providers the operator chooses. Where data leaves your country, the operator relies on the safeguards those providers offer.

## Changes

We will update this page when the site's data handling changes and change the date at the top of the page.

## If you run Trace yourself

Trace is self-hosted software. When you deploy it, you are the controller (or processor) of the visitor data it stores, and none of that data reaches the Trace project or this website. You need your own privacy notice and legal basis. The [privacy guide for operators](/docs/privacy) lists what is stored, the controls for retention, deletion and consent, and where to take legal advice.
