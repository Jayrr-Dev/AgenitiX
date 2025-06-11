"use client";

import { useState, useEffect } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Handle,
  Position,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Step definitions for the slideshow
const STEPS = [
  {
    id: 0,
    title: "Initial State",
    description: "Button Node shows FALSE, Display Node shows 'No Data'",
    highlight: [],
    code: "// Initial state - no data has been transferred yet",
    buttonValue: false,
    displayValue: undefined,
    showDataFlow: false,
  },
  {
    id: 1,
    title: "User Clicks Button",
    description: "User interaction triggers the button click event",
    highlight: ["button"],
    code: `// User clicks the button
<button onClick={handleToggle}>
  {value ? "TRUE" : "FALSE"}
</button>`,
    buttonValue: false,
    displayValue: undefined,
    showDataFlow: false,
  },
  {
    id: 2,
    title: "handleToggle() Called",
    description: "Button's click handler is executed, preparing to change state",
    highlight: ["button"],
    code: `const handleToggle = () => {
  const newValue = !value; // Will be TRUE
  setValue(newValue);
  // ... more code
};`,
    buttonValue: false,
    displayValue: undefined,
    showDataFlow: false,
  },
  {
    id: 3,
    title: "Local State Updated",
    description: "Button's internal state changes from FALSE to TRUE",
    highlight: ["button"],
    code: `setValue(true); // Button state updated
// Button re-renders with new value`,
    buttonValue: true,
    displayValue: undefined,
    showDataFlow: false,
  },
  {
    id: 4,
    title: "onDataChange Called",
    description: "Button calls the data change handler to propagate the new value",
    highlight: ["button", "edge"],
    code: `if (data.onDataChange) {
  data.onDataChange(id, { value: true });
}`,
    buttonValue: true,
    displayValue: undefined,
    showDataFlow: true,
  },
  {
    id: 5,
    title: "Find Connected Edges",
    description: "System searches for edges connected to the source node",
    highlight: ["edge"],
    code: `const connectedEdges = edges.filter(
  edge => edge.source === sourceNodeId
);
// Found 1 edge: button-1 → display-1`,
    buttonValue: true,
    displayValue: undefined,
    showDataFlow: true,
  },
  {
    id: 6,
    title: "Identify Target Nodes",
    description: "System identifies which nodes should receive the data",
    highlight: ["edge", "display"],
    code: `// Check if node is a target
const isTarget = connectedEdges.some(
  edge => edge.target === node.id
);
// display-1 is identified as target`,
    buttonValue: true,
    displayValue: undefined,
    showDataFlow: true,
  },
  {
    id: 7,
    title: "Update Target Node Data",
    description: "Target node's data is updated with the new value",
    highlight: ["display"],
    code: `return {
  ...node,
  data: {
    ...node.data,
    receivedValue: true // New value set
  }
};`,
    buttonValue: true,
    displayValue: true,
    showDataFlow: true,
  },
  {
    id: 8,
    title: "React Re-render",
    description: "Display Node re-renders with the new received value",
    highlight: ["display"],
    code: `// Display Node re-renders
const receivedValue = data.receivedValue; // true
// Shows "TRUE" with green styling`,
    buttonValue: true,
    displayValue: true,
    showDataFlow: false,
  },
  {
    id: 9,
    title: "Process Complete",
    description: "Data transfer is complete! Value successfully flowed from Button to Display",
    highlight: [],
    code: "// ✅ Data flow complete - TRUE value now displayed",
    buttonValue: true,
    displayValue: true,
    showDataFlow: false,
  },
];

// Enhanced Button Node with visual feedback
function SlideshowButtonNode({ id, data }: { id: string; data: any }) {
  // Extract props from data object
  const isHighlighted = data?.isHighlighted ?? false;
  const currentValue = data?.currentValue ?? false;
  
  return (
    <div className={`px-4 py-2 shadow-lg rounded-lg bg-white border-2 transition-all duration-500 ${
      isHighlighted ? "border-amber-500 shadow-amber-200 shadow-xl scale-105 ring-2 ring-amber-400" : "border-blue-600"
    }`}>
      <div className="text-sm font-bold text-gray-900 mb-2">Button Node</div>
      <div
        className={`px-3 py-1 rounded text-white font-semibold cursor-pointer transition-all duration-500 ${
          currentValue ? "bg-green-700 hover:bg-green-800" : "bg-red-700 hover:bg-red-800"
        } ${isHighlighted ? "animate-pulse" : ""}`}
      >
        {currentValue ? "TRUE" : "FALSE"}
      </div>
      <div className="text-xs text-gray-800 mt-1 font-medium">
        Current: {currentValue.toString()}
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500"
      />
    </div>
  );
}

// Enhanced Display Node with visual feedback
function SlideshowDisplayNode({ id, data }: { id: string; data: any }) {
  // Extract props from data object
  const isHighlighted = data?.isHighlighted ?? false;
  const currentValue = data?.currentValue;
  
  return (
    <div className={`px-4 py-2 shadow-lg rounded-lg bg-white border-2 transition-all duration-500 ${
      isHighlighted ? "border-amber-500 shadow-amber-200 shadow-xl scale-105 ring-2 ring-amber-400" : "border-green-600"
    }`}>
      <div className="text-sm font-bold text-gray-900 mb-2">Display Node</div>
      <div className="text-center p-2 rounded border border-gray-300 bg-gray-50">
        <div className={`text-lg font-bold transition-all duration-500 ${isHighlighted ? "animate-bounce" : ""} ${
          currentValue === true ? "text-green-800" : 
          currentValue === false ? "text-red-800" : "text-gray-700"
        }`}>
          {currentValue !== undefined ? currentValue.toString() : "No Data"}
        </div>
        <div className={`text-sm font-medium ${
          currentValue === true ? "text-green-700" : 
          currentValue === false ? "text-red-700" : "text-gray-600"
        }`}>
          {currentValue !== undefined ? 
            `Received: ${typeof currentValue}` : "Waiting for input..."}
        </div>
      </div>
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-green-500"
      />
    </div>
  );
}

// Data flow animation component
function DataFlowAnimation({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Animated data packet */}
      <div className="absolute top-1/2 left-[280px] transform -translate-y-1/2 animate-pulse">
        <div className="bg-blue-700 text-white px-3 py-2 rounded-full text-xs font-bold shadow-lg animate-bounce border-2 border-blue-800">
          📊 value: true
        </div>
      </div>
      
      {/* Flow arrows */}
      <div className="absolute top-1/2 left-[260px] transform -translate-y-1/2">
        <div className="flex items-center">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="text-blue-700 text-xl animate-pulse font-bold"
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              →
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideshowFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const step = STEPS[currentStep];

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= STEPS.length - 1) {
          setIsAutoPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2500);

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const nodeTypes = {
    slideshowButton: SlideshowButtonNode,
    slideshowDisplay: SlideshowDisplayNode,
  };

  const nodes: Node[] = [
    {
      id: "button-1",
      type: "slideshowButton",
      position: { x: 100, y: 100 },
      data: { 
        isHighlighted: step.highlight.includes("button"),
        currentValue: step.buttonValue,
      },
    },
    {
      id: "display-1",
      type: "slideshowDisplay", 
      position: { x: 400, y: 100 },
      data: { 
        isHighlighted: step.highlight.includes("display"),
        currentValue: step.displayValue,
      },
    },
  ];

  const edges: Edge[] = [
    {
      id: "edge-1",
      source: "button-1",
      target: "display-1",
      type: "default",
          style: { 
      stroke: step.highlight.includes("edge") ? "#d97706" : "#1d4ed8", 
      strokeWidth: step.highlight.includes("edge") ? 4 : 3,
    },
      animated: step.highlight.includes("edge"),
    },
  ];

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  const resetToStart = () => {
    setCurrentStep(0);
    setIsAutoPlaying(false);
  };

  return (
    <div className="w-full h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🎬 Data Flow Slideshow - Slow Motion
        </h1>
        <p className="text-gray-700 font-medium">
          Step-by-step visualization of how data flows between React Flow nodes
        </p>
      </div>

      {/* Main content */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Flow visualization */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-100"
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
          />
          
          {/* Data flow animation overlay */}
          <DataFlowAnimation show={step.showDataFlow} />
        </div>

        {/* Step information panel */}
        <div className="w-96 bg-white border-l border-gray-300 p-6 overflow-y-auto">
          {/* Step indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-800">
                Step {currentStep + 1} of {STEPS.length}
              </span>
              <div className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                {Math.round(((currentStep + 1) / STEPS.length) * 100)}%
              </div>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-3 border border-gray-400">
              <div 
                className="bg-blue-700 h-full rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step details */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {step.title}
            </h2>
            <p className="text-gray-800 leading-relaxed font-medium">
              {step.description}
            </p>
          </div>

          {/* Code snippet */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 mb-2">
              📝 Code at this step:
            </h3>
            <pre className="bg-gray-900 text-green-300 p-4 rounded-lg text-sm overflow-x-auto border-2 border-gray-700">
              <code className="font-medium">{step.code}</code>
            </pre>
          </div>

          {/* Current state */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-bold text-blue-900 mb-2">
              📊 Current State:
            </h3>
            <div className="text-sm space-y-1 font-medium">
              <div className="text-gray-900">Button Value: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-blue-800">{step.buttonValue.toString()}</span></div>
              <div className="text-gray-900">Display Value: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-blue-800">
                {step.displayValue !== undefined ? step.displayValue.toString() : "undefined"}
              </span></div>
              <div className="text-gray-900">Data Flowing: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-blue-800">{step.showDataFlow ? "Yes" : "No"}</span></div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex-1 px-3 py-2 bg-gray-300 text-gray-900 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition-colors border border-gray-400"
              >
                ← Previous
              </button>
              <button
                onClick={nextStep}
                disabled={currentStep === STEPS.length - 1}
                className="flex-1 px-3 py-2 bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-800 transition-colors border border-blue-800"
              >
                Next →
              </button>
            </div>
            
            <button
              onClick={toggleAutoPlay}
              className={`w-full px-3 py-2 rounded-lg font-semibold transition-colors border-2 ${
                isAutoPlaying 
                  ? "bg-red-700 hover:bg-red-800 text-white border-red-800" 
                  : "bg-green-700 hover:bg-green-800 text-white border-green-800"
              }`}
            >
              {isAutoPlaying ? "⏸️ Pause Auto-Play" : "▶️ Start Auto-Play"}
            </button>
            
            <button
              onClick={resetToStart}
              className="w-full px-3 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors border-2 border-gray-800"
            >
              🔄 Reset to Start
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TestSlideshowPage() {
  return (
    <ReactFlowProvider>
      <SlideshowFlow />
    </ReactFlowProvider>
  );
} 