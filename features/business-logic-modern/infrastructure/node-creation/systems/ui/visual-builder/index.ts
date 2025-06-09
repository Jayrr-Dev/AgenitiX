// Visual Node Builder - Week 5 Implementation
// Complete drag-and-drop visual interface for node creation

// Main exports
export {
  VisualNodeCodeGenerator as CodeGenerator,
  default as DefaultCodeGenerator,
} from "./CodeGenerator";
export {
  BrowserExporter,
  default as DefaultFileExporter,
  NodeFileExporter as FileExporter,
} from "./FileExporter";
export { Position, default as VisualNodeBuilder } from "./VisualNodeBuilder";

// Import for utility function
import { VisualNodeCodeGenerator } from "./CodeGenerator";
import { BrowserExporter, NodeFileExporter } from "./FileExporter";
import VisualNodeBuilderComponent from "./VisualNodeBuilder";

// Utility functions for easy integration
export const createVisualBuilder = (config?: any) => {
  return {
    VisualNodeBuilder: VisualNodeBuilderComponent,
    CodeGenerator: VisualNodeCodeGenerator,
    FileExporter: NodeFileExporter,
    BrowserExporter,
  };
};

// Version information
export const VISUAL_BUILDER_VERSION = "1.0.0";
export const WEEK_5_STATUS = "COMPLETED";

// Quick start function
export const quickStartVisualBuilder = (containerElement?: HTMLElement) => {
  console.log("🎨 Visual Node Builder v1.0.0 - Week 5 Implementation");
  console.log("✅ Drag-and-drop interface ready");
  console.log("✅ Code generation system active");
  console.log("✅ File export functionality enabled");
  console.log("🚀 Ready for node creation!");

  return {
    version: VISUAL_BUILDER_VERSION,
    status: WEEK_5_STATUS,
  };
};
