import rss from "@astrojs/rss";
import { SITE } from "@consts";
import { getCollection } from "astro:content";

interface Context {
  site: string;
}

interface Entry {
  data: {
    title: string;
    summary: string;
    date: Date;
  };
  slug: string;
}

export async function GET(context: Context) {
  const posts = await getCollection("blog");
  const projects = await getCollection("projects");

  const items = [...posts, ...projects];

  items.sort(
    (a: Entry, b: Entry) =>
      new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
  );

  return rss({
    description: SITE.DESCRIPTION,
    items: items.map((item: Entry) => ({
      description: item.data.summary,
      link: item.id.startsWith("blog")
        ? `/blog/${item.id}/`
        : `/projects/${item.id}/`,
      pubDate: item.data.date,
      title: item.data.title,
    })),
    site: context.site,
    title: SITE.TITLE,
  });
}
