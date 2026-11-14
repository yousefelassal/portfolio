---
title: "pushpilot"
summary: "Framework-agnostic Web Push notifications"
date: "Nov 14 2026"
draft: false
tags:
  - TypeScript
  - NPM
appUrl: https://pushpilot.yousefelassal.com
repoUrl: https://github.com/yousefelassal/pushpilot
---

Every time I needed Web Push notifications in a project, I rolled my own setup. I kept writing the same boilerplate for subscriptions, service workers, and sending notifications. Eventually, I figured I could put that code in a single package and make the next project easier to build.

I wrote about one of those setups in [Web Push Notifications on Cloudflare Workers](/blog/vapid-notifications-cloudflare-workers/). It walks through the VAPID keys, service worker, and subscription handling I kept rebuilding.

I named the package pushpilot. It works with Node.js, Bun, Deno, and Cloudflare Workers, with helpers for the server, browser, React, and service workers. Each app still owns its authentication and database.

I built it to save myself from repeating that setup, and made it public in case it saves someone else the same work.

Read the [documentation](https://pushpilot.yousefelassal.com) for setup and framework guides, or browse the [source code on GitHub](https://github.com/yousefelassal/pushpilot).
