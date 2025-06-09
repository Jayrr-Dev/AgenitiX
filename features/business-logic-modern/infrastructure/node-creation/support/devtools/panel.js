// V2U DevTools Panel - Main JavaScript Implementation
// Professional development tools for V2U node system

class V2UDevToolsPanel {
  constructor() {
    this.connectionPort = null;
    this.isConnected = false;
    this.registryData = null;
    this.performanceMetrics = [];
    this.eventHistory = [];
    this.currentTab = "registry";
    this.validationResults = null;
    this.selectedNode = null;

    // Performance monitoring
    this.performanceObserver = null;
    this.metricsInterval = null;

    this.init();
  }

  // Initialize the DevTools panel
  init() {
    console.log("[V2U DevTools] Initializing panel...");

    this.setupEventListeners();
    this.connectToHost();
    this.initializePerformanceMonitoring();

    // Hide loading overlay after initialization
    setTimeout(() => {
      document.getElementById("loading-overlay").classList.add("hidden");
    }, 1000);
  }

  // Setup all event listeners
  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Registry Inspector Events
    document
      .getElementById("refresh-registry")
      ?.addEventListener("click", () => {
        this.refreshRegistry();
      });

    document
      .getElementById("export-registry")
      ?.addEventListener("click", () => {
        this.exportRegistry();
      });

    document.getElementById("node-search")?.addEventListener("input", (e) => {
      this.filterNodes(e.target.value);
    });

    // Performance Profiler Events
    document
      .getElementById("start-profiling")
      ?.addEventListener("click", () => {
        this.toggleProfiling();
      });

    document.getElementById("clear-metrics")?.addEventListener("click", () => {
      this.clearMetrics();
    });

    // Validator Events
    document.getElementById("run-validation")?.addEventListener("click", () => {
      this.runValidation();
    });

    document.getElementById("fix-issues")?.addEventListener("click", () => {
      this.autoFixIssues();
    });

    // Editor Events
    document.getElementById("save-changes")?.addEventListener("click", () => {
      this.saveEditorChanges();
    });

    document.getElementById("reset-editor")?.addEventListener("click", () => {
      this.resetEditor();
    });

    // Event Monitor Events
    document.getElementById("clear-events")?.addEventListener("click", () => {
      this.clearEvents();
    });

    document.getElementById("pause-events")?.addEventListener("click", () => {
      this.toggleEventPause();
    });

    document
      .getElementById("event-type-filter")
      ?.addEventListener("change", (e) => {
        this.filterEvents(e.target.value);
      });
  }

  // Connect to the host application
  connectToHost() {
    console.log("[V2U DevTools] Connecting to host...");

    // Establish connection with content script
    this.connectionPort = chrome.runtime.connect({ name: "v2u-devtools" });

    this.connectionPort.onMessage.addListener((message) => {
      this.handleHostMessage(message);
    });

    this.connectionPort.onDisconnect.addListener(() => {
      console.log("[V2U DevTools] Connection lost");
      this.updateConnectionStatus(false);
    });

    // Request initial data
    this.requestHostData();

    // Set up periodic data refresh
    setInterval(() => {
      if (this.isConnected) {
        this.requestHostData();
      }
    }, 5000);
  }

  // Handle messages from host application
  handleHostMessage(message) {
    console.log("[V2U DevTools] Received message:", message);

    switch (message.type) {
      case "registry-data":
        this.updateRegistryData(message.data);
        break;
      case "performance-metrics":
        this.updatePerformanceMetrics(message.data);
        break;
      case "validation-results":
        this.updateValidationResults(message.data);
        break;
      case "event-data":
        this.addEvent(message.data);
        break;
      case "connection-established":
        this.updateConnectionStatus(true);
        break;
      default:
        console.warn("[V2U DevTools] Unknown message type:", message.type);
    }
  }

  // Request data from host application
  requestHostData() {
    if (this.connectionPort) {
      this.connectionPort.postMessage({
        type: "request-registry-data",
      });

      this.connectionPort.postMessage({
        type: "request-performance-metrics",
      });
    }
  }

  // Update connection status
  updateConnectionStatus(connected) {
    this.isConnected = connected;
    const statusIndicator = document.getElementById("connection-status");
    const statusText = document.getElementById("status-text");

    if (connected) {
      statusIndicator.className = "status-indicator connected";
      statusText.textContent = "Connected";
    } else {
      statusIndicator.className = "status-indicator error";
      statusText.textContent = "Disconnected";
    }
  }

  // Switch between tabs
  switchTab(tabName) {
    // Update active tab button
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.classList.remove("active");
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");

    // Update active tab content
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.remove("active");
    });
    document.getElementById(`${tabName}-tab`).classList.add("active");

    this.currentTab = tabName;

    // Initialize tab-specific functionality
    this.initializeTab(tabName);
  }

  // Initialize tab-specific functionality
  initializeTab(tabName) {
    switch (tabName) {
      case "registry":
        this.initializeRegistryTab();
        break;
      case "performance":
        this.initializePerformanceTab();
        break;
      case "validator":
        this.initializeValidatorTab();
        break;
      case "editor":
        this.initializeEditorTab();
        break;
      case "events":
        this.initializeEventsTab();
        break;
    }
  }

  // Registry Inspector Methods
  initializeRegistryTab() {
    console.log("[V2U DevTools] Initializing registry tab");
    this.refreshRegistry();
  }

  refreshRegistry() {
    if (this.connectionPort) {
      this.connectionPort.postMessage({
        type: "request-registry-data",
      });
    }
  }

  updateRegistryData(data) {
    console.log("[V2U DevTools] Updating registry data:", data);
    this.registryData = data;

    // Update statistics
    this.updateRegistryStats(data);

    // Update node list
    this.updateNodeList(data.nodes || []);

    // Update category filters
    this.updateCategoryFilters(data.categories || []);
  }

  updateRegistryStats(data) {
    const totalNodes = data.nodes ? data.nodes.length : 0;
    const activeNodes = data.nodes
      ? data.nodes.filter((n) => n.status === "active").length
      : 0;
    const totalCategories = data.categories ? data.categories.length : 0;
    const health = this.calculateRegistryHealth(data);

    document.getElementById("total-nodes").textContent = totalNodes;
    document.getElementById("active-nodes").textContent = activeNodes;
    document.getElementById("total-categories").textContent = totalCategories;

    const healthElement = document.getElementById("registry-health");
    healthElement.textContent = health.status;
    healthElement.className = `stat-value health-indicator ${health.status.toLowerCase()}`;
  }

  calculateRegistryHealth(data) {
    if (!data.nodes || data.nodes.length === 0) {
      return { status: "Error", score: 0 };
    }

    const errorNodes = data.nodes.filter((n) => n.status === "error").length;
    const totalNodes = data.nodes.length;
    const errorRate = errorNodes / totalNodes;

    if (errorRate === 0) {
      return { status: "Healthy", score: 100 };
    } else if (errorRate < 0.1) {
      return { status: "Warning", score: 80 };
    } else {
      return { status: "Error", score: 50 };
    }
  }

  updateNodeList(nodes) {
    const nodeList = document.getElementById("node-list");
    nodeList.innerHTML = "";

    nodes.forEach((node) => {
      const nodeItem = document.createElement("div");
      nodeItem.className = "node-item";
      nodeItem.onclick = () => this.selectNode(node);

      nodeItem.innerHTML = `
        <div class="node-name">${node.displayName || node.nodeType}</div>
        <div class="node-type">${node.category} • ${node.nodeType}</div>
      `;

      nodeList.appendChild(nodeItem);
    });
  }

  updateCategoryFilters(categories) {
    const filterContainer = document.getElementById("category-filters");
    filterContainer.innerHTML = "";

    categories.forEach((category) => {
      const filterItem = document.createElement("div");
      filterItem.className = "filter-item";

      filterItem.innerHTML = `
        <input type="checkbox" id="filter-${category}" class="filter-checkbox" checked>
        <label for="filter-${category}">${category}</label>
      `;

      filterContainer.appendChild(filterItem);
    });
  }

  selectNode(node) {
    this.selectedNode = node;

    // Update visual selection
    document.querySelectorAll(".node-item").forEach((item) => {
      item.classList.remove("selected");
    });
    event.currentTarget.classList.add("selected");

    // Show node details
    this.showNodeDetails(node);
  }

  showNodeDetails(node) {
    const detailsContainer = document.getElementById("node-details");

    detailsContainer.innerHTML = `
      <div class="node-detail-content">
        <h3>${node.displayName || node.nodeType}</h3>
        <div class="detail-section">
          <h4>Basic Information</h4>
          <p><strong>Type:</strong> ${node.nodeType}</p>
          <p><strong>Category:</strong> ${node.category}</p>
          <p><strong>Version:</strong> ${node.version || "N/A"}</p>
          <p><strong>Status:</strong> ${node.status || "Unknown"}</p>
        </div>

        <div class="detail-section">
          <h4>Configuration</h4>
          <pre>${JSON.stringify(node.config || {}, null, 2)}</pre>
        </div>

        <div class="detail-section">
          <h4>Performance</h4>
          <p><strong>Render Time:</strong> ${node.performance?.renderTime || "N/A"}ms</p>
          <p><strong>Memory Usage:</strong> ${node.performance?.memoryUsage || "N/A"}MB</p>
          <p><strong>Last Updated:</strong> ${node.performance?.lastUpdated || "N/A"}</p>
        </div>
      </div>
    `;
  }

  filterNodes(searchTerm) {
    const nodeItems = document.querySelectorAll(".node-item");

    nodeItems.forEach((item) => {
      const nodeName = item
        .querySelector(".node-name")
        .textContent.toLowerCase();
      const nodeType = item
        .querySelector(".node-type")
        .textContent.toLowerCase();

      if (
        nodeName.includes(searchTerm.toLowerCase()) ||
        nodeType.includes(searchTerm.toLowerCase())
      ) {
        item.style.display = "block";
      } else {
        item.style.display = "none";
      }
    });
  }

  exportRegistry() {
    if (!this.registryData) {
      alert("No registry data available");
      return;
    }

    const dataStr = JSON.stringify(this.registryData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(dataBlob);
    link.download = `v2u-registry-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
  }

  // Performance Profiler Methods
  initializePerformanceTab() {
    console.log("[V2U DevTools] Initializing performance tab");
    this.startMetricsCollection();
  }

  initializePerformanceMonitoring() {
    // Initialize Performance Observer if available
    if ("PerformanceObserver" in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.addPerformanceEntry(entry);
        });
      });

      this.performanceObserver.observe({
        entryTypes: ["measure", "navigation"],
      });
    }
  }

  startMetricsCollection() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 1000);
  }

  collectMetrics() {
    const metrics = {
      timestamp: Date.now(),
      memory: this.getMemoryInfo(),
      timing: this.getTimingInfo(),
      events: this.eventHistory.length,
    };

    this.performanceMetrics.push(metrics);

    // Keep only last 100 entries
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics.shift();
    }

    this.updatePerformanceDisplay();
  }

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

  getTimingInfo() {
    if (performance.timing) {
      const timing = performance.timing;
      return {
        domContentLoaded:
          timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
      };
    }
    return { domContentLoaded: 0, loadComplete: 0 };
  }

  updatePerformanceDisplay() {
    if (this.performanceMetrics.length === 0) return;

    const latest = this.performanceMetrics[this.performanceMetrics.length - 1];

    // Update memory usage
    document.getElementById("memory-usage").textContent =
      `${latest.memory.used}MB`;

    // Update event queue
    document.getElementById("event-queue").textContent =
      `${latest.events} total`;

    // Add to performance log
    this.addToPerformanceLog(
      `Memory: ${latest.memory.used}MB, Events: ${latest.events}`
    );
  }

  addPerformanceEntry(entry) {
    this.addToPerformanceLog(
      `${entry.entryType}: ${entry.name} - ${entry.duration}ms`
    );
  }

  addToPerformanceLog(message) {
    const logContent = document.getElementById("performance-log-content");
    const timestamp = new Date().toLocaleTimeString();

    const logEntry = document.createElement("div");
    logEntry.textContent = `[${timestamp}] ${message}`;

    logContent.appendChild(logEntry);
    logContent.scrollTop = logContent.scrollHeight;

    // Keep only last 50 entries
    while (logContent.children.length > 50) {
      logContent.removeChild(logContent.firstChild);
    }
  }

  toggleProfiling() {
    const button = document.getElementById("start-profiling");

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
      button.textContent = "Start Profiling";
      button.classList.remove("btn-success");
      button.classList.add("btn-primary");
    } else {
      this.startMetricsCollection();
      button.textContent = "Stop Profiling";
      button.classList.remove("btn-primary");
      button.classList.add("btn-success");
    }
  }

  clearMetrics() {
    this.performanceMetrics = [];
    document.getElementById("performance-log-content").innerHTML = "";
    this.updatePerformanceDisplay();
  }

  // Validation Methods
  initializeValidatorTab() {
    console.log("[V2U DevTools] Initializing validator tab");
    this.runValidation();
  }

  runValidation() {
    if (this.connectionPort) {
      this.connectionPort.postMessage({
        type: "request-validation",
      });
    }
  }

  updateValidationResults(results) {
    this.validationResults = results;

    const summaryElement = document.getElementById("validation-summary");
    const detailsElement = document.getElementById("validation-details");

    // Update summary
    summaryElement.innerHTML = `
      <h3>Validation Summary</h3>
      <p>Total Issues: ${results.totalIssues || 0}</p>
      <p>Errors: ${results.errors || 0}</p>
      <p>Warnings: ${results.warnings || 0}</p>
      <p>Health Score: ${results.healthScore || 0}%</p>
    `;

    // Update details
    if (results.issues && results.issues.length > 0) {
      const issuesList = results.issues
        .map(
          (issue) => `
        <div class="validation-issue ${issue.severity}">
          <strong>${issue.nodeType}</strong>: ${issue.message}
          ${issue.suggestion ? `<br><em>Suggestion: ${issue.suggestion}</em>` : ""}
        </div>
      `
        )
        .join("");

      detailsElement.innerHTML = `
        <h3>Issues Found</h3>
        ${issuesList}
      `;
    } else {
      detailsElement.innerHTML =
        "<h3>No Issues Found</h3><p>All nodes are properly configured.</p>";
    }
  }

  autoFixIssues() {
    if (this.connectionPort) {
      this.connectionPort.postMessage({
        type: "auto-fix-issues",
        data: this.validationResults,
      });
    }
  }

  // Editor Methods
  initializeEditorTab() {
    console.log("[V2U DevTools] Initializing editor tab");
    // Editor implementation would go here
    // For now, show a placeholder
    document.getElementById("code-editor").innerHTML =
      "<p>Code editor will be implemented here</p>";
    document.getElementById("live-preview").innerHTML =
      "<p>Live preview will be shown here</p>";
  }

  saveEditorChanges() {
    // Implementation for saving editor changes
    console.log("[V2U DevTools] Saving editor changes");
  }

  resetEditor() {
    // Implementation for resetting editor
    console.log("[V2U DevTools] Resetting editor");
  }

  // Event Monitor Methods
  initializeEventsTab() {
    console.log("[V2U DevTools] Initializing events tab");
    this.updateEventDisplay();
  }

  addEvent(eventData) {
    this.eventHistory.push({
      ...eventData,
      timestamp: Date.now(),
    });

    // Keep only last 1000 events
    if (this.eventHistory.length > 1000) {
      this.eventHistory.shift();
    }

    if (this.currentTab === "events") {
      this.updateEventDisplay();
    }
  }

  updateEventDisplay() {
    const eventList = document.getElementById("event-list");
    const filter = document.getElementById("event-type-filter").value;

    let filteredEvents = this.eventHistory;
    if (filter !== "all") {
      filteredEvents = this.eventHistory.filter(
        (event) => event.type === filter
      );
    }

    // Show only last 50 events
    const recentEvents = filteredEvents.slice(-50);

    eventList.innerHTML = recentEvents
      .map((event) => {
        const timestamp = new Date(event.timestamp).toLocaleTimeString();
        return `<div>[${timestamp}] ${event.type}: ${event.message || JSON.stringify(event.data)}</div>`;
      })
      .join("");

    eventList.scrollTop = eventList.scrollHeight;
  }

  filterEvents(type) {
    this.updateEventDisplay();
  }

  clearEvents() {
    this.eventHistory = [];
    this.updateEventDisplay();
  }

  toggleEventPause() {
    // Implementation for pausing event collection
    console.log("[V2U DevTools] Toggling event pause");
  }
}

// Global initialization functions for the extension
window.initializeV2UPanel = function () {
  console.log("[V2U DevTools] Panel initialization requested");
  if (!window.v2uDevTools) {
    window.v2uDevTools = new V2UDevToolsPanel();
  }
};

window.cleanupV2UPanel = function () {
  console.log("[V2U DevTools] Panel cleanup requested");
  if (window.v2uDevTools) {
    if (window.v2uDevTools.metricsInterval) {
      clearInterval(window.v2uDevTools.metricsInterval);
    }
    if (window.v2uDevTools.performanceObserver) {
      window.v2uDevTools.performanceObserver.disconnect();
    }
  }
};

// Initialize immediately if panel is already visible
document.addEventListener("DOMContentLoaded", () => {
  console.log("[V2U DevTools] DOM loaded, initializing panel");
  window.initializeV2UPanel();
});

console.log("[V2U DevTools] Panel script loaded successfully");
