import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NodeConfiguration } from "../defineNode/index";
import { NodeErrorBoundary } from "../error-handling/NodeErrorBoundary";

// Position enum for handles
export const Position = {
  Top: "top",
  Right: "right",
  Bottom: "bottom",
  Left: "left",
} as const;

export type Position = (typeof Position)[keyof typeof Position];

// Visual builder configuration
interface VisualBuilderConfig {
  theme: "light" | "dark" | "auto";
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  enableRealTimePreview: boolean;
  enableAutoSave: boolean;
  autoSaveInterval: number;
  maxUndoSteps: number;
  enableAccessibility: boolean;
}

// Default configuration
const DEFAULT_BUILDER_CONFIG: VisualBuilderConfig = {
  theme: "auto",
  gridSize: 8,
  snapToGrid: true,
  showGrid: true,
  enableRealTimePreview: true,
  enableAutoSave: true,
  autoSaveInterval: 2000,
  maxUndoSteps: 50,
  enableAccessibility: true,
};

// Visual handle configuration
interface VisualHandle {
  id: string;
  type: "source" | "target";
  position: Position;
  dataType: string;
  label: string;
  description?: string;
  required?: boolean;
  multiple?: boolean;
  validation?: string;
  style?: {
    color?: string;
    shape?: "circle" | "square" | "diamond";
    size?: "small" | "medium" | "large";
  };
  x: number;
  y: number;
}

// Visual node configuration
interface VisualNodeConfig {
  id: string;
  nodeType: string;
  displayName: string;
  category: "create" | "transform" | "output" | "utility" | "testing";
  description: string;
  icon?: string;
  color?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  handles: VisualHandle[];
  collapsible: boolean;
  resizable: boolean;
  rotatable: boolean;
  tags: string[];
  author: string;
  version: string;
  deprecated: boolean;
  experimental: boolean;
  security?: {
    requiresAuth: boolean;
    permissions: string[];
    dataAccessLevel: "read" | "write" | "admin";
  };
  performance?: {
    timeout: number;
    memoryLimit: number;
    priority: "low" | "normal" | "high";
    cacheable: boolean;
    backgroundProcessing: boolean;
  };
  defaultData: Record<string, any>;
}

// Builder state
interface BuilderState {
  currentNode: VisualNodeConfig | null;
  selectedHandle: VisualHandle | null;
  isDragging: boolean;
  previewMode: boolean;
  history: VisualNodeConfig[];
  historyIndex: number;
  unsavedChanges: boolean;
  errors: string[];
  warnings: string[];
}

// Visual Builder Component
export const VisualNodeBuilder: React.FC<{
  config?: Partial<VisualBuilderConfig>;
  onSave?: (nodeConfig: NodeConfiguration<any>) => void;
  onPreview?: (nodeConfig: VisualNodeConfig) => void;
  onValidate?: (nodeConfig: VisualNodeConfig) => {
    errors: string[];
    warnings: string[];
  };
  className?: string;
}> = ({ config = {}, onSave, onPreview, onValidate, className = "" }) => {
  const builderConfig = useMemo(
    () => ({ ...DEFAULT_BUILDER_CONFIG, ...config }),
    [config]
  );

  // Builder state
  const [state, setState] = useState<BuilderState>({
    currentNode: null,
    selectedHandle: null,
    isDragging: false,
    previewMode: false,
    history: [],
    historyIndex: -1,
    unsavedChanges: false,
    errors: [],
    warnings: [],
  });

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<number | null>(null);

  // Initialize new node
  const initializeNewNode = useCallback(() => {
    const newNode: VisualNodeConfig = {
      id: `node-${Date.now()}`,
      nodeType: "",
      displayName: "New Node",
      category: "transform",
      description: "",
      position: { x: 100, y: 100 },
      size: { width: 200, height: 150 },
      handles: [],
      collapsible: true,
      resizable: true,
      rotatable: false,
      tags: [],
      author: "",
      version: "1.0.0",
      deprecated: false,
      experimental: false,
      defaultData: {},
    };

    setState((prev) => ({
      ...prev,
      currentNode: newNode,
      unsavedChanges: true,
    }));

    addToHistory(newNode);
  }, []);

  // Add to history for undo/redo
  const addToHistory = useCallback(
    (nodeConfig: VisualNodeConfig) => {
      setState((prev) => {
        const newHistory = prev.history.slice(0, prev.historyIndex + 1);
        newHistory.push({ ...nodeConfig });

        if (newHistory.length > builderConfig.maxUndoSteps) {
          newHistory.shift();
        }

        return {
          ...prev,
          history: newHistory,
          historyIndex: newHistory.length - 1,
        };
      });
    },
    [builderConfig.maxUndoSteps]
  );

  // Update node configuration
  const updateNode = useCallback(
    (updates: Partial<VisualNodeConfig>) => {
      setState((prev) => {
        if (!prev.currentNode) return prev;

        const updatedNode = { ...prev.currentNode, ...updates };

        let errors: string[] = [];
        let warnings: string[] = [];

        if (onValidate) {
          const validation = onValidate(updatedNode);
          errors = validation.errors;
          warnings = validation.warnings;
        }

        return {
          ...prev,
          currentNode: updatedNode,
          unsavedChanges: true,
          errors,
          warnings,
        };
      });

      // Schedule auto-save
      if (builderConfig.enableAutoSave) {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }

        autoSaveTimeoutRef.current = window.setTimeout(() => {
          handleAutoSave();
        }, builderConfig.autoSaveInterval);
      }
    },
    [builderConfig.enableAutoSave, builderConfig.autoSaveInterval, onValidate]
  );

  // Auto-save functionality
  const handleAutoSave = useCallback(() => {
    if (state.currentNode && state.unsavedChanges) {
      console.log("Auto-saving node configuration...");
      localStorage.setItem(
        "visual-builder-autosave",
        JSON.stringify(state.currentNode)
      );
    }
  }, [state.currentNode, state.unsavedChanges]);

  // Add new handle
  const addHandle = useCallback(
    (
      type: "source" | "target",
      position: Position,
      dataType: string = "any"
    ) => {
      if (!state.currentNode) return;

      const newHandle: VisualHandle = {
        id: `handle-${Date.now()}`,
        type,
        position,
        dataType,
        label: `${type === "source" ? "Output" : "Input"} ${state.currentNode.handles.length + 1}`,
        x:
          position === Position.Left || position === Position.Right
            ? position === Position.Left
              ? 0
              : state.currentNode.size.width
            : state.currentNode.size.width / 2,
        y:
          position === Position.Top || position === Position.Bottom
            ? position === Position.Top
              ? 0
              : state.currentNode.size.height
            : state.currentNode.size.height / 2,
        style: {
          color: type === "source" ? "#10b981" : "#3b82f6",
          shape: "circle",
          size: "medium",
        },
      };

      updateNode({
        handles: [...state.currentNode.handles, newHandle],
      });
    },
    [state.currentNode, updateNode]
  );

  // Update handle
  const updateHandle = useCallback(
    (handleId: string, updates: Partial<VisualHandle>) => {
      if (!state.currentNode) return;

      const updatedHandles = state.currentNode.handles.map((handle) =>
        handle.id === handleId ? { ...handle, ...updates } : handle
      );

      updateNode({ handles: updatedHandles });
    },
    [state.currentNode, updateNode]
  );

  // Remove handle
  const removeHandle = useCallback(
    (handleId: string) => {
      if (!state.currentNode) return;

      const updatedHandles = state.currentNode.handles.filter(
        (handle) => handle.id !== handleId
      );
      updateNode({ handles: updatedHandles });
    },
    [state.currentNode, updateNode]
  );

  // Undo/Redo functionality
  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex > 0) {
        const previousNode = prev.history[prev.historyIndex - 1];
        return {
          ...prev,
          currentNode: previousNode,
          historyIndex: prev.historyIndex - 1,
          unsavedChanges: true,
        };
      }
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex < prev.history.length - 1) {
        const nextNode = prev.history[prev.historyIndex + 1];
        return {
          ...prev,
          currentNode: nextNode,
          historyIndex: prev.historyIndex + 1,
          unsavedChanges: true,
        };
      }
      return prev;
    });
  }, []);

  // Generate final node configuration
  const generateNodeConfig = useCallback((): NodeConfiguration<any> | null => {
    if (!state.currentNode) return null;

    const { currentNode } = state;

    return {
      metadata: {
        nodeType: currentNode.nodeType,
        displayName: currentNode.displayName,
        category: currentNode.category,
        description: currentNode.description,
        icon: currentNode.icon || "default",
        folder: currentNode.experimental ? "experimental" : "main",
        version: currentNode.version,
        author: currentNode.author,
        tags: currentNode.tags,
        deprecated: currentNode.deprecated,
        experimental: currentNode.experimental,
      },

      handles: currentNode.handles.map((handle) => ({
        id: handle.id,
        type: handle.type,
        position: handle.position,
        dataType: handle.dataType,
        description: handle.description,
        enabled: true,
        validation: handle.validation
          ? new Function("data", handle.validation)
          : undefined,
      })),

      size: {
        collapsed: {
          width: Math.min(currentNode.size.width, 200),
          height: Math.min(currentNode.size.height, 100),
        },
        expanded: currentNode.size,
      },

      defaultData: currentNode.defaultData,

      security: currentNode.security,
      performance: currentNode.performance,

      processLogic: async () => {
        console.log(`Processing ${currentNode.nodeType}...`);
      },

      renderCollapsed: () =>
        React.createElement("div", {
          className: "node-collapsed",
          children: currentNode.displayName,
        }),

      renderExpanded: () =>
        React.createElement("div", {
          className: "node-expanded",
          children: [
            React.createElement(
              "h3",
              { key: "title" },
              currentNode.displayName
            ),
            React.createElement(
              "p",
              { key: "description" },
              currentNode.description
            ),
          ],
        }),

      autoRegister: true,
    } as NodeConfiguration<any>;
  }, [state.currentNode]);

  // Save node
  const saveNode = useCallback(() => {
    const nodeConfig = generateNodeConfig();
    if (nodeConfig && onSave) {
      onSave(nodeConfig);
      setState((prev) => ({ ...prev, unsavedChanges: false }));
    }
  }, [generateNodeConfig, onSave]);

  // Toggle preview mode
  const togglePreview = useCallback(() => {
    setState((prev) => ({ ...prev, previewMode: !prev.previewMode }));

    if (builderConfig.enableRealTimePreview && state.currentNode && onPreview) {
      onPreview(state.currentNode);
    }
  }, [builderConfig.enableRealTimePreview, state.currentNode, onPreview]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "z":
            event.preventDefault();
            if (event.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case "s":
            event.preventDefault();
            saveNode();
            break;
          case "p":
            event.preventDefault();
            togglePreview();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [undo, redo, saveNode, togglePreview]);

  // Initialize with new node on mount
  useEffect(() => {
    const autoSaved = localStorage.getItem("visual-builder-autosave");
    if (autoSaved) {
      try {
        const savedNode = JSON.parse(autoSaved);
        setState((prev) => ({
          ...prev,
          currentNode: savedNode,
          unsavedChanges: true,
        }));
        addToHistory(savedNode);
      } catch (error) {
        console.warn("Failed to restore auto-saved node:", error);
        initializeNewNode();
      }
    } else {
      initializeNewNode();
    }
  }, [initializeNewNode, addToHistory]);

  // Clean up auto-save timeout
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  if (!state.currentNode) {
    return (
      <div className="visual-builder-loading">
        <div className="loading-spinner" />
        <p>Initializing Visual Builder...</p>
      </div>
    );
  }

  return (
    <NodeErrorBoundary
      nodeType="visual-builder"
      enableAutoRecovery={true}
      onError={(error) => {
        console.error("Visual Builder Error:", error);
        setState((prev) => ({
          ...prev,
          errors: [...prev.errors, error.message],
        }));
      }}
    >
      <div
        className={`visual-node-builder ${builderConfig.theme} ${className}`}
        data-testid="visual-node-builder"
        role={builderConfig.enableAccessibility ? "application" : undefined}
        aria-label={
          builderConfig.enableAccessibility ? "Visual Node Builder" : undefined
        }
      >
        {/* Toolbar */}
        <ToolbarComponent
          config={builderConfig}
          state={state}
          onUndo={undo}
          onRedo={redo}
          onSave={saveNode}
          onPreview={togglePreview}
          onAddHandle={addHandle}
          canUndo={state.historyIndex > 0}
          canRedo={state.historyIndex < state.history.length - 1}
        />

        {/* Main workspace */}
        <div className="builder-workspace">
          {/* Properties panel */}
          <PropertiesPanel
            nodeConfig={state.currentNode}
            selectedHandle={state.selectedHandle}
            onUpdateNode={updateNode}
            onUpdateHandle={updateHandle}
            onSelectHandle={(handle) =>
              setState((prev) => ({
                ...prev,
                selectedHandle: handle,
              }))
            }
          />

          {/* Canvas */}
          <CanvasComponent
            ref={canvasRef}
            config={builderConfig}
            nodeConfig={state.currentNode}
            selectedHandle={state.selectedHandle}
            onUpdateNode={updateNode}
            onUpdateHandle={updateHandle}
            onRemoveHandle={removeHandle}
            onSelectHandle={(handle) =>
              setState((prev) => ({
                ...prev,
                selectedHandle: handle,
              }))
            }
            previewMode={state.previewMode}
          />

          {/* Handle library */}
          <HandleLibrary
            onAddHandle={addHandle}
            isDragging={state.isDragging}
            onDragStart={() =>
              setState((prev) => ({ ...prev, isDragging: true }))
            }
            onDragEnd={() =>
              setState((prev) => ({ ...prev, isDragging: false }))
            }
          />
        </div>

        {/* Status bar */}
        <StatusBar
          errors={state.errors}
          warnings={state.warnings}
          unsavedChanges={state.unsavedChanges}
          nodeConfig={state.currentNode}
        />

        {/* Preview panel (if enabled) */}
        {state.previewMode && builderConfig.enableRealTimePreview && (
          <PreviewPanel
            nodeConfig={state.currentNode}
            generatedConfig={generateNodeConfig()}
            onClose={() =>
              setState((prev) => ({ ...prev, previewMode: false }))
            }
          />
        )}
      </div>
    </NodeErrorBoundary>
  );
};

// Component implementations
const ToolbarComponent: React.FC<{
  config: VisualBuilderConfig;
  state: BuilderState;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onPreview: () => void;
  onAddHandle: (
    type: "source" | "target",
    position: Position,
    dataType?: string
  ) => void;
  canUndo: boolean;
  canRedo: boolean;
}> = ({
  config,
  state,
  onUndo,
  onRedo,
  onSave,
  onPreview,
  onAddHandle,
  canUndo,
  canRedo,
}) => {
  return (
    <div className="builder-toolbar">
      <div className="toolbar-section">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="toolbar-button"
          title="Undo (Ctrl+Z)"
        >
          ↶ Undo
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="toolbar-button"
          title="Redo (Ctrl+Shift+Z)"
        >
          ↷ Redo
        </button>
      </div>

      <div className="toolbar-section">
        <button
          onClick={() => onAddHandle("target", Position.Left)}
          className="toolbar-button"
          title="Add Input Handle"
        >
          + Input
        </button>
        <button
          onClick={() => onAddHandle("source", Position.Right)}
          className="toolbar-button"
          title="Add Output Handle"
        >
          + Output
        </button>
      </div>

      <div className="toolbar-section">
        <button
          onClick={onPreview}
          className={`toolbar-button ${state.previewMode ? "active" : ""}`}
          title="Toggle Preview (Ctrl+P)"
        >
          👁 Preview
        </button>
        <button
          onClick={onSave}
          className="toolbar-button primary"
          disabled={!state.unsavedChanges}
          title="Save Node (Ctrl+S)"
        >
          💾 Save
        </button>
      </div>
    </div>
  );
};

const PropertiesPanel: React.FC<{
  nodeConfig: VisualNodeConfig;
  selectedHandle: VisualHandle | null;
  onUpdateNode: (updates: Partial<VisualNodeConfig>) => void;
  onUpdateHandle: (handleId: string, updates: Partial<VisualHandle>) => void;
  onSelectHandle: (handle: VisualHandle | null) => void;
}> = ({
  nodeConfig,
  selectedHandle,
  onUpdateNode,
  onUpdateHandle,
  onSelectHandle,
}) => {
  if (selectedHandle) {
    return (
      <div className="properties-panel">
        <h3>Handle Properties</h3>
        <button onClick={() => onSelectHandle(null)}>← Back to Node</button>

        <div className="property-group">
          <label>Label:</label>
          <input
            type="text"
            value={selectedHandle.label}
            onChange={(e) =>
              onUpdateHandle(selectedHandle.id, { label: e.target.value })
            }
          />
        </div>

        <div className="property-group">
          <label>Data Type:</label>
          <select
            value={selectedHandle.dataType}
            onChange={(e) =>
              onUpdateHandle(selectedHandle.id, { dataType: e.target.value })
            }
          >
            <option value="any">Any</option>
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="object">Object</option>
            <option value="array">Array</option>
          </select>
        </div>

        <div className="property-group">
          <label>Required:</label>
          <input
            type="checkbox"
            checked={selectedHandle.required || false}
            onChange={(e) =>
              onUpdateHandle(selectedHandle.id, { required: e.target.checked })
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="properties-panel">
      <h3>Node Properties</h3>

      <div className="property-group">
        <label>Node Type:</label>
        <input
          type="text"
          value={nodeConfig.nodeType}
          onChange={(e) => onUpdateNode({ nodeType: e.target.value })}
          placeholder="e.g., dataProcessor"
        />
      </div>

      <div className="property-group">
        <label>Display Name:</label>
        <input
          type="text"
          value={nodeConfig.displayName}
          onChange={(e) => onUpdateNode({ displayName: e.target.value })}
        />
      </div>

      <div className="property-group">
        <label>Category:</label>
        <select
          value={nodeConfig.category}
          onChange={(e) =>
            onUpdateNode({
              category: e.target.value as VisualNodeConfig["category"],
            })
          }
        >
          <option value="create">Create</option>
          <option value="transform">Transform</option>
          <option value="output">Output</option>
          <option value="utility">Utility</option>
          <option value="testing">Testing</option>
        </select>
      </div>

      <div className="property-group">
        <label>Description:</label>
        <textarea
          value={nodeConfig.description}
          onChange={(e) => onUpdateNode({ description: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  );
};

const CanvasComponent = React.forwardRef<
  HTMLDivElement,
  {
    config: VisualBuilderConfig;
    nodeConfig: VisualNodeConfig;
    selectedHandle: VisualHandle | null;
    onUpdateNode: (updates: Partial<VisualNodeConfig>) => void;
    onUpdateHandle: (handleId: string, updates: Partial<VisualHandle>) => void;
    onRemoveHandle: (handleId: string) => void;
    onSelectHandle: (handle: VisualHandle | null) => void;
    previewMode: boolean;
  }
>(
  (
    {
      config,
      nodeConfig,
      selectedHandle,
      onUpdateNode,
      onUpdateHandle,
      onRemoveHandle,
      onSelectHandle,
      previewMode,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`builder-canvas ${previewMode ? "preview-mode" : ""}`}
        style={{
          backgroundImage: config.showGrid
            ? `radial-gradient(circle, #ccc 1px, transparent 1px)`
            : "none",
          backgroundSize: config.showGrid
            ? `${config.gridSize}px ${config.gridSize}px`
            : "auto",
        }}
      >
        <div
          className="visual-node"
          style={{
            left: nodeConfig.position.x,
            top: nodeConfig.position.y,
            width: nodeConfig.size.width,
            height: nodeConfig.size.height,
            border: selectedHandle ? "2px solid #3b82f6" : "1px solid #ccc",
          }}
        >
          <div className="node-header">
            <h3>{nodeConfig.displayName}</h3>
          </div>

          <div className="node-content">
            <p>{nodeConfig.description}</p>
          </div>

          {nodeConfig.handles.map((handle) => (
            <DraggableHandle
              key={handle.id}
              handle={handle}
              isSelected={selectedHandle?.id === handle.id}
              onSelect={() => onSelectHandle(handle)}
              onUpdate={(updates) => onUpdateHandle(handle.id, updates)}
              onRemove={() => onRemoveHandle(handle.id)}
            />
          ))}
        </div>
      </div>
    );
  }
);

const DraggableHandle: React.FC<{
  handle: VisualHandle;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<VisualHandle>) => void;
  onRemove: () => void;
}> = ({ handle, isSelected, onSelect, onUpdate, onRemove }) => {
  return (
    <div
      className={`visual-handle ${handle.type} ${isSelected ? "selected" : ""}`}
      style={{
        left: handle.x,
        top: handle.y,
        backgroundColor: handle.style?.color,
        borderRadius:
          handle.style?.shape === "circle"
            ? "50%"
            : handle.style?.shape === "diamond"
              ? "0"
              : "2px",
        transform: handle.style?.shape === "diamond" ? "rotate(45deg)" : "none",
      }}
      onClick={onSelect}
      onDoubleClick={onRemove}
      title={`${handle.label} (${handle.dataType})\nDouble-click to remove`}
    >
      {handle.label}
    </div>
  );
};

const HandleLibrary: React.FC<{
  onAddHandle: (
    type: "source" | "target",
    position: Position,
    dataType?: string
  ) => void;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}> = ({ onAddHandle, isDragging, onDragStart, onDragEnd }) => {
  const handleTypes = [
    {
      type: "target" as const,
      position: Position.Left,
      label: "Input",
      dataType: "any",
    },
    {
      type: "source" as const,
      position: Position.Right,
      label: "Output",
      dataType: "any",
    },
    {
      type: "target" as const,
      position: Position.Top,
      label: "Trigger",
      dataType: "trigger",
    },
    {
      type: "source" as const,
      position: Position.Bottom,
      label: "Event",
      dataType: "event",
    },
  ];

  return (
    <div className="handle-library">
      <h3>Handle Library</h3>
      {handleTypes.map((handleType, index) => (
        <button
          key={index}
          className="handle-template"
          onClick={() =>
            onAddHandle(
              handleType.type,
              handleType.position,
              handleType.dataType
            )
          }
          onMouseDown={onDragStart}
          onMouseUp={onDragEnd}
        >
          {handleType.label}
        </button>
      ))}
    </div>
  );
};

const StatusBar: React.FC<{
  errors: string[];
  warnings: string[];
  unsavedChanges: boolean;
  nodeConfig: VisualNodeConfig;
}> = ({ errors, warnings, unsavedChanges, nodeConfig }) => {
  return (
    <div className="status-bar">
      <div className="status-section">
        {unsavedChanges && <span className="unsaved">● Unsaved changes</span>}
        {errors.length > 0 && (
          <span className="errors">{errors.length} errors</span>
        )}
        {warnings.length > 0 && (
          <span className="warnings">{warnings.length} warnings</span>
        )}
      </div>

      <div className="status-section">
        <span>{nodeConfig.handles.length} handles</span>
        <span>
          {nodeConfig.size.width}×{nodeConfig.size.height}
        </span>
      </div>
    </div>
  );
};

const PreviewPanel: React.FC<{
  nodeConfig: VisualNodeConfig;
  generatedConfig: NodeConfiguration<any> | null;
  onClose: () => void;
}> = ({ nodeConfig, generatedConfig, onClose }) => {
  return (
    <div className="preview-panel">
      <div className="preview-header">
        <h3>Live Preview</h3>
        <button onClick={onClose}>×</button>
      </div>

      <div className="preview-content">
        <h4>Visual Preview</h4>
        <div className="node-preview">
          <div className="preview-node">
            <h5>{nodeConfig.displayName}</h5>
            <p>{nodeConfig.description}</p>
            <div className="preview-handles">
              {nodeConfig.handles.map((handle) => (
                <div
                  key={handle.id}
                  className={`preview-handle ${handle.type}`}
                >
                  {handle.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <h4>Generated Code</h4>
        <pre className="code-preview">
          {generatedConfig
            ? JSON.stringify(generatedConfig, null, 2)
            : "Invalid configuration"}
        </pre>
      </div>
    </div>
  );
};

export default VisualNodeBuilder;
