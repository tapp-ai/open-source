import type { Plugin } from "vitepress";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {
  build,
  createServer,
  type UserConfig as ViteUserConfig,
  type ViteDevServer,
  type UserConfig,
} from "vite";

// TODO: Replace with import
const dist = path.join(import.meta.dirname, "..", "dist");

// https://regex101.com/r/roeve3/1
const CODE_GROUP_REGEX =
  /(?:^\s*?:::\scode-group\s+?preview\s*?)((?:^\s*```[^\s]+\s\[[^\]]+\]\s*?$.*?^\s*?```\s*?)+)(?:^\s*?:::\s*?$)/gms;

// https://regex101.com/r/DwMkgE/1
const FILE_REGEX =
  /(?:^\s*```[^\s]+\s\[([^\s\]]+)\]\s*$)\s*(?:(^.+?$))\s*(?:```)/gms;

const getTmpDir = (root: string) => {
  const tmpdir = path.join(root, ".vitepress", ".temp", ".previews");

  return tmpdir;
};

const generateHash = (id: string, index: number) => {
  const hash = crypto.createHash("md5");
  hash.update(`${id}-${index}`);
  return hash.digest("hex");
};

const generatePreview = async (
  id: string,
  index: number,
  codeGroup: string,
  root: string
) => {
  const previewId = generateHash(id, index);

  const tmpdir = getTmpDir(root);

  // Copy the template
  const preview = path.join(tmpdir, previewId);

  const template = path.join(
    root,
    ".vitepress",
    "preview",
    "templates",
    "react"
  );

  await fs.cp(template, preview, {
    recursive: true,
    force: true,
  });

  // Write the files
  const matches = codeGroup.matchAll(FILE_REGEX);

  for (const match of matches) {
    const file = match[1];
    const content = match[2];

    if (!file || !content) continue;

    const filePath = path.join(preview, "src", "Preview", file);

    await fs.writeFile(filePath, content.trim(), "utf-8");
  }

  return previewId;
};

const transform = async (
  previews: Record<string, string[]>,
  id: string,
  src: string,
  root: string
) => {
  if (!id.includes(".md")) return;

  // Remove the existing previews
  const existingPreviews = previews[id];

  if (existingPreviews) {
    for (const previewId of existingPreviews) {
      const tmpdir = getTmpDir(root);

      try {
        await fs.rm(path.join(tmpdir, previewId), {
          recursive: true,
          force: true,
        });
      } catch {
        // TODO: Error handling
      }
    }
  }

  // Add the new previews
  let content = src;

  const matches = content.matchAll(CODE_GROUP_REGEX);

  let index = 0;

  for (const match of matches) {
    try {
      const previewId = await generatePreview(id, index, match[0], root);

      previews[id] = previews[id] || [];
      previews[id].push(previewId);

      content = content.replace(
        match[0],
        `\n<Preview id="${previewId}" />\n${match[0]}`
      );

      index++;
    } catch {
      // TODO: Error handling
    }
  }

  if (content === src) return;

  return content;
};

const closeBundle = async (
  root: string,
  outDir: string,
  config?: ViteUserConfig
) => {
  try {
    const tmpdir = getTmpDir(root);

    const entries = await fs.readdir(tmpdir);

    await build({
      ...config,
      root: tmpdir,
      base: "/.previews/",
      build: {
        ...config?.build,
        emptyOutDir: true,
        outDir: path.join(outDir, ".previews"),
        rollupOptions: {
          ...config?.build?.rollupOptions,
          input: entries.reduce((acc, id) => {
            acc[id] = path.join(tmpdir, id, "index.html");
            return acc;
          }, {} as Record<string, string>),
        },
      },
    });

    await fs.rm(tmpdir, { recursive: true, force: true });
  } catch (error) {
    // TODO: Error handling
  }
};

const buildStart = async (root: string) => {
  try {
    const tmpdir = getTmpDir(root);

    await fs.rm(tmpdir, { recursive: true, force: true });
  } catch {
    // TODO: Error handling
  }
};

const configureServer = async (root: string, config?: ViteUserConfig) => {
  const tmpdir = getTmpDir(root);

  try {
    await fs.access(tmpdir);
  } catch {
    await fs.mkdir(tmpdir, { recursive: true });
  }

  const server = await createServer({
    ...config,
    root: tmpdir,
    server: {
      ...config?.server,
      port: 3002,
    },
  });

  await server.listen();

  return server;
};

export interface PreviewsPluginOptions {
  vite?: UserConfig;
}

export function PreviewsPlugin(options?: PreviewsPluginOptions): Plugin {
  let outDir: string;
  let root: string;
  let server: ViteDevServer | undefined;

  let previews: Record<string, string[]> = {};

  return {
    name: "vitepress-plugin-preview",
    enforce: "pre",

    async configResolved(config) {
      outDir = config.build.outDir;
      root = config.root;
    },

    async transform(src, id) {
      // https://github.com/emersonbottero/vitepress-plugin-mermaid/blob/main/src/mermaid-plugin.ts#L39
      if (id.includes("vitepress/dist/client/app/index.js")) {
        src = "\nimport Preview from '" + dist + "/Preview.vue';\n" + src;

        const lines = src.split("\n");

        const targetLineIndex = lines.findIndex((line) =>
          line.includes("app.component")
        );

        lines.splice(
          targetLineIndex,
          0,
          '  app.component("Preview", Preview);'
        );

        src = lines.join("\n");

        return {
          code: src,
          map: null,
        };
      }

      return await transform(previews, id, src, root);
    },

    async configureServer() {
      server = await configureServer(root, options?.vite);
    },

    async buildStart() {
      await buildStart(root);
    },

    async closeBundle() {
      await server?.close();
      return await closeBundle(root, outDir, options?.vite);
    },
  };
}
