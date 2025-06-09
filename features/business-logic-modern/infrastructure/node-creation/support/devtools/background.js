// V2U DevTools Background Service Worker
// Handles extension lifecycle and cross-tab communication

console.log("[V2U DevTools] Background service worker loaded");

class V2UBackgroundService {
  constructor() {
    this.connections = new Map();
    this.extensionData = {
      isActive: false,
      connectedTabs: new Set(),
      lastActivity: Date.now(),
    };

    this.init();
  }

  init() {
    console.log("[V2U DevTools] Initializing background service");

    // Listen for extension events
    this.setupEventListeners();

    // Setup periodic cleanup
    this.setupPeriodicTasks();
  }

  setupEventListeners() {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      console.log("[V2U DevTools] Extension installed:", details);

      if (details.reason === "install") {
        this.handleFirstInstall();
      } else if (details.reason === "update") {
        this.handleUpdate(details.previousVersion);
      }
    });

    // Handle extension startup
    chrome.runtime.onStartup.addListener(() => {
      console.log("[V2U DevTools] Extension startup");
      this.extensionData.isActive = true;
      this.extensionData.lastActivity = Date.now();
    });

    // Handle extension connections
    chrome.runtime.onConnect.addListener((port) => {
      this.handleConnection(port);
    });

    // Handle messages from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
    });

    // Handle tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    // Handle tab removal
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.handleTabRemoval(tabId);
    });
  }

  setupPeriodicTasks() {
    // Cleanup inactive connections every 5 minutes
    setInterval(
      () => {
        this.cleanupInactiveConnections();
      },
      5 * 60 * 1000
    );

    // Update extension status every minute
    setInterval(() => {
      this.updateExtensionStatus();
    }, 60 * 1000);
  }

  handleFirstInstall() {
    console.log("[V2U DevTools] First installation detected");

    // Set up default settings
    chrome.storage.local.set({
      v2uDevToolsSettings: {
        version: "1.0.0",
        installDate: Date.now(),
        enabled: true,
        autoConnect: true,
        debugMode: false,
      },
    });

    // Open welcome page
    chrome.tabs.create({
      url: chrome.runtime.getURL("welcome.html"),
    });
  }

  handleUpdate(previousVersion) {
    console.log("[V2U DevTools] Extension updated from:", previousVersion);

    // Handle migration if needed
    this.migrateSettings(previousVersion);

    // Notify about update
    this.notifyUpdate(previousVersion);
  }

  migrateSettings(fromVersion) {
    // Handle settings migration between versions
    chrome.storage.local.get(["v2uDevToolsSettings"], (result) => {
      const settings = result.v2uDevToolsSettings || {};

      // Add new settings while preserving existing ones
      const updatedSettings = {
        ...settings,
        version: "1.0.0",
        lastUpdateDate: Date.now(),
      };

      chrome.storage.local.set({ v2uDevToolsSettings: updatedSettings });
    });
  }

  notifyUpdate(fromVersion) {
    // Show update notification
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "V2U DevTools Updated",
      message: `Updated from ${fromVersion} to 1.0.0`,
    });
  }

  handleConnection(port) {
    console.log("[V2U DevTools] New connection:", port.name);

    const connectionId = `${port.name}-${Date.now()}`;

    this.connections.set(connectionId, {
      port,
      name: port.name,
      tabId: port.sender?.tab?.id,
      connectTime: Date.now(),
      lastActivity: Date.now(),
    });

    // Update connected tabs
    if (port.sender?.tab?.id) {
      this.extensionData.connectedTabs.add(port.sender.tab.id);
    }

    // Handle port disconnection
    port.onDisconnect.addListener(() => {
      console.log("[V2U DevTools] Connection disconnected:", connectionId);

      const connection = this.connections.get(connectionId);
      if (connection && connection.tabId) {
        this.extensionData.connectedTabs.delete(connection.tabId);
      }

      this.connections.delete(connectionId);
      this.updateExtensionStatus();
    });

    // Handle port messages
    port.onMessage.addListener((message) => {
      this.handlePortMessage(connectionId, message);
    });

    this.updateExtensionStatus();
  }

  handlePortMessage(connectionId, message) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    console.log("[V2U DevTools] Port message:", message);

    // Update activity timestamp
    connection.lastActivity = Date.now();
    this.extensionData.lastActivity = Date.now();

    // Handle specific message types
    switch (message.type) {
      case "devtools-ready":
        this.handleDevToolsReady(connectionId);
        break;

      case "performance-data":
        this.broadcastToOtherConnections(connectionId, message);
        break;

      case "registry-update":
        this.broadcastToOtherConnections(connectionId, message);
        break;

      default:
        // Forward unknown messages to other connections
        this.broadcastToOtherConnections(connectionId, message);
    }
  }

  handleDevToolsReady(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    console.log("[V2U DevTools] DevTools panel ready");

    // Send current extension status
    connection.port.postMessage({
      type: "extension-status",
      data: {
        isActive: this.extensionData.isActive,
        connectedTabs: this.extensionData.connectedTabs.size,
        connections: this.connections.size,
      },
    });
  }

  broadcastToOtherConnections(sourceConnectionId, message) {
    this.connections.forEach((connection, connectionId) => {
      if (connectionId !== sourceConnectionId && connection.port) {
        try {
          connection.port.postMessage(message);
        } catch (error) {
          console.warn(
            "[V2U DevTools] Failed to send message to connection:",
            error
          );
          // Remove invalid connection
          this.connections.delete(connectionId);
        }
      }
    });
  }

  handleMessage(message, sender, sendResponse) {
    console.log("[V2U DevTools] Runtime message:", message);

    switch (message.type) {
      case "get-extension-status":
        sendResponse({
          isActive: this.extensionData.isActive,
          connectedTabs: this.extensionData.connectedTabs.size,
          connections: this.connections.size,
          lastActivity: this.extensionData.lastActivity,
        });
        break;

      case "get-settings":
        chrome.storage.local.get(["v2uDevToolsSettings"], (result) => {
          sendResponse(result.v2uDevToolsSettings || {});
        });
        return true; // Async response

      case "save-settings":
        chrome.storage.local.set(
          { v2uDevToolsSettings: message.settings },
          () => {
            sendResponse({ success: true });
          }
        );
        return true; // Async response

      default:
        console.warn(
          "[V2U DevTools] Unknown runtime message type:",
          message.type
        );
        sendResponse({ error: "Unknown message type" });
    }
  }

  handleTabUpdate(tabId, changeInfo, tab) {
    // Check if this is a localhost tab with V2U
    if (
      changeInfo.status === "complete" &&
      tab.url &&
      tab.url.includes("localhost")
    ) {
      console.log("[V2U DevTools] Localhost tab updated:", tabId);

      // Inject content script if not already injected
      chrome.scripting
        .executeScript({
          target: { tabId },
          files: ["content-script.js"],
        })
        .catch((error) => {
          // Ignore errors - script might already be injected
          console.debug(
            "[V2U DevTools] Content script injection skipped:",
            error.message
          );
        });
    }
  }

  handleTabRemoval(tabId) {
    console.log("[V2U DevTools] Tab removed:", tabId);

    // Clean up connections for this tab
    this.connections.forEach((connection, connectionId) => {
      if (connection.tabId === tabId) {
        this.connections.delete(connectionId);
      }
    });

    this.extensionData.connectedTabs.delete(tabId);
    this.updateExtensionStatus();
  }

  cleanupInactiveConnections() {
    const now = Date.now();
    const timeoutThreshold = 10 * 60 * 1000; // 10 minutes

    this.connections.forEach((connection, connectionId) => {
      if (now - connection.lastActivity > timeoutThreshold) {
        console.log(
          "[V2U DevTools] Cleaning up inactive connection:",
          connectionId
        );
        this.connections.delete(connectionId);

        if (connection.tabId) {
          this.extensionData.connectedTabs.delete(connection.tabId);
        }
      }
    });

    this.updateExtensionStatus();
  }

  updateExtensionStatus() {
    this.extensionData.isActive = this.connections.size > 0;
    this.extensionData.lastActivity = Date.now();

    // Update badge text
    const activeConnections = this.connections.size;
    chrome.action.setBadgeText({
      text: activeConnections > 0 ? activeConnections.toString() : "",
    });

    // Update badge color
    chrome.action.setBadgeBackgroundColor({
      color: activeConnections > 0 ? "#007acc" : "#666666",
    });

    // Update title
    chrome.action.setTitle({
      title: `V2U DevTools (${activeConnections} active connections)`,
    });
  }
}

// Initialize the background service
new V2UBackgroundService();

console.log("[V2U DevTools] Background service worker initialized");
