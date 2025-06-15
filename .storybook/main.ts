// Explicit StorybookConfig typing removed for simplicity; avoids strict builder typing mismatch
// @ts-ignore - vite react plugin has no typed declaration yet
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";

const config = {
  stories: ["../stories/**/*.stories.@(tsx|mdx)"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-themes",
    "@storybook/addon-a11y",
    "@storybook/addon-viewport",
  ],
  // Ensure Vite is the builder to avoid Webpack-specific missing module issues
  core: { builder: "@storybook/builder-vite" },
  framework: {
    name: "@storybook/nextjs",
    options: {
      // Builder also specified here for redundancy with older Storybook versions
      builder: { name: "@storybook/builder-vite" },
    },
  },
  docs: { autodocs: "tag" },
  viteFinal: async (config) => ({
    ...config,
    define: {
      ...(config.define || {}),
      // Polyfill minimal process env for Next.js modules used in Storybook
      "process.env": {},
    },
    plugins: [...(config.plugins || []), tsconfigPaths(), react()],
  }),
};
export default config;
