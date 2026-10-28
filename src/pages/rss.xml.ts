import rss from "@astrojs/rss";
import { SITE } from "@consts";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";

export const GET = async (context: APIContext) => {
  const { site } = context;
  if (!site) {
    throw new Error("`site` must be set in astro.config.mjs to build the feed");
  }

  const posts = await getCollection("blog");
  const projects = await getCollection("projects");

  const items = [
    ...posts
      .filter((entry) => !entry.data.draft)
      .map((entry) => ({ base: "/blog", entry })),
    ...projects
      .filter((entry) => !entry.data.draft)
      .map((entry) => ({ base: "/projects", entry })),
  ].toSorted(
    (a, b) => b.entry.data.date.getTime() - a.entry.data.date.getTime()
  );

  return rss({
    description: SITE.DESCRIPTION,
    items: items.map(({ base, entry }) => ({
      description: entry.data.summary,
      link: `${base}/${entry.id}/`,
      pubDate: entry.data.date,
      title: entry.data.title,
    })),
    site,
    title: SITE.TITLE,
  });
};
