# Cookies and browser storage

This page lists everything the site stores in your browser. We use no advertising or analytics cookies and no third-party trackers. Everything below is first-party (set on this site's own address), and the site works with all of it blocked, except that the live demo then has nothing to remember.

## Needed to show the live demo

These appear only when you open the home page's demo card or the [live demo](/demo). They let the demo recognise you when you come back, which is what it demonstrates.

| Name | Where | What it holds | Lifetime |
| --- | --- | --- | --- |
| `_dvi_vt` | Cookie | A visitor token issued by the demo server, written by the Trace SDK running in your browser | 400 days |
| `_dvi_vt` | Local storage | The same token | Until you clear it |
| `_dvi` | IndexedDB | The same token | Until you clear it |
| `demo.history`, `demo.tasks` | Local storage | Your recent demo results and the demo tasks you ticked, so the page can show them | Until you clear it |
| `demo.forgotten` | Session storage | Remembers that you pressed "Forget me" in this tab, so the demo starts fresh | Until you close the tab |

The "Forget me" button on the demo removes the token from all three places and starts a fresh visitor.

## Preferences

| Name | Where | What it holds |
| --- | --- | --- |
| `trace-docs-tab` | Local storage | Which code tab (for example npm or pnpm) you chose in the docs |
| `trace-search-recent` | Local storage | Your recent documentation searches |

These never leave your browser.

## How to remove or block them

Use your browser's settings to clear cookies and site data for this site, or to block them. Blocking the cookie and storage does not stop the demo from reading browser characteristics; to stop that, do not open the demo or block its script. See the [privacy notice](/privacy#live-demo) for how the demo handles data.

## Changes

We will update this page and its date if the site starts storing anything new.
