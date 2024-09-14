---
title: "Activity Log"
summary: "A Full Stack project developed as part of an interview process. Showcases infinite loading, filtering, csv export, and a live search."
date: "Jun 29 2024"
draft: false
tags:
- Typescript
- Tailwind
- React
- Express
- Prisma
- Postgres
demoUrl: https://image-color-picker-pi.vercel.app/
repoUrl: https://github.com/yousefelassal/image-color-picker
---

<img src="https://utfs.io/f/hqvJtwAnNHr9eOsLCEkmBMSVJd27lYkjZfDQ3IHrs50T6po4" alt="demo">

This project was developed as part of an interview process for [Instatus](https://instatus.com/). 

I handled the server state with SWR on the client side, and used Prisma on the server side to interact with the Postgres database through Express. A simple npm package was created to handle the creation of new events, it verifies the user using a key and then adds the event to the log.