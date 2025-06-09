import { BaseEdge } from '@xyflow/react';
import { useEffect } from 'react';

// Global CSS for animation (you can scope it with CSS Modules or styled-components)
const style = `
@keyframes dashAnimation {
  to {
    stroke-dashoffset: -10;
  }
}
.animated-edge {
  stroke-dasharray: 4 2;
  stroke: green;
  stroke-width: 2;
  animation: dashAnimation 0.5s linear infinite;
}
`;

// Inject global styles once
function InjectAnimationStyle() {
  useEffect(() => {
    if (document.getElementById('animated-edge-style')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'animated-edge-style';
    styleEl.textContent = style;
    document.head.appendChild(styleEl);
  }, []);
  return null;
}

export default function StepEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
}: {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}) {
  // Midpoint Y for step-style edge
  const centerY = (targetY - sourceY) / 2 + sourceY;

  // L-shaped edge path
  const edgePath = `M ${sourceX} ${sourceY} L ${sourceX} ${centerY} L ${targetX} ${centerY} L ${targetX} ${targetY}`;

  return (
    <>
      <InjectAnimationStyle />
      <BaseEdge id={id} path={edgePath} />
    </>
  );
}
