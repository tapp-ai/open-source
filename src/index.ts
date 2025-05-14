import { type UserConfig as VitePressUserConfig } from "vitepress";
import { type PreviewsPluginOptions, PreviewsPlugin } from "./plugin";

declare module "vitepress" {
  interface UserConfig {
    preview?: PreviewsPluginOptions;
  }
}

export const withPreviews = (
  config: VitePressUserConfig
): VitePressUserConfig => {
  const plugins = config.vite?.plugins ?? [];

  return {
    ...config,
    vite: {
      ...config.vite,
      plugins: [...plugins, PreviewsPlugin(config?.preview)],
    },
  };
};
