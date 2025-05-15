import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { build, createServer } from "vite";

// https://regex101.com/r/roeve3/4
const CODE_GROUP_REGEX =
  /(?:^\s*?:::\scode-group\s+?preview(?:\(([^)]*)\))?\s*?)((?:^\s*```[^\s]+\s\[[^\]]+\]\s*?$.*?^\s*?```\s*?)+)(?:^\s*?:::\s*?$)/gms;

// https://regex101.com/r/DwMkgE/1
const FILE_REGEX =
  /(?:^\s*```[^\s]+\s\[([^\s\]]+)\]\s*$)\s*(?:(^.+?$))\s*(?:```)/gms;

const getPluginDir = (root: string) => {
  const pluginDir = path.join(root, ".vitepress", ".previews");
  return pluginDir;
};

const getTmpDir = (root: string) => {
  const tmpdir = path.join(getPluginDir(root), "cache");
  return tmpdir;
};

const getTemplatesDir = (root: string) => {
  const templatesDir = path.join(getPluginDir(root), "templates");
  return templatesDir;
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
  root: string,
  template?: string
) => {
  const previewId = generateHash(id, index);

  const tmpdir = getTmpDir(root);

  // Copy the template
  const previewDir = path.join(tmpdir, previewId);

  if (template) {
    const templateDir = path.join(getTemplatesDir(root), template);

    try {
      await fs.cp(templateDir, previewDir, {
        recursive: true,
        force: true,
      });
    } catch {
      // TODO: Error handling
    }
  }

  // Write the files
  const matches = codeGroup.matchAll(FILE_REGEX);

  for (const match of matches) {
    const file = match[1];
    const content = match[2];

    if (!file || !content) continue;

    const filePath = path.join(previewDir, file);

    await fs.writeFile(filePath, content.trim(), "utf-8");
  }

  return previewId;
};

const transform = async (
  previews: Record<string, string[]>,
  id: string,
  src: string,
  root: string,
  {
    server,
    options,
  }: { server?: import("vite").ViteDevServer; options?: PreviewsPluginOptions }
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
      const previewId = await generatePreview(
        id,
        index,
        match[2] as string,
        root,
        match[1]?.trim() || options?.defaultTemplate
      );

      previews[id] = previews[id] || [];
      previews[id].push(previewId);

      // Construct the preview component
      let component = `<Preview id="${previewId}"`;
      if (server) component += ` port="${server.config.server.port}"`;
      component += " />";

      // Inject the preview component
      content = content.replace(match[0], `\n${component}\n${match[0]}`);

      index++;
    } catch {
      // TODO: Error handling
    }
  }

  // TODO: Remove any previews that no longer exist

  if (content === src) return;

  return content;
};

const closeBundle = async (
  root: string,
  outDir: string,
  config?: import("vite").UserConfig
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

const configureServer = async (
  root: string,
  config?: import("vite").UserConfig
) => {
  const tmpdir = getTmpDir(root);

  try {
    await fs.access(tmpdir);
  } catch {
    await fs.mkdir(tmpdir, { recursive: true });
  }

  const server = await createServer({
    ...config,
    root: tmpdir,
  });

  await server.listen();

  return server;
};

export interface PreviewsPluginOptions {
  vite?: import("vite").UserConfig;
  defaultTemplate?: string;
}

export function PreviewsPlugin(
  options?: PreviewsPluginOptions
): import("vite").Plugin {
  let outDir: string;
  let root: string;
  let server: import("vite").ViteDevServer | undefined;
  let port: number | undefined;

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
        src =
          "\nimport Preview from 'vitepress-plugin-previews/Preview.vue';\n" +
          src;

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

      return await transform(previews, id, src, root, { options, server });
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
