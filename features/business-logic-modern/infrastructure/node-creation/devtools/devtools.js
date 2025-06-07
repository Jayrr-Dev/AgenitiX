// V2U DevTools Extension - Main DevTools Script
// This script creates the V2U panel in Chrome DevTools

chrome.devtools.panels.create(
  "V2U Nodes",
  "icons/icon32.png",
  "panel.html",
  (panel) => {
    console.log("[V2U DevTools] Panel created successfully");

    // Track panel visibility for performance optimization
    let isVisible = false;

    panel.onShown.addListener((window) => {
      console.log("[V2U DevTools] Panel shown");
      isVisible = true;

      // Initialize the panel when first shown
      if (window.initializeV2UPanel) {
        window.initializeV2UPanel();
      }
    });

    panel.onHidden.addListener(() => {
      console.log("[V2U DevTools] Panel hidden");
      isVisible = false;

      // Cleanup when panel is hidden to save resources
      if (window.cleanupV2UPanel) {
        window.cleanupV2UPanel();
      }
    });
  }
);

// Add a sidebar pane for quick node information
chrome.devtools.panels.elements.createSidebarPane(
  "V2U Node Info",
  (sidebar) => {
    console.log("[V2U DevTools] Sidebar pane created");

    // Update sidebar when element selection changes
    chrome.devtools.panels.elements.onSelectionChanged.addListener(() => {
      // Evaluate expression to get node information from selected element
      chrome.devtools.inspectedWindow.eval(
        `
        (() => {
          const element = $0;
          if (!element) return null;

          // Look for V2U node data in the DOM
          const nodeData = element.closest('[data-v2u-node]');
          if (!nodeData) return null;

          return {
            nodeType: nodeData.getAttribute('data-v2u-node'),
            nodeId: nodeData.getAttribute('data-node-id'),
            category: nodeData.getAttribute('data-category'),
            version: nodeData.getAttribute('data-version'),
            performance: nodeData.getAttribute('data-performance'),
            status: nodeData.getAttribute('data-status')
          };
        })()
        `,
        (result, isException) => {
          if (isException) {
            console.error(
              "[V2U DevTools] Error evaluating node info:",
              isException
            );
            return;
          }

          if (result) {
            sidebar.setObject(result, "V2U Node Information");
          } else {
            sidebar.setExpression("null", "No V2U node selected");
          }
        }
      );
    });
  }
);

// Console API for advanced debugging
chrome.devtools.panels.console.onMessageAdded.addListener((message) => {
  // Filter and enhance V2U-related console messages
  if (message.text && message.text.includes("[V2U]")) {
    console.log("[V2U DevTools] Enhanced console message:", message);
  }
});

console.log("[V2U DevTools] DevTools extension initialized successfully");
