import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

const work = defineCollection({
  loader: glob({ base: "./src/content/work", pattern: "**/[^_]*.{md,mdx}" }),
  schema: z.object({
    company: z.string(),
    dateEnd: z.union([z.coerce.date(), z.string()]) || z.string(),
    dateStart: z.coerce.date(),
    role: z.string(),
  }),
});

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/[^_]*.{md,mdx}" }),
  schema: z.object({
    date: z.coerce.date(),
    draft: z.boolean().optional(),
    summary: z.string(),
    tags: z.array(z.string()),
    title: z.string(),
  }),
});

const projects = defineCollection({
  loader: glob({
    base: "./src/content/projects",
    pattern: "**/[^_]*.{md,mdx}",
  }),
  schema: z.object({
    appUrl: z.string().optional(),
    date: z.coerce.date(),
    demoUrl: z.string().optional(),
    draft: z.boolean().optional(),
    repoUrl: z.string().optional(),
    summary: z.string(),
    tags: z.array(z.string()),
    title: z.string(),
  }),
});

export const collections = {
  blog,
  projects,
  work,
};
