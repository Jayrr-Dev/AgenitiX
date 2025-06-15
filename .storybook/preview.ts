import type { Preview } from "@storybook/react";
import "../app/styles/_generated_tokens.css";
import "../app/styles/_globals.css";
import "../app/styles/entry.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    themes: {
      default: "dark",
      list: [
        { name: "dark", class: "dark", color: "#000000", default: true },
        { name: "light", class: "light", color: "#ffffff" },
      ],
    },
    options: {
      storySort: {
        order: ["Overview", "Design Tokens", "Guides"],
      },
    },
    viewport: {
      viewports: {
        mobile: {
          name: "Mobile",
          styles: { width: "375px", height: "667px" },
        },
        tablet: {
          name: "Tablet",
          styles: { width: "768px", height: "1024px" },
        },
        desktop: {
          name: "Desktop",
          styles: { width: "1280px", height: "800px" },
        },
      },
    },
  },
};

export default preview;
