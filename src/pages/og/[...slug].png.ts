import { OG_CARDS } from "@lib/og";
import type { OgCard } from "@lib/og";
import { renderOgCard } from "@lib/og-render";
import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";

export const prerender = true;

/** Enumerates section cards and published content using Astro's collection IDs. */
export const getStaticPaths = (async () => {
  const entries = [
    ...(await getCollection("blog")),
    ...(await getCollection("projects")),
  ];
  return [
    ...Object.entries(OG_CARDS).map(([slug, card]) => ({
      params: { slug },
      props: { card },
    })),
    ...entries
      .filter((entry) => !entry.data.draft)
      .map((entry) => ({
        params: { slug: `${entry.collection}/${entry.id}` },
        props: {
          card: {
            description: entry.data.summary,
            label: entry.collection === "blog" ? "Writing" : "Project",
            tags: entry.data.tags,
            title: entry.data.title,
          },
        },
      })),
  ];
}) satisfies GetStaticPaths;

interface Props {
  card: OgCard;
}

/** Astro runs this at build time and writes the response as a static PNG file. */
export const GET: APIRoute<Props> = async ({ props }) =>
  new Response(await renderOgCard(props.card), {
    headers: { "Content-Type": "image/png" },
  });
