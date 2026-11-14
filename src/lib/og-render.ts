import { readFile } from "node:fs/promises";
import path from "node:path";

import { SITE } from "@consts";
import { render } from "takumi-js";
import { container, text } from "takumi-js/helpers";

import { OG_DIMENSIONS } from "./og";
import type { OgCard } from "./og";

// Reuse local font bytes across every card in one build.
const fonts = Promise.all(
  [
    { variant: "regular", weight: 400 },
    { variant: "bold", weight: 700 },
  ].map(async ({ variant, weight }) => ({
    data: await readFile(path.resolve(`public/fonts/atkinson-${variant}.woff`)),
    name: "Atkinson",
    weight,
  }))
);

/** Renders a 1200 by 630 PNG using bundled fonts and no remote assets. */
export const renderOgCard = async (
  card: OgCard
): Promise<Uint8Array<ArrayBuffer>> => {
  let titleSize = 72;
  if (card.title.length > 85) {
    titleSize = 48;
  } else if (card.title.length > 55) {
    titleSize = 56;
  }
  return await render(
    container({
      children: [
        container({
          style: {
            backgroundImage: "linear-gradient(to bottom, #141414, #000000 18%)",
            border: "1px solid #303030",
            borderRadius: "50%",
            height: 1600,
            left: -200,
            position: "absolute",
            top: 390,
            width: 1600,
          },
        }),
        container({
          style: {
            border: "1px solid #252525",
            borderRadius: 16,
            inset: 24,
            position: "absolute",
          },
        }),
        text(card.label.toUpperCase(), {
          color: "#aaa",
          fontSize: 18,
          letterSpacing: 3,
          marginBottom: 30,
        }),
        text(card.title, {
          fontSize: titleSize,
          fontWeight: 700,
          lineHeight: 1.12,
          marginBottom: 24,
          maxHeight: 245,
          overflowWrap: "anywhere",
          textFit: "shrink",
        }),
        text(card.description, {
          color: "#aaa",
          fontSize: 26,
          lineHeight: 1.4,
          maxHeight: 110,
          maxWidth: 940,
          textFit: "shrink",
        }),
        container({
          children: (card.tags ?? []).slice(0, 4).map((tag) =>
            text(tag, {
              border: "1px solid #333",
              borderRadius: 8,
              color: "#aaa",
              fontSize: 16,
              padding: "6px 12px",
            })
          ),
          style: { display: "flex", gap: 12, marginTop: 22 },
        }),
        container({
          children: [text(SITE.AUTHOR), text("yousefelassal.com")],
          style: {
            bottom: 60,
            color: "#888",
            display: "flex",
            fontSize: 20,
            justifyContent: "space-between",
            left: 64,
            position: "absolute",
            right: 64,
          },
        }),
      ],
      style: {
        ...OG_DIMENSIONS,
        backgroundColor: "#000",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Atkinson",
        overflow: "hidden",
        padding: 64,
        position: "relative",
      },
    }),
    { ...OG_DIMENSIONS, emoji: "from-font", fonts: await fonts, format: "png" }
  );
};
