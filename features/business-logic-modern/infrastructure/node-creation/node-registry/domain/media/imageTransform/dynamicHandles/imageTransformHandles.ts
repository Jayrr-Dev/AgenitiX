/**
 * IMAGE TRANSFORM DYNAMIC HANDLES
 *
 * Generates handles based on active operations and their parameters
 * Each operation can expose input controls and output data
 */

import { Position } from "@xyflow/react";
import type { Handle } from "../../../../schemas/base";

interface ImageOperation {
  id: string;
  type: "resize" | "filter" | "crop" | "rotate" | "blur" | "sharpen";
  enabled: boolean;
  params: Record<string, any>;
}

interface ImageTransformNodeData {
  operations: ImageOperation[];
  processing: {
    quality: number;
    format: string;
    progressive: boolean;
    preserveMetadata: boolean;
  };
  preview: {
    enabled: boolean;
    realTime: boolean;
    showGrid: boolean;
    zoom: number;
  };
}

/**
 * Generate dynamic handles based on active operations
 */
export function generateImageTransformHandles(
  nodeData: ImageTransformNodeData
): Handle[] {
  const handles: Handle[] = [];

  // Static base handles
  handles.push(
    {
      id: "image-input",
      type: "target",
      dataType: "image",
      position: Position.Left,
      label: "Source Image",
      isConnectable: true,
    },
    {
      id: "processed-output",
      type: "source",
      dataType: "image",
      position: Position.Right,
      label: "Processed Image",
      isConnectable: true,
    },
    {
      id: "metadata-output",
      type: "source",
      dataType: "object",
      position: Position.Bottom,
      label: "Image Metadata",
      isConnectable: true,
    }
  );

  // Dynamic operation-based handles
  nodeData.operations.forEach((operation, index) => {
    if (!operation.enabled) return;

    const yOffset = 60 + index * 40;

    // Input handles for operation parameters
    switch (operation.type) {
      case "resize":
        handles.push(
          {
            id: `${operation.id}-width-input`,
            type: "target",
            dataType: "number",
            position: Position.Left,
            label: "Width",
            isConnectable: true,
            style: { top: `${yOffset}px` },
          },
          {
            id: `${operation.id}-height-input`,
            type: "target",
            dataType: "number",
            position: Position.Left,
            label: "Height",
            isConnectable: true,
            style: { top: `${yOffset + 20}px` },
          }
        );
        break;

      case "filter":
        handles.push(
          {
            id: `${operation.id}-brightness-input`,
            type: "target",
            dataType: "number",
            position: Position.Left,
            label: "Brightness",
            isConnectable: true,
            style: { top: `${yOffset}px` },
          },
          {
            id: `${operation.id}-contrast-input`,
            type: "target",
            dataType: "number",
            position: Position.Left,
            label: "Contrast",
            isConnectable: true,
            style: { top: `${yOffset + 20}px` },
          }
        );
        break;

      case "crop":
        handles.push({
          id: `${operation.id}-bounds-input`,
          type: "target",
          dataType: "object",
          position: Position.Left,
          label: "Crop Bounds",
          isConnectable: true,
          style: { top: `${yOffset}px` },
        });
        break;
    }

    // Output handle for operation result
    handles.push({
      id: `${operation.id}-output`,
      type: "source",
      dataType: "image",
      position: Position.Right,
      label: `${operation.type} Result`,
      isConnectable: true,
      style: { top: `${yOffset + 10}px` },
    });
  });

  // Processing controls
  if (nodeData.processing) {
    handles.push({
      id: "quality-input",
      type: "target",
      dataType: "number",
      position: Position.Top,
      label: "Quality",
      isConnectable: true,
      style: { left: "40px" },
    });
  }

  // Preview controls
  if (nodeData.preview?.enabled) {
    handles.push({
      id: "preview-trigger",
      type: "target",
      dataType: "boolean",
      position: Position.Top,
      label: "Trigger Preview",
      isConnectable: true,
      style: { left: "100px" },
    });
  }

  return handles;
}

export default generateImageTransformHandles;
