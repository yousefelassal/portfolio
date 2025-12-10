---
title: "Racore"
summary: "A platform for booking celebrities, influencers, and experts for custom video messages."
date: "Sep 30 2025"
draft: false
tags:
- Cloudflare Workers
- Hono
- React
demoUrl: https://3ads-bgeba.pages.dev
---

<img src="https://h4ej7o5mx1.ufs.sh/f/hqvJtwAnNHr9KVDiTnWhDI0mof1bWR7ZqG5J9PtY8dviB6uy" alt="logo">

Racore is a [cameo](https://www.cameo.com) inspired platform that allows users to book celebrities, influencers, and experts for personalized video messages.

The platform is built using [Cloudflare Workers](https://workers.cloudflare.com/) leveraging its global edge network to ensure low latency and high availability. 

<img src="https://h4ej7o5mx1.ufs.sh/f/hqvJtwAnNHr9lzk0kcaQ5srHmgnvDMXT6Czh12oGJu3Eb8lp" alt="bindings">

We used [Hono](https://hono.dev) as the web framework for building the serverless functions, taking advantage of its lightweight nature and compatibility with Cloudflare Workers. For the frontend we used React, and TailwindCSS.

We designed it in a way to allow users (clients) to easily browse through available personalities, select their desired individual, and provide details for the custom video message. On the other side, "talents" have their own dashboard to manage incoming requests, record videos, and track earnings.
