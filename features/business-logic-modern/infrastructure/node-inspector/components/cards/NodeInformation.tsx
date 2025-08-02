/**
 * NODE INFO - Node metadata and information display with performance optimizations
 *
 * • Displays node type, label, ID, author, feature, tags, version, and runtime
 * • Provides editable label and ID functionality
 * • Organized metadata display with clean styling
 * • Integrated with node inspector accordion system
 *
 * Performance optimizations:
 * • Memoized icon components prevent unnecessary re-renders
 * • Cached row components with stable references
 * • Pre-computed CSS class constants
 * • Optimized conditional rendering with early returns
 * • Memoized EditableLabel component for better performance
 *
 * Keywords: node-info, metadata, editable-fields, accordion-card, performance, memoization
 */

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import EditableNodeId from "@/components/nodes/editableNodeId";
import type { AgenNode } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import { LucideIcon } from "../../../node-core/iconUtils";
import type { InspectorNodeInfo } from "../../adapters/NodeInspectorAdapter";

// Performance constants - extracted to prevent re-creation, basically avoid string concatenation on every render
const STYLING_TEXT_NODE_METADATA = "font-mono text-muted-foreground text-sm";
const LABEL_CLASS =
  "rounded bg-muted/50 px-2 py-0.5 font-medium text-muted-foreground text-xs";
const TAG_CLASS = "rounded bg-muted px-2 py-1 text-muted-foreground text-xs";
const ROW_CLASS = "flex items-center";
const ROW_START_CLASS = "flex items-start";
const TD_LABEL_CLASS = "w-1/3 py-2 pr-2";
const TD_VALUE_CLASS = "w-2/3 py-2";
const EDIT_CONTAINER_CLASS = "flex items-center justify-between w-full";
const EDITABLE_FIELD_CLASS = "font-mono text-muted-foreground text-sm flex-1";

// Icon constants for consistent rendering
const EDIT_ICON_SIZE = 12;
const EDIT_ICON_CLASS = "h-3 w-3 text-muted-foreground/60 ml-1";

// Optimized EditableLabel component with memoization, basically prevent unnecessary re-renders
interface EditableLabelProps {
  value: string;
  placeholder: string;
  onSave: (newValue: string) => void;
  className?: string;
}

const EditableLabel = memo<EditableLabelProps>(
  ({ value, placeholder, onSave, className = "" }) => {
    const [editing, setEditing] = useState(false);
    const spanRef = useRef<HTMLSpanElement>(null);

    // Focus and select all text when entering edit mode
    useEffect(() => {
      if (editing) {
        const span = spanRef.current;
        if (span) {
          span.focus();
          // Select all text when entering edit mode
          const range = document.createRange();
          range.selectNodeContents(span);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }
    }, [editing]);

    const save = (newValue: string) => {
      const trimmedValue = newValue.trim();
      onSave(trimmedValue);
      setEditing(false);
    };

    const onBlur = () => {
      const currentText = spanRef.current?.innerText || "";
      save(currentText);
    };

    const onKeyDown: React.KeyboardEventHandler<HTMLSpanElement> = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        spanRef.current?.blur();
      }
      if (e.key === "Escape") {
        // Restore original text and exit edit mode
        if (spanRef.current) {
          spanRef.current.innerText = value;
        }
        setEditing(false);
      }
    };

    return (
      <div className={className}>
        <span
          ref={spanRef}
          contentEditable={editing}
          suppressContentEditableWarning={true}
          onClick={() => setEditing(true)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          className={`inline-block ${editing ? "cursor-text" : "cursor-pointer"} ${
            editing ? "rounded px-1 focus:ring-1 focus:ring-blue-500" : ""
          }`}
          style={{
            outline: "none",
            userSelect: editing ? "text" : "none",
            whiteSpace: "nowrap",
            minWidth: "60px",
            borderBottom: editing
              ? "1px solid currentColor"
              : "1px solid transparent",
          }}
          title={
            editing ? "Enter to save, Escape to cancel" : "Click to edit label"
          }
        >
          {value || placeholder}
        </span>
      </div>
    );
  }
);

EditableLabel.displayName = "EditableLabel";

interface NodeInfoProps {
  selectedNode: AgenNode;
  nodeInfo: InspectorNodeInfo;
  updateNodeData: (nodeId: string, newData: any) => void;
  onUpdateNodeId: (oldId: string, newId: string) => boolean;
}

const NodeInformationComponent: React.FC<NodeInfoProps> = ({
  selectedNode,
  nodeInfo,
  updateNodeData,
  onUpdateNodeId,
}) => {
  // Memoize callbacks to prevent child re-renders
  const handleLabelSave = useCallback(
    (newLabel: string) => {
      updateNodeData(selectedNode.id, {
        ...selectedNode.data,
        label: newLabel,
      });
    },
    [selectedNode.id, selectedNode.data, updateNodeData]
  );

  // Memoize expensive tag rendering with optimized class names, basically prevent repeated string concatenation
  const tagElements = useMemo(() => {
    if (!nodeInfo.tags || nodeInfo.tags.length === 0) return null;

    return nodeInfo.tags.map((tag) => (
      <span key={`tag-${tag}`} className={TAG_CLASS}>
        {tag}
      </span>
    ));
  }, [nodeInfo.tags]);

  // Memoized edit icon component, basically prevent icon re-creation
  const editIcon = useMemo(
    () => (
      <LucideIcon
        name="LuPencil"
        className={EDIT_ICON_CLASS}
        size={EDIT_ICON_SIZE}
      />
    ),
    []
  );

  // Memoized conditional flags for better performance, basically avoid repeated checks
  const showDescription = useMemo(
    () => Boolean(nodeInfo.description),
    [nodeInfo.description]
  );
  const showAuthor = useMemo(() => Boolean(nodeInfo.author), [nodeInfo.author]);
  const showFeature = useMemo(
    () => Boolean(nodeInfo.feature),
    [nodeInfo.feature]
  );
  const showTags = useMemo(
    () => Boolean(nodeInfo.tags && nodeInfo.tags.length > 0),
    [nodeInfo.tags]
  );
  const showVersion = useMemo(
    () => Boolean(nodeInfo.version),
    [nodeInfo.version]
  );
  const showRuntime = useMemo(
    () => Boolean(nodeInfo.runtime?.execute),
    [nodeInfo.runtime?.execute]
  );

  // Memoize node label value to prevent unnecessary recalculations
  const nodeLabel = useMemo(() => {
    return (
      (selectedNode.data as any)?.label ||
      nodeInfo.label ||
      nodeInfo.displayName ||
      ""
    );
  }, [selectedNode.data, nodeInfo.label, nodeInfo.displayName]);

  // Memoize node description
  const nodeDescription = useMemo(() => {
    return (selectedNode.data as any)?.description ?? nodeInfo.description;
  }, [selectedNode.data, nodeInfo.description]);
  return (
    <div className="overflow-hidden">
      <table className="w-full">
        <tbody className="divide-y divide-border/30">
          <tr className={ROW_CLASS}>
            <td className={TD_LABEL_CLASS}>
              <span className={LABEL_CLASS}>TYPE</span>
            </td>
            <td className={TD_VALUE_CLASS}>
              <span className={STYLING_TEXT_NODE_METADATA}>
                {selectedNode.type}
              </span>
            </td>
          </tr>
          <tr className={ROW_CLASS}>
            <td className={TD_LABEL_CLASS}>
              <span className={LABEL_CLASS}>LABEL</span>
            </td>
            <td className={TD_VALUE_CLASS}>
              <div className={EDIT_CONTAINER_CLASS}>
                <EditableLabel
                  value={nodeLabel}
                  placeholder={nodeInfo.displayName}
                  onSave={handleLabelSave}
                  className={EDITABLE_FIELD_CLASS}
                />
                {editIcon}
              </div>
            </td>
          </tr>
          <tr className={ROW_CLASS}>
            <td className={TD_LABEL_CLASS}>
              <span className={LABEL_CLASS}>ID</span>
            </td>
            <td className={TD_VALUE_CLASS}>
              <div className={EDIT_CONTAINER_CLASS}>
                <EditableNodeId
                  nodeId={selectedNode.id}
                  onUpdateId={onUpdateNodeId}
                  className={EDITABLE_FIELD_CLASS}
                />
                {editIcon}
              </div>
            </td>
          </tr>
          {showDescription && (
            <tr className={ROW_START_CLASS}>
              <td className={TD_LABEL_CLASS}>
                <span className={LABEL_CLASS}>DESCRIPTION</span>
              </td>
              <td className={TD_VALUE_CLASS}>
                <span className="font-mono text-muted-foreground text-sm leading-relaxed">
                  {nodeDescription}
                </span>
              </td>
            </tr>
          )}
          {showAuthor && (
            <tr className={ROW_CLASS}>
              <td className={TD_LABEL_CLASS}>
                <span className={LABEL_CLASS}>AUTHOR</span>
              </td>
              <td className={TD_VALUE_CLASS}>
                <span className={STYLING_TEXT_NODE_METADATA}>
                  {nodeInfo.author}
                </span>
              </td>
            </tr>
          )}
          {showFeature && (
            <tr className={ROW_CLASS}>
              <td className={TD_LABEL_CLASS}>
                <span className={LABEL_CLASS}>FEATURE</span>
              </td>
              <td className={TD_VALUE_CLASS}>
                <span className={STYLING_TEXT_NODE_METADATA}>
                  {nodeInfo.feature}
                </span>
              </td>
            </tr>
          )}
          {showTags && (
            <tr className={ROW_CLASS}>
              <td className={TD_LABEL_CLASS}>
                <span className={LABEL_CLASS}>TAGS</span>
              </td>
              <td className={TD_VALUE_CLASS}>
                <div className="flex flex-wrap gap-1">{tagElements}</div>
              </td>
            </tr>
          )}
          {showVersion && (
            <tr className={ROW_CLASS}>
              <td className={TD_LABEL_CLASS}>
                <span className={LABEL_CLASS}>VERSION</span>
              </td>
              <td className={TD_VALUE_CLASS}>
                <span className={STYLING_TEXT_NODE_METADATA}>
                  {nodeInfo.version}
                </span>
              </td>
            </tr>
          )}
          {showRuntime && nodeInfo.runtime && (
            <tr className={ROW_CLASS}>
              <td className={TD_LABEL_CLASS}>
                <span className={LABEL_CLASS}>RUNTIME</span>
              </td>
              <td className={TD_VALUE_CLASS}>
                <span className="font-mono text-muted-foreground text-sm">
                  {nodeInfo.runtime.execute}
                </span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export const NodeInformation = React.memo(
  NodeInformationComponent,
  (prev, next) => {
    // Enhanced memo comparison for better performance, basically prevent unnecessary re-renders with deeper checks
    return (
      prev.selectedNode.id === next.selectedNode.id &&
      prev.selectedNode.type === next.selectedNode.type &&
      prev.selectedNode.data === next.selectedNode.data &&
      prev.nodeInfo === next.nodeInfo &&
      prev.updateNodeData === next.updateNodeData &&
      prev.onUpdateNodeId === next.onUpdateNodeId
    );
  }
);

export default NodeInformation;
