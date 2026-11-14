import { BLOG, PROJECTS, SITE, WORK } from "@consts";

/** Content rendered into a static card. Tags are shown in their supplied order. */
export interface OgCard {
  title: string;
  description: string;
  label: string;
  tags?: readonly string[];
}

export const OG_DIMENSIONS = { height: 630, width: 1200 } as const;

export const OG_CARDS = {
  blog: { description: BLOG.DESCRIPTION, label: "Writing", title: BLOG.TITLE },
  home: {
    description: SITE.DESCRIPTION,
    label: "Full Stack Engineer & UI/UX Designer",
    title: SITE.TITLE,
  },
  projects: {
    description: PROJECTS.DESCRIPTION,
    label: "Selected projects",
    title: PROJECTS.TITLE,
  },
  work: {
    description: WORK.DESCRIPTION,
    label: "Experience",
    title: WORK.TITLE,
  },
} satisfies Record<string, OgCard>;

/**
 * Maps a published page pathname to its build-generated PNG.
 * Utility pages share the homepage card. This does not check whether a page exists.
 */
export const ogImagePath = (pathname: string): string => {
  const path = pathname.replaceAll(/^\/+|\/+$/gu, "");
  if (Object.hasOwn(OG_CARDS, path)) {
    return `/og/${path}.png`;
  }
  if (path.startsWith("blog/") || path.startsWith("projects/")) {
    return `/og/${path}.png`;
  }
  return "/og/home.png";
};
