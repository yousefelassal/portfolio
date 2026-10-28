import { SITE, SOCIALS } from "@consts";
import type { CollectionEntry } from "astro:content";

export interface SeoProps {
  title: string;
  description: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: Date;
  modifiedTime?: Date;
  tags?: string[];
  noindex?: boolean;
  schema?: Record<string, unknown> | Record<string, unknown>[];
}

export const OG_IMAGE = {
  height: 480,
  path: "/open-graph.jpg",
  width: 960,
} as const;

const PERSON_ID = (site: URL) => `${site.href}#person`;
const WEBSITE_ID = (site: URL) => `${site.href}#website`;

const KNOWS_ABOUT = [
  "TypeScript",
  "Astro",
  "Cloudflare Workers",
  "React",
  "Node.js",
  "UI/UX Design",
  "Web Performance",
];

export const buildPageTitle = (title: string): string =>
  title === SITE.TITLE ? title : `${title} | ${SITE.TITLE}`;

export const absoluteUrl = (path: string, site: URL | undefined): string => {
  if (!site) {
    throw new Error("`site` must be set in astro.config.mjs to build URLs");
  }

  return new URL(path, site).href;
};

export const personSchema = (site: URL): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@id": PERSON_ID(site),
  "@type": "Person",
  description: SITE.DESCRIPTION,
  jobTitle: "Full Stack Engineer",
  knowsAbout: KNOWS_ABOUT,
  name: SITE.AUTHOR,
  sameAs: SOCIALS.filter(({ HREF }) => HREF.startsWith("https://")).map(
    ({ HREF }) => HREF
  ),
  url: site.href,
});

export const websiteSchema = (site: URL): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@id": WEBSITE_ID(site),
  "@type": "WebSite",
  description: SITE.DESCRIPTION,
  inLanguage: "en",
  name: SITE.TITLE,
  publisher: {
    "@id": PERSON_ID(site),
  },
  url: site.href,
});

export const articleSchema = (
  entry: CollectionEntry<"blog"> | CollectionEntry<"projects">,
  site: URL
): Record<string, unknown> => {
  const url = absoluteUrl(`/${entry.collection}/${entry.id}/`, site);
  const isBlogPost = entry.collection === "blog";

  return {
    "@context": "https://schema.org",
    "@id": `${url}#article`,
    "@type": isBlogPost ? "BlogPosting" : "CreativeWork",
    author: {
      "@id": PERSON_ID(site),
    },
    dateModified: entry.data.date.toISOString(),
    datePublished: entry.data.date.toISOString(),
    description: entry.data.summary,
    headline: entry.data.title,
    image: new URL(OG_IMAGE.path, site).href,
    inLanguage: "en",
    isPartOf: {
      "@id": WEBSITE_ID(site),
    },
    keywords: entry.data.tags,
    mainEntityOfPage: {
      "@id": url,
      "@type": "WebPage",
    },
    name: entry.data.title,
    publisher: {
      "@id": PERSON_ID(site),
    },
    url,
  };
};

export const breadcrumbSchema = (
  items: { name: string; path: string }[],
  site: URL
): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    item: absoluteUrl(item.path, site),
    name: item.name,
    position: index + 1,
  })),
});

export const toJsonLd = (
  schema: Record<string, unknown> | Record<string, unknown>[]
): string => JSON.stringify(schema).replaceAll("<", "\\u003c");

export const normalizeSchema = (
  schema: SeoProps["schema"]
): Record<string, unknown>[] => {
  if (!schema) {
    return [];
  }

  return Array.isArray(schema) ? schema : [schema];
};
