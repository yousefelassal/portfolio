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

### Cloudflare Workers

[wrangler](https://developers.cloudflare.com/workers/wrangler/) for dev

```json
{
    "scripts": {
        "dev": "wrangler pages dev --compatibility-flags=nodejs_compat --compatibility-date=2024-03-15 -- vite",
    }
}
```

#### Compatibility flags
- [nodejs_compat](https://developers.cloudflare.com/workers/configuration/compatibility-dates/#nodejs-compatibility-flag)

#### Environment variables

##### using `wrangler.toml`

```toml
[vars]

KEY = "..."
```

##### using `.dev.vars`

similar to a regular .env
```
KEY=...
```

## Created a deployment pipeline using GitHub Actions.

### Serve and Test ([start-server-and-test](https://github.com/bahmutov/start-server-and-test))

```bash
> start-server-and-test prod http://localhost:8788 'npx playwright test'

1: starting server using command "npm run prod"
and when url "[ 'http://localhost:8788' ]" is responding with HTTP status code 200
running tests using command "npx playwright test"
```

### env variables ([stackoverflow](https://stackoverflow.com/a/63350136))

paste your entire env file in one secret named `ENV_FILE` and the just do `echo "${{ secrets.ENV_FILE }}" > .env`

```yaml
- name: Create env file
  run: echo "${{ secrets.ENV_FILE }}" > .env
```

### Skipping workflow
add if statement before steps to check if commit msgs for a skip flag (in this case '#skip')

```yaml
jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    if: ${{ github.event_name == 'push' && !contains(join(github.event.commits.*.message, ''), '#skip') }}
```

## Tested the application using Playwright.

