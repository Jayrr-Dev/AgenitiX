/**
 * Simple placeholder component for nodes without implemented components
 */
import React from "react";

interface PlaceholderNodeComponentProps {
  data: any;
  nodeType?: string;
}

export const PlaceholderNodeComponent: React.FC<
  PlaceholderNodeComponentProps
> = ({ data, nodeType = "Unknown" }) => {
  return (
    <div
      style={{
        padding: "8px 12px",
        background: "#f5f5f5",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "12px",
        color: "#666",
        textAlign: "center",
        minWidth: "120px",
        minHeight: "60px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{nodeType}</div>
      <div style={{ fontSize: "10px", opacity: 0.7 }}>
        Component Not Implemented
      </div>
    </div>
  );
};

export default PlaceholderNodeComponent;
