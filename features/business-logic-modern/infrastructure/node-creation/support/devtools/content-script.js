// V2U DevTools Content Script
// Bridge between DevTools extension and host application

console.log("[V2U DevTools] Content script loaded");

class V2UContentScript {
  constructor() {
    this.devToolsPort = null;
    this.hostData = {
      registryData: null,
      performanceMetrics: null,
      validationResults: null,
      events: [],
    };

    this.init();
  }

  init() {
    console.log("[V2U DevTools] Initializing content script");

    // Inject the bridge script into the page
    this.injectBridgeScript();

    // Listen for messages from the injected script
    window.addEventListener("message", this.handlePageMessage.bind(this));

    // Listen for DevTools connections
    chrome.runtime.onConnect.addListener(
      this.handleDevToolsConnection.bind(this)
    );

    // Start data collection
    this.startDataCollection();
  }

  // Inject the bridge script into the host page
  injectBridgeScript() {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("inject-script.js");
    script.onload = function () {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  }

  // Handle messages from the injected bridge script
  handlePageMessage(event) {
    // Only accept messages from our extension
    if (
      event.source !== window ||
      !event.data.type ||
      !event.data.type.startsWith("V2U_")
    ) {
      return;
    }

    console.log("[V2U DevTools] Received page message:", event.data);

    switch (event.data.type) {
      case "V2U_REGISTRY_DATA":
        this.hostData.registryData = event.data.payload;
        this.sendToDevTools("registry-data", event.data.payload);
        break;

      case "V2U_PERFORMANCE_METRICS":
        this.hostData.performanceMetrics = event.data.payload;
        this.sendToDevTools("performance-metrics", event.data.payload);
        break;

      case "V2U_VALIDATION_RESULTS":
        this.hostData.validationResults = event.data.payload;
        this.sendToDevTools("validation-results", event.data.payload);
        break;

      case "V2U_EVENT":
        this.hostData.events.push(event.data.payload);
        this.sendToDevTools("event-data", event.data.payload);
        break;

      case "V2U_CONNECTION_READY":
        console.log("[V2U DevTools] Host application ready");
        this.sendToDevTools("connection-established", { ready: true });
        break;

      default:
        console.warn(
          "[V2U DevTools] Unknown page message type:",
          event.data.type
        );
    }
  }

  // Handle DevTools panel connections
  handleDevToolsConnection(port) {
    if (port.name === "v2u-devtools") {
      console.log("[V2U DevTools] DevTools connected");
      this.devToolsPort = port;

      // Send cached data immediately
      if (this.hostData.registryData) {
        this.sendToDevTools("registry-data", this.hostData.registryData);
      }

      if (this.hostData.performanceMetrics) {
        this.sendToDevTools(
          "performance-metrics",
          this.hostData.performanceMetrics
        );
      }

      if (this.hostData.validationResults) {
        this.sendToDevTools(
          "validation-results",
          this.hostData.validationResults
        );
      }

      // Listen for DevTools requests
      port.onMessage.addListener(this.handleDevToolsMessage.bind(this));

      port.onDisconnect.addListener(() => {
        console.log("[V2U DevTools] DevTools disconnected");
        this.devToolsPort = null;
      });
    }
  }

  // Handle messages from DevTools panel
  handleDevToolsMessage(message) {
    console.log("[V2U DevTools] Received DevTools message:", message);

    switch (message.type) {
      case "request-registry-data":
        this.requestHostData("registry");
        break;

      case "request-performance-metrics":
        this.requestHostData("performance");
        break;

      case "request-validation":
        this.requestHostData("validation");
        break;

      case "auto-fix-issues":
        this.requestHostAction("auto-fix", message.data);
        break;

      case "save-node-config":
        this.requestHostAction("save-config", message.data);
        break;

      default:
        console.warn(
          "[V2U DevTools] Unknown DevTools message type:",
          message.type
        );
    }
  }

  // Send messages to DevTools panel
  sendToDevTools(type, data) {
    if (this.devToolsPort) {
      this.devToolsPort.postMessage({
        type,
        data,
        timestamp: Date.now(),
      });
    }
  }

  // Request data from host application
  requestHostData(dataType) {
    console.log("[V2U DevTools] Requesting host data:", dataType);

    window.postMessage(
      {
        type: "V2U_REQUEST_DATA",
        payload: { dataType },
      },
      "*"
    );
  }

  // Request actions from host application
  requestHostAction(actionType, actionData) {
    console.log("[V2U DevTools] Requesting host action:", actionType);

    window.postMessage(
      {
        type: "V2U_REQUEST_ACTION",
        payload: { actionType, data: actionData },
      },
      "*"
    );
  }

  // Start periodic data collection
  startDataCollection() {
    // Request initial data
    setTimeout(() => {
      this.requestHostData("registry");
      this.requestHostData("performance");
      this.requestHostData("validation");
    }, 1000);

    // Set up periodic updates
    setInterval(() => {
      if (this.devToolsPort) {
        this.requestHostData("performance");
      }
    }, 5000);

    // Set up registry health checks
    setInterval(() => {
      if (this.devToolsPort) {
        this.requestHostData("registry");
      }
    }, 30000);
  }
}

// Initialize the content script when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new V2UContentScript();
  });
} else {
  new V2UContentScript();
}

console.log("[V2U DevTools] Content script initialized");
