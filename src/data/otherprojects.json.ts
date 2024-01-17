export interface Template {
  url: string;
  description: string;
  title: string;
};

const recipesApp: Template = {
  url: "https://recipe-app-six-rho.vercel.app/",
  description: "Experimenting with Sanity CMS.",
  title: "Recipes Headless CMS"
};
const library: Template = {
  url: "https://library-nine-blond.vercel.app/",
  description: "Add your favorite books to your library or search for new ones.",
  title: "Library"
};
const todoApp: Template = {
  url: "https://todo-iicr7kx4p-yousefelassal.vercel.app/",
  description: "Add tasks to your todo list and mark them as done.",
  title: "Todo App"
};
const roomfinder: Template = {
  url: "https://room-finder-beryl.vercel.app/",
  description: " A work in progress room finder for uni",
  title: "Room Finder"
};

export const byName = {
  recipesApp,
  library,
  todoApp,
  roomfinder,
};
export const otherprojects = Object.values(byName);
