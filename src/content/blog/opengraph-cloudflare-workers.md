---
title: "Dynamic OG Images on the Edge with Takumi and Cloudflare Workers"
summary: "How we replaced Satori, Resvg, and jSquash with one Rust rendering engine behind a Cloudflare Worker."
date: "May 10 2026"
draft: false
tags:
  - Cloudflare Workers
  - Takumi
  - Hono
---

Every time someone shares a link, the platform fetches a 1200×630 preview. That rectangle either makes people click or scroll past. For [Daleely](https://daleely.co), it has to show the actual technician: their face, their name, and the service they offer. No logo wall, no generic template.

So we render it on demand in a Cloudflare Worker. The current version is a lot smaller than the one this post used to describe.

---

## The Stack

The first pass chained three libraries together. Satori turned JSX into SVG, Resvg rasterized it through WebAssembly, and jSquash converted profile pictures out of WebP. Running that on Workers meant initializing three WASM modules, patching a missing `ImageData` global, spoofing an old Safari user agent to get TTF fonts from Google, and sniffing magic bytes so we could transcode images by hand.

Now it's [Takumi](https://takumi.kane.tw), a Rust rendering engine that takes JSX and returns an encoded image. On Workers it compiles to one WASM module, and its `ImageResponse` is a drop-in for `next/og` with a different import:

```ts
import { ImageResponse } from "takumi-js/response";
```

Hono still handles the routes and Cloudflare's cache. Drizzle still reads the technician out of D1. Everything else in that list is gone.

---

## The Entry Point

The Worker exposes two routes that matter:

```ts
.get(
  "/:id",
  cache({ cacheName: "og-images", cacheControl: "public, max-age=604800" }),
  async (c) => {
    const id = c.req.param("id");

    // validate id and do whatever database lookup is needed

    // generate and return the PNG
    return generateOgPng({ /*  */ });
  }
)
```

`generateOgPng` returns an `ImageResponse`, which extends the web `Response`. The route hands it straight back to the client. No buffer, no content-type header, no `initRuntime()`.

The second route purges a cached card. When a technician swaps their photo, we don't want to wait out the seven-day TTL:

```ts
.delete("/:id", devToolsGuard, async (c) => {
  const url = new URL(c.req.url);
  url.pathname = `/${c.req.param("id")}`;

  const cache = await caches.open("og-images");
  const deleted = await cache.delete(url.toString());

  if (!deleted) throw newHTTPException(404, "Cache entry not found");

  return c.json({ success: true, purged: url.toString() });
})
```

`devToolsGuard` checks a secret header before anything runs.

---

## The Template Is Just JSX

The card lives in a `.tsx` file as a normal React component. Takumi reads a `tw` prop for Tailwind classes, so the layout stays readable instead of turning into a tree of style objects:

```tsx
function OpenGraphComponent(props: OpenGraphComponentProps) {
  return <div tw="flex w-full h-full relative">{/* whatever */}</div>;
}
```

Two details matter when you come from a Satori template. A bare `<div>` lays out as a block, the way it does in a browser, so every container that needs flexbox says so. And images are plain URLs. Takumi fetches them during the render and decodes the bytes itself, no need for a WebP transcoder.

Takumi runs the Unicode Bidirectional Algorithm, so mixed Arabic and Latin text orders correctly, where Satori was only partial.

---

## Fonts Are One Line

Loading a font looks like this:

```ts
import { googleFonts } from "takumi-js/helpers";

const fonts = googleFonts(["Cairo"]);
```

`googleFonts` makes a single request to the Google Fonts CSS API, then registers every `unicode-range` subset the family ships. Takumi downloads only the subsets the card actually uses, and it takes WOFF2 directly. No user-agent workaround, no TTF parsing, and no font bytes to smuggle through the bundle.

---

## The Render

The whole generation function is a component plus its options:

```tsx
export async function generateOgPng(
  opts: OgImageOptions
): Promise<ImageResponse> {
  return new ImageResponse(<OpenGraphComponent />, {
    width: 1200,
    height: 630,
    fonts: googleFonts(["Cairo"]),
  });
}
```

Takumi lays out the JSX, shapes the text, decodes the images, and encodes the PNG. There is no SVG string in the middle.

---

## Putting It Together

A cache miss looks like this:

```
GET /42
  ├── D1 query for user + service       (Drizzle)
  ├── build avatar and icon URLs
  └── generateOgPng()
        ├── fetch background, avatar, icon    (parallel)
        ├── load Cairo unicode-range subsets
        └── JSX → PNG
  Response(image/png, cached for 7 days)
```

The next request for `/42` never reaches the renderer. Cloudflare's cache answers it, and the `DELETE` route exists for the one case where the data changes inside the TTL.

---

## Things Worth Knowing

- **The WASM budget still exists.** Takumi ships a single module instead of three, but Workers still cap you at 3 MB compressed on Free and 10 MB on Paid (64 MB uncompressed on either). Check the bundle before you add more fonts or libraries.
- **`display: block` is the default.** If you port a `next/og` template, add `flex` to every container that leaned on the implicit flexbox. The output will not match until you do.
- **Remote fetches block the render.** A cache miss waits on your background and avatar URLs. Keep those assets small, set `images.allowUrl` if a URL can come from user input, and remember that one failed fetch rejects the whole render unless you set `throwOnError: false`.
- **Fonts are still an HTTP dependency at render time.** `googleFonts` is convenient, not free. If first-hit latency matters, bundle Cairo as a static asset or register it on a shared `Renderer`.

For a technician card that gets regenerated when someone edits their profile and served from cache the rest of the time, this is the right shape. One Worker, one rendering dependency, and a template that reads like the rest of the app.

<img src="https://h4ej7o5mx1.ufs.sh/f/hqvJtwAnNHr9xVXJJz01cOXkoC9zQdljqn5MsWyGEUeL86VR" alt="opengraph image" width="auto" height="400"/>
