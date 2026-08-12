import { defineConfig } from "oxlint";
import astro from "ultracite/oxlint/astro";
import core from "ultracite/oxlint/core";
import solid from "ultracite/oxlint/solid";

export default defineConfig({
  extends: [core, astro, solid],
  ignorePatterns: core.ignorePatterns,
});
