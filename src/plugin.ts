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

const generatePreview = async (codeGroup: string, root: string) => {
  const id = crypto.randomUUID();

  const tmpdir = getTmpDir(root);

  // Copy the template
  const preview = path.join(tmpdir, id);

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

  return id;
};

const load = async (fileId: string, root: string) => {
  const ext = path.extname(fileId);
  if (ext !== ".md") return;

  let original: string;

  try {
    original = await fs.readFile(fileId, "utf-8");
  } catch {
    return;
  }

  let content = original;

  const matches = content.matchAll(CODE_GROUP_REGEX);

  for (const match of matches) {
    const previewId = await generatePreview(match[0], root);

    content = content.replace(
      match[0],
      `\n<Preview id="${previewId}" />\n${match[0]}`
    );
  }

  if (content === original) return;

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
    console.log(error);
  }
};

const buildStart = async (root: string) => {
  try {
    const tmpdir = getTmpDir(root);

    await fs.rm(tmpdir, { recursive: true, force: true });
  } catch {
    // Ignore error
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

export interface PreviewPluginOptions {
  vite?: UserConfig;
}

export default function PreviewPlugin(options?: PreviewPluginOptions): Plugin {
  let outDir: string;
  let root: string;
  let server: ViteDevServer | undefined;

  return {
    name: "vitepress-plugin-preview",
    enforce: "post",

    async configResolved(config) {
      outDir = config.build.outDir;
      root = config.root;
    },

    transform(src, id) {
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
    },

    async configureServer() {
      server = await configureServer(root, options?.vite);
    },

    async buildStart() {
      if (outDir.includes(".temp")) return;
      await buildStart(root);
    },

    async closeBundle() {
      await server?.close();
      if (outDir.includes(".temp")) return;
      return await closeBundle(root, outDir, options?.vite);
    },

    async load(id) {
      if (outDir.includes(".temp")) return;
      return await load(id, root);
    },
  };
}
