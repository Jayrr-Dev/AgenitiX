import { ReactFlowProvider } from "@xyflow/react";
import dynamic from "next/dynamic";

// Sidebar imports Next's dynamic modules; use next/dynamic to avoid SSR warnings
// eslint-disable-next-line import/no-relative-parent-imports
const Sidebar = dynamic(
  () =>
    import("../features/business-logic-modern/infrastructure/sidebar/Sidebar"),
  { ssr: false }
);

export default {
  title: "Components/Sidebar/Preview",
  parameters: { layout: "fullscreen" },
};

export const DefaultSidebar = () => (
  <ReactFlowProvider>
    <div className="h-screen w-72 bg-[hsl(var(--infra-sidebar-bg))]">
      <Sidebar />
    </div>
  </ReactFlowProvider>
);
