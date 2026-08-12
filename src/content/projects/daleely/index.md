---
title: "Daleely"
summary: "Connecting clients with experts (electricians, plumbers, etc.)"
date: "Aug 12 2026"
draft: false
tags:
  - Cloudflare Workers
  - TypeScript
  - React
appUrl: https://daleely.co
---

<img src="https://assets.daleely.co/og.png" alt="logo">

Daleely is service marketplace that connects everyday clients with local experts (electricians, plumbers, technicians, and specialized handymen). We handle the full user journey from discovering professionals and viewing service profiles to booking, and managing requests.

As of writing, we got 5 services running on Cloudflare.

- Client App: The client facing SSR app, where clients can browse services, and book appointments.
- Expert App: A dedicated workspace where service providers manage their availability, receive incoming requests, and update their profile.
- Admin Portal: Internal service for platform operations.
- Redirects Engine: Handles URL redirections for the client and expert apps.
- Open Graph Service: Dynamically generates customized social preview cards on the fly.
