---
title: "Building Dynamic OG Images on the Edge with Cloudflare Workers"
summary: "How we built a dynamic OpenGraph image generator on Cloudflare Workers using Satori, Resvg-WASM, and a healthy amount of trial and error."
date: "May 25 2026"
draft: false
tags:
  - Cloudflare Workers
  - Satori
  - Resvg
---

Every time someone shares a link on social media, there's a small window of time where the platform fetches a preview image that 1200×630 rectangle that either makes people click or scroll past. For [Daleely](https://daleely.co), we wanted those cards to show the actual technician: their face, their name, and the service they offer. No static fallback, no generic branding.

So we built a little Cloudflare Worker that cooks them up on demand. Here's how it works.

---

## The Stack

The pipeline is three steps:

1. [**Satori**](https://github.com/vercel/satori): turns HTML and CSS into SVG.
2. [**Resvg**](https://github.com/yisibl/resvg-js): takes that SVG and renders it to a PNG via WebAssembly.
3. [**jSquash**](https://github.com/jamsinclair/jSquash): handles WebP → PNG conversion as our images are saved in as WebP.

All of it runs inside a single Cloudflare Worker, deployed at the edge, with a cache sitting in front so we're not regenerating the same image over and over.

---

## The Entry Point

The Worker is a Hono app with two routes that actually matter:

```ts
/**
 * GET /:id
 * generate (or serve cached) OG image
 */
.get(
  '/:id',
  cache({ cacheName: 'og-images', cacheControl: 'public, max-age=604800' }),
  async (c) => {
    const id = c.req.param('id');

    // validate id and do whatever database lookup is needed

    // initialize runtime
    await initRuntime();

    // generate PNG
    const png = await generateOgPng({ /*  */ });

    // return PNG as response
    return new Response(png, {
      headers: { 'Content-Type': 'image/png' },
    });
  }
)

/**
 * DELETE /:id
 * purge a cached entry (dev tools, guarded by secret)
 */
.delete('/:id', devToolsGuard, async (c) => {
  const url = new URL(c.req.url);
  url.pathname = `/${c.req.param('id')}`;

  const cache = await caches.open('og-images');
  const deleted = await cache.delete(url.toString());

  if (!deleted) throw newHTTPException(404, 'Cache entry not found');

  return c.json({ success: true, purged: url.toString() });
})
```

The `DELETE` endpoint exists for one reason: when a technician swaps their profile picture, we can bust their cached image immediately instead of waiting a whole week for the CDN to expire it on its own.

---

## Initializing WASM

Resvg and jSquash are both WebAssembly modules, which means they need to be initialized before they'll do anything, and that init is async. We keep a `wasmReady` flag so we only pay that cost once per Worker isolate:

```ts
import pngEncWasm from "@jsquash/png/codec/pkg/squoosh_png_bg.wasm";
import { init as initPngEnc } from "@jsquash/png/encode";
import webpDecWasm from "@jsquash/webp/codec/dec/webp_dec.wasm";
import { init as initWebpDec } from "@jsquash/webp/decode";
import { initWasm } from "@resvg/resvg-wasm";
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm";

let wasmReady = false;

export async function initRuntime(): Promise<void> {
  if (!wasmReady) {
    await Promise.all([
      initWasm(resvgWasm),
      initWebpDec(webpDecWasm),
      initPngEnc(pngEncWasm),
    ]);
    wasmReady = true;
  }
}
```

The WASM files get imported directly and Wrangler's `CompiledWasm` rule handles the bundling:

```jsonc
// wrangler.jsonc
"rules": [
  { "type": "CompiledWasm", "globs": ["**/*.wasm"], "fallthrough": true }
]
```

### The ImageData polyfill nobody warned you about

There's a sneaky little bug waiting for you in jSquash's WebP decoder. It tries to figure out if it's running inside a Service Worker by checking for `ServiceWorkerGlobalScope` in the global scope. Cloudflare Workers don't expose that, so i think the library assumes it's in a browser, then it expects `ImageData` to exist globally. It doesn't. Not in Workers.

The fix is four lines and has to run before any WebP decoding happens:

```ts
// @jsquash/webp detects Workers via `ServiceWorkerGlobalScope`, which isn't
// exposed in the CF Workers runtime, so its built-in ImageData polyfill is
// never applied. We add it manually so the libwebp C++ decoder can call
// `new ImageData(...)`.
const g = globalThis as unknown as Record<string, unknown>;
if (!g["ImageData"]) {
  g["ImageData"] = class ImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    constructor(data: Uint8ClampedArray, width: number, height: number) {
      this.data = data;
      this.width = width;
      this.height = height;
    }
  };
}
```

No `ImageData` polyfill means every WebP image silently fails to convert, which means profile pictures just don't show up. Add this before the initRuntime call and save yourself an afternoon of confusion.

---

## Getting a Font Out of Google Fonts

Satori wants fonts as raw `ArrayBuffer`s, and it only speaks TTF, OTF, and WOFF. Not WOFF2. The problem is Google Fonts serves WOFF2 by default to any modern browser, because of course it does.

The workaround is kind of cursed but it works: send an ancient browser's User-Agent string so Google falls back to serving TTF.

```ts
async function loadFont(
  family: string,
  weight: number,
): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`,
      {
        headers: {
          // Old Safari UA → Google returns TTF/WOFF, not WOFF2.
          // Satori does not support WOFF2.
          "User-Agent":
            "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
        },
      },
    ).then((r) => r.text());

    const match = css.match(
      /src: url\((.+?)\) format\('(?:truetype|opentype|woff)'\)/,
    );
    if (!match?.[1]) return null;

    return fetch(match[1]).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}
```

---

## Handling Images: Magic Bytes and WebP Conversion

Profile pictures come from user uploads, so they can be PNG, JPEG, or WebP depending on whatever device threw them at us. Satori is fine with data URIs for PNG and JPEG, but WebP is a no. So before deciding anything, we sniff the real format from the first 12 bytes:

```ts
function detectMime(buf: ArrayBuffer): string | null {
  const b = new Uint8Array(buf, 0, 12);
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47)
    return "image/png";
  if (b[0] === 0xff && b[1] === 0xd8) return "image/jpeg";
  const isRiff =
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46;
  const isWebp =
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  if (isRiff && isWebp) return "image/webp";
  return null;
}
```

Magic bytes beat `Content-Type` headers every time. Servers lie, bytes don't. If we genuinely can't read the format from the bytes (SVG, GIF), we fall back to the header.

If it's WebP, we transcode it through jSquash before handing it to Satori:

```ts
async function fetchAsDataUri(url: string): Promise<string | null> {
  const res = await fetch(url);
  if (!res.ok) return null;

  const buf = await res.arrayBuffer();
  const mime =
    detectMime(buf) ?? res.headers.get("content-type") ?? "image/png";

  if (mime === "image/webp") {
    const pngBuf = await webpToPng(buf);
    return `data:image/png;base64,${arrayBufferToBase64(pngBuf)}`;
  }

  return `data:${mime};base64,${arrayBufferToBase64(buf)}`;
}

async function webpToPng(buf: ArrayBuffer): Promise<ArrayBuffer> {
  const imageData = await decodeWebp(buf);
  return encodePng(imageData);
}
```

The whole thing returns `null` on failure. So if a profile picture can't be fetched or converted, the image still renders with a placeholder circle instead of blowing up.

---

## Building the Layout with Satori

As mentioned in their docs Satori supports JSX syntax, which makes it very straightforward to use. It can also take a plain JavaScript object that looks like JSX, and we wont need to bother about a transpiler at runtime.

```ts
function buildJsx(opts: {
  /* profile pictures data URIs, background, titles */
}) {
  return {
    // root div that fills the full canvas
    type: "div",
    props: {
      // styling
      style: {
        display: "flex",
        width: "100%",
        height: "100%",
        position: "relative",
      },
      // children can be any valid JSX element
      children: [
        /*  */
      ],
    },
  };
}
```

**All images are data URIs.** Satori can't fetch remote URLs, so everything has to be embedded as base64 before you hand the tree over.

---

## Satori → SVG → PNG

The actual render is two lines:

```ts
const svg = await satori(buildJsx({ ... }) as React.ReactNode, {
  width: 1200,
  height: 630,
  fonts: [{ name: 'Cairo', data: cairoFont, weight: 700 }],
});

const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
return resvg.render().asPng();
```

Satori spits out an SVG string. Resvg rasterizes it into pixels. The result is a `Uint8Array` that goes straight into the HTTP response body with `Content-Type: image/png`. Clean.

---

## Caching

The `cache` middleware from Hono uses Cloudflare's Cache API with a named cache and TTLs. The first request for a given ID eats the full generation cost, every request after that hits the cache and comes back instantly.

When a technician updates their profile picture, we can bust their cached image without waiting on the TTL:

```
DELETE /:id
x-secret-header: <your-secret>
```

The Worker rebuilds the exact URL that was cached and calls `cache.delete()` on it. Simple, and no external cache invalidation service required.

---

## Putting It Together

The full generation flow on a cache miss:

```
GET /42
  ├── fetching the background image           ─┐
  └── querying D1 for whatever data needed    ─┘ (parallel)
        │
        ├── initRuntime() (WASM modules)
        │
        └── generateOgPng()
              ├── fetch profile picture   ─┐
              ├── fetch service icon      ─┤ (parallel)
              └── fetch font              ─┘
                    │
                    ├── WebP → PNG conversion (if needed)
                    ├── satori(JSX) → SVG
                    └── resvg(SVG) → PNG
                          │
                    Response(png, { 'Content-Type': 'image/png' })
                    (stored in 'og-images' cache, 7-day TTL)
```

The whole thing is one Worker. No external image processing service, no queues, no separate rendering infrastructure. Cloudflare absorbs the cold-start cost, and the named cache means technician cards load fast after the first hit.

---

## Things Worth Knowing Before You Start

- **WASM adds to your bundle, fast.** Three WASM modules (resvg, webp decoder, png encoder) push the Worker bundle up a real amount. Keep an eye on the limit: a Worker can be up to **3 MB compressed on the Free plan** and **10 MB compressed on Paid** (64 MB uncompressed on either). On the free tier especially, you can run out of room quicker than you'd think.
- **Satori doesn't support all of CSS.** It's a subset, flexbox mostly works, but grid doesn't, and some gradient and layout features will quietly no-op on you. Build your layout incrementally and test as you go, don't assume.
- **Font loading on every cold start costs ~150ms** (in our setup). If you're sensitive to first-hit latency, consider bundling the font as a static asset instead of fetching from Google Fonts.
- **Data URI encoding is memory-hungry.** Base64 adds about a third of overhead (4 bytes out for every 3 in, so ~1.33× the raw byte count), and because JS strings are stored as UTF-16, the actual in-memory footprint of that string is bigger still. For a 400×400 profile picture it's fine, but push image sizes much higher and you can start brushing up against the Worker's 128 MB memory ceiling.

For our use case, technician profile cards that get regenerated occasionally and served cached, this setup is genuinely solid. The Worker is small, the dependencies are well-maintained, and the output looks exactly like we designed it.

<img src="https://h4ej7o5mx1.ufs.sh/f/hqvJtwAnNHr9xVXJJz01cOXkoC9zQdljqn5MsWyGEUeL86VR" alt="opengraph image" width="auto" height="400"/>
