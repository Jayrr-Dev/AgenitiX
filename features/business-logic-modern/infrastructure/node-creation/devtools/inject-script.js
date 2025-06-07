// V2U DevTools Inject Script
// Runs in the host application context to access V2U data

(function () {
  "use strict";

  console.log("[V2U DevTools] Inject script loaded");

  class V2UBridge {
    constructor() {
      this.isInitialized = false;
      this.registryRef = null;
      this.performanceMonitor = null;
      this.eventListeners = [];

      this.init();
    }

    init() {
      console.log("[V2U DevTools] Initializing V2U bridge");

      // Wait for V2U system to be available
      this.waitForV2USystem();

      // Listen for requests from content script
      window.addEventListener(
        "message",
        this.handleContentScriptMessage.bind(this)
      );
    }

    // Wait for V2U node system to be available
    waitForV2USystem() {
      const checkInterval = setInterval(() => {
        // Check for various possible V2U global references
        const v2uSystem =
          window.V2U ||
          window.nodeRegistry ||
          window.defineNode ||
          this.findV2UInGlobal();

        if (v2uSystem) {
          console.log("[V2U DevTools] V2U system found:", v2uSystem);
          clearInterval(checkInterval);
          this.connectToV2USystem(v2uSystem);
        }
      }, 1000);

      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!this.isInitialized) {
          console.warn("[V2U DevTools] V2U system not found after 30 seconds");
          this.setupMockData();
        }
      }, 30000);
    }

    // Try to find V2U system in global scope
    findV2UInGlobal() {
      // Look for React DevTools or common patterns
      if (
        window.React &&
        window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
      ) {
        // Try to find V2U components in React fiber tree
        return this.findV2UInReact();
      }

      // Look for common V2U patterns in window
      const keys = Object.keys(window);
      for (const key of keys) {
        if (
          key.includes("node") ||
          key.includes("registry") ||
          key.includes("v2u")
        ) {
          const obj = window[key];
          if (obj && typeof obj === "object" && this.looksLikeV2USystem(obj)) {
            return obj;
          }
        }
      }

      return null;
    }

    // Check if object looks like V2U system
    looksLikeV2USystem(obj) {
      return (
        obj &&
        (obj.nodeRegistry ||
          obj.defineNode ||
          obj.registeredNodes ||
          (obj.nodes && Array.isArray(obj.nodes)))
      );
    }

    // Try to find V2U in React fiber tree
    findV2UInReact() {
      try {
        const reactRoot =
          document.querySelector("#__next") ||
          document.querySelector("[data-reactroot]") ||
          document.querySelector("#root");

        if (reactRoot && reactRoot._reactInternalFiber) {
          return this.searchFiberForV2U(reactRoot._reactInternalFiber);
        }
      } catch (error) {
        console.warn("[V2U DevTools] Error searching React tree:", error);
      }
      return null;
    }

    // Search React fiber tree for V2U components
    searchFiberForV2U(fiber) {
      if (fiber.memoizedProps && fiber.memoizedProps.nodeRegistry) {
        return fiber.memoizedProps;
      }

      if (fiber.child) {
        const result = this.searchFiberForV2U(fiber.child);
        if (result) return result;
      }

      if (fiber.sibling) {
        const result = this.searchFiberForV2U(fiber.sibling);
        if (result) return result;
      }

      return null;
    }

    // Connect to the found V2U system
    connectToV2USystem(v2uSystem) {
      console.log("[V2U DevTools] Connecting to V2U system");
      this.registryRef = v2uSystem;
      this.isInitialized = true;

      // Set up performance monitoring
      this.setupPerformanceMonitoring();

      // Set up event listeners
      this.setupEventListeners();

      // Notify content script that we're ready
      this.sendMessage("V2U_CONNECTION_READY", { ready: true });

      // Send initial data
      this.collectAndSendRegistryData();
      this.collectAndSendPerformanceData();
    }

    // Setup mock data for development/testing
    setupMockData() {
      console.log("[V2U DevTools] Setting up mock V2U data");

      this.registryRef = {
        nodes: this.generateMockNodes(),
        categories: ["create", "transform", "output", "utility"],
        version: "2.0.0-mock",
        status: "development",
      };

      this.isInitialized = true;
      this.sendMessage("V2U_CONNECTION_READY", { ready: true, mock: true });
      this.collectAndSendRegistryData();
    }

    // Generate mock node data for testing
    generateMockNodes() {
      const categories = ["create", "transform", "output", "utility"];
      const nodes = [];

      for (let i = 0; i < 20; i++) {
        nodes.push({
          nodeType: `mockNode${i}`,
          displayName: `Mock Node ${i}`,
          category: categories[i % categories.length],
          version: "1.0.0",
          status: Math.random() > 0.9 ? "error" : "active",
          config: {
            handles: [
              { id: "input", type: "target", dataType: "string" },
              { id: "output", type: "source", dataType: "string" },
            ],
            defaultData: { value: `Mock data ${i}` },
          },
          performance: {
            renderTime: Math.round(Math.random() * 10),
            memoryUsage: Math.round(Math.random() * 5),
            lastUpdated: new Date().toISOString(),
          },
        });
      }

      return nodes;
    }

    // Setup performance monitoring
    setupPerformanceMonitoring() {
      this.performanceMonitor = {
        startTime: Date.now(),
        metrics: [],
        observer: null,
      };

      // Setup Performance Observer if available
      if (typeof PerformanceObserver !== "undefined") {
        this.performanceMonitor.observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name.includes("v2u") || entry.name.includes("node")) {
              this.sendMessage("V2U_EVENT", {
                type: "performance",
                data: {
                  name: entry.name,
                  duration: entry.duration,
                  startTime: entry.startTime,
                  entryType: entry.entryType,
                },
              });
            }
          });
        });

        this.performanceMonitor.observer.observe({
          entryTypes: ["measure", "navigation", "resource"],
        });
      }

      // Collect metrics every 5 seconds
      setInterval(() => {
        this.collectAndSendPerformanceData();
      }, 5000);
    }

    // Setup event listeners for V2U events
    setupEventListeners() {
      // Listen for common V2U events
      const eventTypes = [
        "nodeCreated",
        "nodeUpdated",
        "nodeDeleted",
        "registryUpdated",
        "validationError",
        "performanceWarning",
      ];

      eventTypes.forEach((eventType) => {
        if (this.registryRef.addEventListener) {
          this.registryRef.addEventListener(eventType, (event) => {
            this.sendMessage("V2U_EVENT", {
              type: eventType,
              data: event.detail || event.data,
              timestamp: Date.now(),
            });
          });
        }
      });

      // Listen for console messages related to V2U
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;

      console.log = (...args) => {
        if (
          args.some((arg) => typeof arg === "string" && arg.includes("[V2U"))
        ) {
          this.sendMessage("V2U_EVENT", {
            type: "console",
            level: "log",
            message: args.join(" "),
            timestamp: Date.now(),
          });
        }
        originalConsoleLog.apply(console, args);
      };

      console.error = (...args) => {
        if (
          args.some((arg) => typeof arg === "string" && arg.includes("[V2U"))
        ) {
          this.sendMessage("V2U_EVENT", {
            type: "console",
            level: "error",
            message: args.join(" "),
            timestamp: Date.now(),
          });
        }
        originalConsoleError.apply(console, args);
      };

      console.warn = (...args) => {
        if (
          args.some((arg) => typeof arg === "string" && arg.includes("[V2U"))
        ) {
          this.sendMessage("V2U_EVENT", {
            type: "console",
            level: "warn",
            message: args.join(" "),
            timestamp: Date.now(),
          });
        }
        originalConsoleWarn.apply(console, args);
      };
    }

    // Handle messages from content script
    handleContentScriptMessage(event) {
      if (
        event.source !== window ||
        !event.data.type ||
        !event.data.type.startsWith("V2U_REQUEST_")
      ) {
        return;
      }

      console.log(
        "[V2U DevTools] Received content script message:",
        event.data
      );

      switch (event.data.type) {
        case "V2U_REQUEST_DATA":
          this.handleDataRequest(event.data.payload.dataType);
          break;

        case "V2U_REQUEST_ACTION":
          this.handleActionRequest(
            event.data.payload.actionType,
            event.data.payload.data
          );
          break;

        default:
          console.warn(
            "[V2U DevTools] Unknown content script message:",
            event.data.type
          );
      }
    }

    // Handle data requests
    handleDataRequest(dataType) {
      switch (dataType) {
        case "registry":
          this.collectAndSendRegistryData();
          break;

        case "performance":
          this.collectAndSendPerformanceData();
          break;

        case "validation":
          this.collectAndSendValidationData();
          break;

        default:
          console.warn("[V2U DevTools] Unknown data type requested:", dataType);
      }
    }

    // Handle action requests
    handleActionRequest(actionType, actionData) {
      switch (actionType) {
        case "auto-fix":
          this.performAutoFix(actionData);
          break;

        case "save-config":
          this.saveNodeConfig(actionData);
          break;

        default:
          console.warn("[V2U DevTools] Unknown action requested:", actionType);
      }
    }

    // Collect and send registry data
    collectAndSendRegistryData() {
      if (!this.isInitialized) return;

      const registryData = {
        nodes: this.getRegistryNodes(),
        categories: this.getRegistryCategories(),
        version: this.getRegistryVersion(),
        status: this.getRegistryStatus(),
        timestamp: Date.now(),
      };

      this.sendMessage("V2U_REGISTRY_DATA", registryData);
    }

    // Get registry nodes
    getRegistryNodes() {
      if (this.registryRef.nodes) {
        return this.registryRef.nodes;
      }

      if (this.registryRef.getAll) {
        return this.registryRef.getAll();
      }

      if (this.registryRef.registeredNodes) {
        return Object.values(this.registryRef.registeredNodes);
      }

      return [];
    }

    // Get registry categories
    getRegistryCategories() {
      if (this.registryRef.categories) {
        return this.registryRef.categories;
      }

      const nodes = this.getRegistryNodes();
      const categories = [...new Set(nodes.map((node) => node.category))];
      return categories;
    }

    // Get registry version
    getRegistryVersion() {
      return this.registryRef.version || "2.0.0";
    }

    // Get registry status
    getRegistryStatus() {
      return this.registryRef.status || "active";
    }

    // Collect and send performance data
    collectAndSendPerformanceData() {
      const performanceData = {
        memory: this.getMemoryInfo(),
        timing: this.getTimingInfo(),
        nodeMetrics: this.getNodeMetrics(),
        timestamp: Date.now(),
      };

      this.sendMessage("V2U_PERFORMANCE_METRICS", performanceData);
    }

    // Get memory information
    getMemoryInfo() {
      if (performance.memory) {
        return {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
        };
      }
      return { used: 0, total: 0, limit: 0 };
    }

    // Get timing information
    getTimingInfo() {
      if (performance.timing) {
        const timing = performance.timing;
        return {
          loadComplete: timing.loadEventEnd - timing.navigationStart,
          domContentLoaded:
            timing.domContentLoadedEventEnd - timing.navigationStart,
          domInteractive: timing.domInteractive - timing.navigationStart,
        };
      }
      return { loadComplete: 0, domContentLoaded: 0, domInteractive: 0 };
    }

    // Get node-specific metrics
    getNodeMetrics() {
      const nodes = this.getRegistryNodes();
      return {
        totalNodes: nodes.length,
        activeNodes: nodes.filter((n) => n.status === "active").length,
        errorNodes: nodes.filter((n) => n.status === "error").length,
        averageRenderTime: this.calculateAverageRenderTime(nodes),
      };
    }

    // Calculate average render time
    calculateAverageRenderTime(nodes) {
      const renderTimes = nodes
        .map((node) => node.performance?.renderTime)
        .filter((time) => typeof time === "number");

      if (renderTimes.length === 0) return 0;

      return (
        renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length
      );
    }

    // Collect and send validation data
    collectAndSendValidationData() {
      const validationData = this.runValidation();
      this.sendMessage("V2U_VALIDATION_RESULTS", validationData);
    }

    // Run validation on the registry
    runValidation() {
      const nodes = this.getRegistryNodes();
      const issues = [];
      let errors = 0;
      let warnings = 0;

      nodes.forEach((node) => {
        // Check for required properties
        if (!node.nodeType) {
          issues.push({
            nodeType: node.nodeType || "Unknown",
            severity: "error",
            message: "Missing nodeType property",
            suggestion: "Add a unique nodeType identifier",
          });
          errors++;
        }

        if (!node.category) {
          issues.push({
            nodeType: node.nodeType,
            severity: "error",
            message: "Missing category property",
            suggestion:
              "Specify a valid category (create, transform, output, utility)",
          });
          errors++;
        }

        // Check for performance issues
        if (node.performance?.renderTime > 100) {
          issues.push({
            nodeType: node.nodeType,
            severity: "warning",
            message: `Slow render time: ${node.performance.renderTime}ms`,
            suggestion: "Consider optimizing component render performance",
          });
          warnings++;
        }

        // Check for configuration issues
        if (!node.config?.handles || node.config.handles.length === 0) {
          issues.push({
            nodeType: node.nodeType,
            severity: "warning",
            message: "No handles defined",
            suggestion: "Add input/output handles for data flow",
          });
          warnings++;
        }
      });

      const totalIssues = errors + warnings;
      const healthScore = Math.max(0, 100 - errors * 10 - warnings * 2);

      return {
        totalIssues,
        errors,
        warnings,
        healthScore,
        issues,
        timestamp: Date.now(),
      };
    }

    // Perform auto-fix for validation issues
    performAutoFix(validationResults) {
      console.log("[V2U DevTools] Performing auto-fix:", validationResults);
      // Implementation would depend on the specific V2U system
      // For now, just log the attempt
      this.sendMessage("V2U_EVENT", {
        type: "autofix",
        message: "Auto-fix attempted",
        data: validationResults,
      });
    }

    // Save node configuration
    saveNodeConfig(configData) {
      console.log("[V2U DevTools] Saving node config:", configData);
      // Implementation would depend on the specific V2U system
      this.sendMessage("V2U_EVENT", {
        type: "config-save",
        message: "Node configuration saved",
        data: configData,
      });
    }

    // Send message to content script
    sendMessage(type, payload) {
      window.postMessage(
        {
          type,
          payload,
          timestamp: Date.now(),
        },
        "*"
      );
    }
  }

  // Initialize the bridge
  new V2UBridge();
})();
