import { type UserConfig as VitePressUserConfig } from "vitepress";
import PreviewPlugin, { type PreviewPluginOptions } from "./plugin";

declare module "vitepress" {
  interface UserConfig {
    preview?: PreviewPluginOptions;
  }
}

export const withPreview = (
  config: VitePressUserConfig
): VitePressUserConfig => {
  const plugins = config.vite?.plugins ?? [];

  return {
    ...config,
    vite: {
      ...config.vite,
      plugins: [...plugins, PreviewPlugin(config?.preview)],
    },
  };
};
