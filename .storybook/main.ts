import type { StorybookConfig } from "@storybook/nextjs";
import tsconfigPaths from "vite-tsconfig-paths";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(tsx|mdx)"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-themes",
    "@storybook/addon-a11y",
    "@storybook/addon-viewport",
  ],
  framework: {
    name: "@storybook/nextjs",
    options: {
      builder: { name: "@storybook/builder-vite" },
    },
  },
  docs: { autodocs: "tag" },
  viteFinal: async (config) => ({
    ...config,
    plugins: [...(config.plugins || []), tsconfigPaths()],
  }),
};
export default config;
