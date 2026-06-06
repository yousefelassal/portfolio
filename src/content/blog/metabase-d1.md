---
title: "Setting Up Metabase with D1"
summary: "How to set up Metabase with Cloudflare D1 through a local SQLite export."
date: "May 25 2026"
draft: false
tags:
  - Metabase
  - D1
---

Metabase is great for analytics, but it has no Cloudflare D1 driver and the [feature request](https://github.com/metabase/metabase/issues/47494) for one has gone nowhere. The workaround we run: export D1 to a local SQLite file, point Metabase at it, and share it over HTTPS with a Cloudflare Tunnel when needed.

It's not a perfect solution, you need to run a script periodically to sync the local SQLite file with the remote D1 database. But you never run heavy analytics against your live app database anyways, you run them against a copy.

## The Sync Script

`wrangler d1 export` dumps the remote DB to SQL then we replay it into a local `.sqlite` file that Metabase reads directly.

```bash
#!/bin/bash
DB_NAME="your-d1-database-name"
SQLITE_PATH="$(dirname "$0")/sqlite-db/analytics.sqlite"

npx wrangler d1 export $DB_NAME --output=/tmp/d1export.sql --remote --skip-confirmation

sqlite3 $SQLITE_PATH.new <<EOF
PRAGMA synchronous = OFF;
PRAGMA journal_mode = MEMORY;
.read /tmp/d1export.sql
EOF

mv $SQLITE_PATH.new $SQLITE_PATH   # atomic swap, Metabase never reads a half-written file
rm /tmp/d1export.sql
```

Needs `wrangler` authenticated and `sqlite3` installed. Run it whenever you want fresh data. Just remember the export counts against your D1 reads and briefly blocks the database, so don't overdo it.

## Docker Compose

Metabase on port `3003`, with Postgres as its app database (for the dashboards, questions, and settings).

```yaml
services:
  metabase:
    image: metabase/metabase
    restart: unless-stopped
    ports:
      - "3003:3000"
    volumes:
      - ./sqlite-db:/sqlite-db
    environment:
      MB_DB_TYPE: postgres
      MB_DB_HOST: postgres
      MB_DB_PORT: 5432
      MB_DB_DBNAME: metabase
      MB_DB_USER: metabase
      MB_DB_PASS: ${MB_DB_PASS}
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:15
    restart: unless-stopped
    environment:
      POSTGRES_DB: metabase
      POSTGRES_USER: metabase
      POSTGRES_PASSWORD: ${MB_DB_PASS}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U metabase"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:
```

`docker compose up -d`, open `http://localhost:3003`, run the setup wizard, then add a SQLite database pointing at `/sqlite-db/analytics.sqlite`.

## Sharing with [Cloudflare Tunnel](https://developers.cloudflare.com/tunnel/)

Quick public URL, no firewall ports:

```bash
cloudflared tunnel --url http://localhost:3003
```

It prints a `https://*.trycloudflare.com` URL that stays alive while the process runs. It's public and unauthenticated, so treat it accordingly. For a stable URL, set up a named tunnel and run it as a `cloudflared` service in the same compose file.

You can also connect a route through the cloudflare dashboard to a specific custom subdomain or path to expose the tunnel publicly instead of generating a random URL.

## Limitations

- Data is at most one sync behind, so not for real-time monitoring.
- Sync is one-way; writes still go through your Workers.
- Exports are full (no incremental/CDC) and a single D1 database caps at 10 GB, so exports get slower as you approach that.
