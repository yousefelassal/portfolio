import type { Site, Page, Links, Socials } from "@types";

// Global
export const SITE: Site = {
  AUTHOR: "Yousef Elassal",
  DESCRIPTION:
    "Full stack engineer and UI/UX designer building web products with TypeScript, Astro, and Cloudflare, plus writing, projects, and work history.",
  TITLE: "Yousef Elassal",
};

// Work Page
export const WORK: Page = {
  DESCRIPTION:
    "Roles, companies, and engineering work across full stack development and product design.",
  TITLE: "Work",
};

// Blog Page
export const BLOG: Page = {
  DESCRIPTION:
    "Long-form writing on TypeScript, Astro, Cloudflare Workers, UI/UX, and building web products.",
  TITLE: "Blog",
};

// Projects Page
export const PROJECTS: Page = {
  DESCRIPTION:
    "Personal projects built with TypeScript, Astro, React, and Cloudflare.",
  TITLE: "Projects",
};

// Search Page
export const SEARCH: Page = {
  DESCRIPTION: "Search writing and projects by keyword and tag.",
  TITLE: "Search",
};

// Links
export const LINKS: Links = [
  {
    HREF: "/",
    TEXT: "Home",
  },
  {
    HREF: "/work/",
    TEXT: "Work",
  },
  {
    HREF: "/blog/",
    TEXT: "Blog",
  },
  {
    HREF: "/projects/",
    TEXT: "Projects",
  },
];

// Socials
export const SOCIALS: Socials = [
  {
    HREF: "mailto:yousefelassal24@gmail.com",
    ICON: "email",
    NAME: "Email",
    TEXT: "yousefelassal24@gmail.com",
  },
  {
    HREF: "https://github.com/yousefelassal",
    ICON: "github",
    NAME: "Github",
    TEXT: "yousefelassal",
  },
  {
    HREF: "https://twitter.com/yousefalassal",
    ICON: "twitter-x",
    NAME: "Twitter",
    TEXT: "yousefalassal",
  },
];
