"use client";

/**
 * FLOW-ENGINE MARCHING ANTS EDGE - Animated dashed edge for selection focus
 *
 * • Creates a classic “marching ants” stroke animation along the edge path
 * • Direction-aware using CSS animation-direction to show flow along the path
 * • Uses design tokens for consistent contrast across themes
 *
 * Keywords: edges, animation, marching-ants, reactflow, selection-focus
 */

import {
  BaseEdge,
  getBezierPath,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import React, { useEffect } from "react";

// Animation + styling constants, basically centralized for consistency
const EDGE_STROKE_WIDTH = 2 as const;
const EDGE_DASH = 8 as const; // dash length
const EDGE_GAP = 6 as const; // gap length
const EDGE_ANIMATION_MS = 900 as const;

// One-time style injection guard
let areStylesInjected = false;

function ensureMarchingAntsStylesInjected(): void {
  if (typeof document === "undefined" || areStylesInjected) return;

  const style = document.createElement("style");
  style.setAttribute("data-edge-style", "marching-ants");
  style.textContent = `
    @keyframes agenitix-edge-march {
      to { stroke-dashoffset: -${EDGE_DASH + EDGE_GAP}px; }
    }

    .react-flow__edge-path.agenitix-edge--marching {
      stroke: var(--infra-canvas-edge-selected);
      stroke-width: ${EDGE_STROKE_WIDTH}px;
      stroke-dasharray: ${EDGE_DASH} ${EDGE_GAP};
      animation: agenitix-edge-march ${EDGE_ANIMATION_MS}ms linear infinite;
    }

    .react-flow__edge-path.agenitix-edge--marching.agenitix-edge--reverse {
      animation-direction: reverse;
    }
  `;
  document.head.appendChild(style);
  areStylesInjected = true;
}

export type MarchingAntsEdge = Edge<{
  reverse?: boolean;
}>;

/**
 * Render an animated dashed edge that supports direction via data.reverse.
 */
export function AnimateMarchingAntsEdge(
  props: EdgeProps<MarchingAntsEdge>
): React.JSX.Element {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
  } = props;

  useEffect(() => {
    ensureMarchingAntsStylesInjected();
  }, []);

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isReverse = Boolean(data?.reverse);

  return (
    <BaseEdge
      id={id as string}
      path={edgePath}
      className={`agenitix-edge--marching${isReverse ? " agenitix-edge--reverse" : ""}`}
    />
  );
}

export default AnimateMarchingAntsEdge;
