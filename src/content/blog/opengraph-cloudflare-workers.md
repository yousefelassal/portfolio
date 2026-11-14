---
title: "Build Open Graph Images with Takumi and Cloudflare Workers"
summary: "A practical guide to creating personalized link previews with Takumi, caching them on Cloudflare Workers, and generating static cards for a blog or portfolio."
date: "May 10 2026"
draft: false
tags:
  - Cloudflare Workers
  - Takumi
  - Hono
---

When you share a link, the preview is often the first thing someone sees. A card with the page's title and a familiar design gives them a little context before they open it.

On [Daleely](https://daleely.co), we use that space to introduce a technician. The preview shows their photo, name, and service, just like their profile does. We generate those images with [Takumi](https://takumi.kane.tw), which turns a layout into an image without a browser.

Let's build a small version together. We'll create a card, return it from a Cloudflare Worker, and connect it to a page. If you're building a blog or portfolio, there's a build-time option too. The portfolio you're reading right now uses that approach.

## Start with a card you can render

This example assumes you already have a [Hono app running on Cloudflare Workers](https://hono.dev/docs/getting-started/cloudflare-workers). We'll use React JSX to describe the image, so add Takumi and React to that project:

```sh
bun add takumi-js react
bun add -d @types/react
```

Takumi uses WebAssembly on Workers. Its [getting started guide](https://takumi.kane.tw/docs) also covers the native backend used by Node.js and Bun.

Create an `og.tsx` file. Start with a name and a service so you can check the layout before adding profile photos or database queries:

```tsx
/** @jsxRuntime automatic */
/** @jsxImportSource react */
import { ImageResponse } from "takumi-js/response";
import { googleFonts } from "takumi-js/helpers";

type ProfileCard = {
  name: string;
  service: string;
};

export function generateOgPng(profile: ProfileCard): ImageResponse {
  return new ImageResponse(
    <div
      tw="flex flex-col justify-center w-full h-full p-16 bg-white"
      style={{ fontFamily: "Cairo" }}
    >
      <div tw="text-2xl text-gray-500">Meet your technician</div>
      <div tw="mt-6 text-6xl font-bold text-black">{profile.name}</div>
      <div tw="mt-4 text-3xl text-gray-600">{profile.service}</div>
    </div>,
    { width: 1200, height: 630, fonts: googleFonts(["Cairo"]) }
  );
}
```

The JSX pragmas enable React's automatic JSX runtime for this file. Takumi reads the JSX to produce an image; the card doesn't need client-side React.

The card uses inline styles, much like a React component in a web app. Set `display: "flex"` on containers that need flexbox, because a plain `div` uses block layout. Here, `flexDirection: "column"` stacks the label, name, and service inside a 1200×630 canvas.

We're loading Cairo with the `googleFonts` helper. If your cards contain Arabic, choose a font with Arabic glyphs. Takumi supports bidirectional text, which is useful when a name or service mixes Arabic and Latin characters. You can also load font bytes from local assets, as described in the [font guide](https://takumi.kane.tw/docs/fonts).

## Return the image from your Worker

In your Hono entry point, import the renderer and add a preview route:

```ts
import { Hono } from "hono";
import { generateOgPng } from "./og";

const app = new Hono();

app.get("/preview", () =>
  generateOgPng({ name: "Adel Shakal", service: "Air conditioning repair" })
);

export default app;
```

Start your Worker's development server and open `/preview`. You should see a white card with Ahmed's name and service. `ImageResponse` extends the web `Response`, so Hono can return it directly with the image content type already set.

Once that works, replace the sample data with a profile lookup. On Daleely, Drizzle reads the technician and service from D1. A profile ID in the image URL tells the Worker which card to render. Validate that ID and return a 404 when the profile doesn't exist.

You can then add a profile photo to the template. Keep the layout recognizable at preview size and test a long name before settling on the font size. If image URLs come from users, restrict which URLs the renderer may fetch. Takumi's [image-loading guide](https://takumi.kane.tw/docs/images) covers those controls.

## Cache cards between requests

Rendering the same profile on every request is unnecessary. Add Hono's cache middleware before the handler:

```ts
import { cache } from "hono/cache";

app.get(
  "/preview",
  cache({
    cacheName: "og-images",
    cacheControl: "public, max-age=604800",
  }),
  () =>
    generateOgPng({ name: "Adel Shakal", service: "Air conditioning repair" })
);
```

Replace the earlier route with this one. It allows the response to stay cached for seven days. In production, each profile needs its own image URL so the cache can distinguish the cards.

On a cache miss, the Worker loads the profile and renders the image. Later requests can use the cached response. Check the [Hono cache documentation](https://hono.dev/docs/middleware/builtin/cache) when testing deployment, since its Cloudflare support requires a custom domain.

When a technician changes their profile, clear the matching cached image or use a new image URL with a profile revision in it. Protect any cache-clearing endpoint with authentication. Social platforms may keep their own copy of the preview too, so clearing the Worker's cache alone doesn't force every platform to refresh.

## Tell the page where its preview lives

An image endpoint needs a link from the page's HTML. Set `og:image` and `twitter:image` to the absolute, public URL of the card. For example, a deployed version of our preview route could use these tags:

```html
<meta property="og:image" content="https://og.example.com/preview" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta
  property="og:image:alt"
  content="Adel Shakal, air conditioning technician"
/>
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://og.example.com/preview" />
<meta
  name="twitter:image:alt"
  content="Adel Shakal, air conditioning technician"
/>
```

Replace the example domain with yours and keep the page's title and description metadata in place. The image URL must return the image without a login. If you publish article structured data, give its image property the same relevant image URL.

Before sharing the page, open the image URL directly and inspect the page's generated HTML. Check that the URL, dimensions, and alt text describe the card you actually generated.

## Generate static images for a blog or portfolio

For a blog, portfolio, or documentation site, the content often changes when you publish a new build. You can generate the cards at that point too.

A build script can read your published pages, pass each page's title and description to a shared Takumi template, and write the resulting PNG bytes to the site's output directory. Takumi's `render` API returns those bytes. Give each page a predictable image path, then use that path in its metadata. Run the script as part of your build so content and images are published together.

There's no need for an image server in this setup. When someone shares a page, the platform fetches a PNG that already exists. Editing a title or changing the card design means rebuilding and deploying the site.

This portfolio uses that same build-time approach through an Astro prerendered endpoint. During `astro build`, it reads the published blog posts and projects, renders their cards, and writes static PNGs alongside the site. It also generates cards for the homepage and main sections. The endpoint runs during the build, not when someone requests an image.

If your project doesn't have prerendered endpoints, a build script gives you the same result. Keep fonts and other required assets local when possible, skip drafts, and check long titles before publishing.

For Daleely, on-demand rendering lets profile changes reach the renderer without rebuilding the whole app. For this portfolio, rendering during the build fits how the content is published. You can use the same card design either way and choose when to generate it based on how your content changes.

Here's one of Daleely's technician previews featuring el gayar the cat:

<img src="https://h4ej7o5mx1.ufs.sh/f/hqvJtwAnNHr9xVXJJz01cOXkoC9zQdljqn5MsWyGEUeL86VR" alt="Daleely link preview with a technician's photo, name, and service" width="auto" height="400"/>
