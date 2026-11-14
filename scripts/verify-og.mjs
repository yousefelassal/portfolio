import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { parse } from "parse5";
import sharp from "sharp";

/**
 * @param {string} directory Root directory to search recursively.
 * @returns {Promise<string[]>} Paths to all files below the directory.
 */
const filesUnder = async (directory) => {
  const entries = await readdir(directory, {
    recursive: true,
    withFileTypes: true,
  });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name));
};

// Built pages preserve Astro's slug rules without duplicating its content loader.
const expected = new Set(["home", "blog", "projects", "work"]);
const ogFiles = await filesUnder("dist/og");
const images = ogFiles.filter((file) => file.endsWith(".png"));
await Promise.all(
  images.map(async (file) => {
    const metadata = await sharp(file).metadata();
    assert.equal(metadata.format, "png", file);
    assert.equal(metadata.width, 1200, file);
    assert.equal(metadata.height, 630, file);
  })
);

/**
 * @param {import("parse5").DefaultTreeAdapterMap["node"]} node Root of the parsed subtree.
 * @returns {Generator<import("parse5").DefaultTreeAdapterMap["node"]>} Subtree iterator in document order.
 * @yields {import("parse5").DefaultTreeAdapterMap["node"]} The root followed by its descendants.
 */
const walk = function* walk(node) {
  yield node;
  for (const child of node.childNodes ?? []) {
    yield* walk(child);
  }
};
const builtFiles = await filesUnder("dist");
const htmlFiles = builtFiles.filter((file) => file.endsWith(".html"));
await Promise.all(
  htmlFiles.map(async (file) => {
    const document = parse(await readFile(file, "utf-8"));
    const meta = new Map();
    const schemas = [];
    for (const node of walk(document)) {
      const attrs = new Map(
        (node.attrs ?? []).map(({ name, value }) => [name, value])
      );
      if (node.tagName === "meta") {
        meta.set(
          attrs.get("property") ?? attrs.get("name"),
          attrs.get("content")
        );
      }
      if (
        node.tagName === "script" &&
        attrs.get("type") === "application/ld+json"
      ) {
        schemas.push(
          JSON.parse(node.childNodes.map((child) => child.value ?? "").join(""))
        );
      }
    }
    const image = new URL(meta.get("og:image"));
    assert.equal(image.origin, new URL(meta.get("og:url")).origin, file);
    assert.ok(
      images.includes(path.join("dist", decodeURIComponent(image.pathname))),
      `Missing local image for ${file}`
    );
    assert.equal(meta.get("twitter:image"), image.href, file);
    assert.equal(meta.get("og:image:width"), "1200", file);
    assert.equal(meta.get("og:image:height"), "630", file);
    assert.ok(
      meta.get("og:image:alt")?.trim(),
      `Missing image alt text in ${file}`
    );
    assert.equal(meta.get("twitter:image:alt"), meta.get("og:image:alt"), file);
    const pathname = new URL(meta.get("og:url")).pathname.replaceAll(
      /^\/+|\/+$/gu,
      ""
    );
    const isContentPage = /^(?:blog|projects)\/.+/u.test(pathname);
    const slug = isContentPage || expected.has(pathname) ? pathname : "home";
    expected.add(slug);
    assert.equal(image.pathname, `/og/${slug}.png`, file);
    for (const schema of schemas.flat()) {
      if (["BlogPosting", "CreativeWork"].includes(schema["@type"])) {
        assert.equal(
          schema.image,
          image.href,
          `Structured data image mismatch in ${file}`
        );
      }
    }
  })
);
assert.deepEqual(
  new Set(
    images.map((file) => path.relative("dist/og", file).replace(/\.png$/u, ""))
  ),
  expected,
  "Card coverage differs from statically generated pages"
);
process.stdout.write(
  `Verified ${images.length} PNG cards and OG/Twitter metadata in ${htmlFiles.length} HTML pages.\n`
);
