import { type PreviewsPluginOptions, PreviewsPlugin } from "./plugin";

declare module "vitepress" {
  interface UserConfig {
    previews?: PreviewsPluginOptions;
  }
}

export const withPreviews = <T extends import("vitepress").UserConfig>(
  config: T
): T => {
  const plugins = config.vite?.plugins ?? [];

  return {
    ...config,
    vite: {
      ...config.vite,
      plugins: [...plugins, PreviewsPlugin(config?.previews)],
    },
  };
};
