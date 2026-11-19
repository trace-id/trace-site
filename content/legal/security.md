# Security policy

Trace helps teams stop fraud, so we take the security of Trace seriously. This page explains how to report a vulnerability and what to expect.

## Reporting a vulnerability

Please report privately, not in a public issue or discussion. Use the private vulnerability reporting of the project repository (the "Security" tab, then "Report a vulnerability"), or the contact listed in [`security.txt`](/.well-known/security.txt).

Include what you found, the steps to reproduce it, the version or commit you tested and, if you can, the impact you expect. Proof-of-concept code is welcome. Please do not include other people's data.

## What to expect

- We acknowledge reports promptly and keep you updated as we investigate.
- We confirm the issue, work on a fix, and release it with an advisory that credits you, if you want that.
- We ask for a reasonable time to fix the problem before you disclose it publicly, and we will agree a date with you for serious issues.

We do not run a paid bounty program at this time.

## Scope

In scope: the Trace server and dashboard, the browser and server SDKs, the Docker and setup files, and this website.

Out of scope: findings that need a compromised device or server you already control, missing best-practice headers with no demonstrated impact, volumetric denial of service, social engineering of maintainers, and issues in third-party services we link to. Self-hosted deployments are operated by their owners; the [security checklist](/docs/security-checklist) covers hardening them.

## Safe harbour

If you act in good faith, follow this policy, avoid privacy violations and service disruption, and give us a chance to fix the problem before disclosure, we will not pursue legal action against you for your research.

## Hardening your own deployment

Keys, webhooks, rate limits and the production settings are described in the [security checklist](/docs/security-checklist), and what the software stores is described in the [privacy guide](/docs/privacy).
