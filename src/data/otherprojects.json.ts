export interface Template {
  url: string;
  description: string;
  title: string;
};

const library: Template = {
  url: "https://library-nine-blond.vercel.app/",
  description: "Add your favorite books to your library or search for new ones.",
  title: "Library"
};
const spotifyclone: Template = {
  url: "https://github.com/yousefelassal/spotify-clone",
  description: "A work in progress Spotify clone",
  title: "Spotify Clone"
};
const roomfinder: Template = {
  url: "https://room-finder-beryl.vercel.app/",
  description: " A work in progress room finder for uni",
  title: "Room Finder"
};

export const byName = {

  library,
  spotifyclone,
  roomfinder,


};
export const otherprojects = Object.values(byName);
