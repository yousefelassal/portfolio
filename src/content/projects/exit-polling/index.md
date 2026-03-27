---
title: "Exit Polling"
summary: "Real-time exit polling application."
date: "Mar 20 2026"
draft: false
tags:
- Elixir
- Phoenix
repoUrl: https://github.com/yousefelassal/exit_polling
---

I've always been fascinated by functional programming languages, and Elixir is one of the most popular ones out there, and I love it. The way I can just spawn processes without worrying about memory management or thread safety is amazing. The native pattern matching, pipes, guards and the powerful OTP framework make it a joy to work with.

So, I decided to build a real-time exit polling application using Elixir, Phoenix, and Inertia.js.

<img src="https://github.com/user-attachments/assets/52065695-6f01-4202-b154-ca137695cd83" alt="image" />

The app is made up of 3 different mix projects:
- **poller**: The OTP application that handles the business logic of the app, it uses GenServers to manage the state of the polls and the votes.
- **poller dal**: A simple application that handles the database interactions using Ecto and Postgres.
- **poller phx**: The Phoenix application that serves the frontend and handles the web requests, it uses Inertia.js to render the frontend using React.
