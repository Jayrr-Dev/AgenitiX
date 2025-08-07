/**
 * WHY DID YOU RENDER - Performance debugging utility
 *
 * This file configures why-did-you-render to help identify components causing
 * maximum depth errors and unnecessary re-renders. It's only active in development.
 *
 * • Tracks component re-renders and their causes
 * • Identifies infinite loops and maximum depth errors
 * • Provides detailed render reason analysis
 * • Helps optimize React component performance
 *
 * Keywords: performance-debugging, render-optimization, infinite-loops, maximum-depth
 */

import whyDidYouRender from "@welldone-software/why-did-you-render";
import React from "react";

// Only enable in development mode
if (process.env.NODE_ENV === "development") {
  whyDidYouRender(React, {
    // Track all components by default
    trackAllPureComponents: true,

    // Track specific components that might cause issues
    trackHooks: true,

    // Log render reasons
    logOwnerReasons: true,

    // Customize what gets logged
    logOnDifferentValues: true,





    // Custom component filter - focus on problematic components
    include: [
      // Node components that might cause infinite loops
      /Node$/,
      /NodeWithDynamicSpec$/,
      /Scaffold/,

      // Flow editor components
      /FlowEditor/,
      /FlowCanvas/,
      /NodeInspector/,

      // Form components that might cause re-renders
      /Form/,
      /Input/,
      /Textarea/,

      // Hook-based components
      /useNodeData/,
      /useNodePlugins/,
    ],

    // Exclude components that are known to be stable
    exclude: [
      // Exclude basic UI components that are stable
      /Button/,
      /Icon/,
      /Loading/,
      /Toast/,

      // Exclude utility components
      /Provider/,
      /Wrapper/,
    ],
  });


}
