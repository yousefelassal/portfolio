import type { Site, Page, Links, Socials } from "@types";

// Global
export const SITE: Site = {
  AUTHOR: "Yousef Elassal",
  DESCRIPTION: "Welcome to my portfolio.",
  TITLE: "Yousef",
};

// Work Page
export const WORK: Page = {
  DESCRIPTION: "Places I have worked.",
  TITLE: "Work",
};

// Blog Page
export const BLOG: Page = {
  DESCRIPTION: "Writing on topics I am passionate about.",
  TITLE: "Blog",
};

// Projects Page
export const PROJECTS: Page = {
  DESCRIPTION: "Recent personal projects I have worked on.",
  TITLE: "Projects",
};

// Search Page
export const SEARCH: Page = {
  DESCRIPTION: "Search all posts and projects by keyword.",
  TITLE: "Search",
};

// Links
export const LINKS: Links = [
  {
    HREF: "/",
    TEXT: "Home",
  },
  {
    HREF: "/work",
    TEXT: "Work",
  },
  {
    HREF: "/blog",
    TEXT: "Blog",
  },
  {
    HREF: "/projects",
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
