---
title: "Translator"
summary: "Utilized Microsoft Azure AI Services to detect, translate and pronounce text in multiple languages."
date: "Mar 20 2024"
draft: false
tags:
- Typescript
- Hono
- Tailwind
- React
- React Query
- Node.js
demoUrl: https://traductor-mw5.pages.dev/
repoUrl: https://github.com/yousefelassal/traductor
---

<img src="https://utfs.io/f/69beea84-c5f0-4eb5-824d-2f798d101299-or4hu5.png" alt="demo">

## Created edge functions using [Hono RPC Stack](https://hono.dev/guides/rpc).

### Server

```ts
import { Hono } from 'hono'
import example from 'routes/example'

const app = new Hono()
.basePath('/api')
.route('/example', example)
.route('/...', ...)

export type AppType = app
```

<div align="center">

<i>[[route.ts]]</i>

</div>

```ts
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { db } from '../db'

const schema = z.object({
  id: z.string(),
  title: z.string(),
})

const test = new Hono()
  .post('/', zValidator('form', schema), async (c) => {
    const todo = c.req.valid('form')
    await db.test.create({ data: todo })
    return c.json({
        todo
    })
  })
  .get('/', async (c) => {
    const todos = await db.test.findMany()
    return c.json({
        todos
    })
  })

export default test
```

<div align="center">

<i>/routes/example.ts</i>

</div>

### Client

```ts
import { AppType } from './server'
import { hc } from 'hono/client'

const client = hc<AppType>('/api')
const res = await client.todo.$get()
const post = await client.todo.$post({
    form: {
        id: '12309',
        title: 'example'
    }
})
```

- Built a React TSX Frontend (Vite, React Query, Zustand, TailwindCSS).
- Created a deployment pipeline using GitHub Actions.
- Tested the application using Playwright.
