import { build } from "tsup";
import { cp } from "node:fs/promises";
import path from "node:path";

const dist = path.join(import.meta.dir, "..", "dist");
const src = path.join(import.meta.dir, "..", "src");

await cp(path.join(src, "Preview.vue"), path.join(dist, "Preview.vue"), {
  recursive: true,
  force: true,
});

await build({
  entryPoints: [path.join(src, "index.ts")],
  minify: true,
  format: "esm",
  outDir: dist,
  external: ["vitepress", "vite"],
  dts: true,
});
