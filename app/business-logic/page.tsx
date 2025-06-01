"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// ============================================================================
// DYNAMIC IMPORTS FOR CLIENT-SIDE COMPONENTS
// ============================================================================

// Import the FlowEditor dynamically to avoid SSR issues
const FlowEditor = dynamic(
  () =>
    import(
      "@/features/business-logic-modern/infrastructure/flow-engine/FlowEditor"
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        Loading Flow Editor...
      </div>
    ),
  }
);

// ============================================================================
// BUSINESS LOGIC TEST PAGE
// ============================================================================

export default function BusinessLogicTestPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "editor" | "stats" | "registry" | "docs"
  >("editor");

  // Ensure client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Loading Modern Business Logic System...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🚀 Modern Business Logic System
            </h1>
            <p className="text-gray-600">
              Testing and showcasing the enterprise-grade flow editor with
              domain-driven architecture
            </p>
          </div>

          {/* NAVIGATION TABS */}
          <div className="flex space-x-8 border-t pt-4">
            {[
              {
                key: "editor",
                label: "🎯 Flow Editor",
                desc: "Interactive node editor",
              },
              {
                key: "stats",
                label: "📊 System Stats",
                desc: "Performance metrics",
              },
              {
                key: "registry",
                label: "📋 Node Registry",
                desc: "Available components",
              },
              {
                key: "docs",
                label: "📚 Architecture",
                desc: "System overview",
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`pb-4 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="text-left">
                  <div>{tab.label}</div>
                  <div className="text-xs text-gray-400">{tab.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "editor" && <FlowEditorSection />}
        {activeTab === "stats" && <SystemStatsSection />}
        {activeTab === "registry" && <NodeRegistrySection />}
        {activeTab === "docs" && <ArchitectureSection />}
      </div>
    </div>
  );
}

// ============================================================================
// FLOW EDITOR SECTION
// ============================================================================

function FlowEditorSection() {
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Interactive Flow Editor
        </h2>
        <p className="text-gray-600">
          Drag and drop nodes to create flows. Test the modern system's
          capabilities.
        </p>
      </div>

      <div className="h-[600px] relative">
        <FlowEditor />
      </div>

      <div className="p-4 bg-gray-50 border-t">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            ✅ Domain-Driven Architecture
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✅ Memory Leak Prevention
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            ✅ Clean Import Aliases
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            ✅ TypeScript Safe
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SYSTEM STATS SECTION
// ============================================================================

function SystemStatsSection() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Simulate loading stats
    const loadStats = async () => {
      // In a real implementation, you'd import and use the actual stats
      const mockStats = {
        domains: {
          "content-creation": { nodes: 2, active: true },
          "automation-triggers": { nodes: 3, active: true },
          "data-visualization": { nodes: 2, active: true },
          "testing-debugging": { nodes: 1, active: true },
        },
        infrastructure: {
          components: 15,
          utilities: 8,
          registries: 1,
        },
        performance: {
          memoryUsage: "24.5 MB",
          loadTime: "127ms",
          renderTime: "8ms",
        },
      };

      setTimeout(() => setStats(mockStats), 500);
    };

    loadStats();
  }, []);

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="animate-pulse">Loading system statistics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* DOMAIN STATS */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Business Domains
          </h2>
          <p className="text-gray-600">Status of each domain in the system</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(stats.domains).map(
              ([domain, info]: [string, any]) => (
                <div key={domain} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 capitalize">
                      {domain.replace("-", " ")}
                    </h3>
                    <div
                      className={`w-2 h-2 rounded-full ${info.active ? "bg-green-400" : "bg-red-400"}`}
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    {info.nodes} nodes available
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* INFRASTRUCTURE STATS */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Infrastructure
          </h2>
          <p className="text-gray-600">Shared services and utilities</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.infrastructure.components}
              </div>
              <div className="text-sm text-gray-600">UI Components</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.infrastructure.utilities}
              </div>
              <div className="text-sm text-gray-600">Utilities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.infrastructure.registries}
              </div>
              <div className="text-sm text-gray-600">Registries</div>
            </div>
          </div>
        </div>
      </div>

      {/* PERFORMANCE STATS */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Performance Metrics
          </h2>
          <p className="text-gray-600">System performance indicators</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(stats.performance).map(
              ([key, value]: [string, any]) => (
                <div key={key} className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {value}
                  </div>
                  <div className="text-sm text-gray-600 capitalize">
                    {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// NODE REGISTRY SECTION
// ============================================================================

function NodeRegistrySection() {
  const availableNodes = [
    {
      domain: "content-creation",
      nodes: [
        {
          name: "CreateTextEnhanced",
          type: "modern",
          description: "Enhanced text creation with factory pattern",
        },
        {
          name: "CreateTextRefactor",
          type: "refactored",
          description: "Modernized legacy text creator",
        },
      ],
    },
    {
      domain: "automation-triggers",
      nodes: [
        {
          name: "CyclePulseEnhanced",
          type: "modern",
          description: "Advanced cycle pulse with monitoring",
        },
        {
          name: "TriggerToggleEnhanced",
          type: "modern",
          description: "Enhanced toggle trigger system",
        },
        {
          name: "TriggerOnToggleRefactor",
          type: "refactored",
          description: "Modernized toggle trigger",
        },
      ],
    },
    {
      domain: "data-visualization",
      nodes: [
        {
          name: "ViewOutputEnhanced",
          type: "modern",
          description: "Advanced output visualization",
        },
        {
          name: "ViewOutputRefactor",
          type: "refactored",
          description: "Modernized output viewer",
        },
      ],
    },
    {
      domain: "testing-debugging",
      nodes: [
        {
          name: "TestErrorRefactored",
          type: "refactored",
          description: "Error testing and debugging",
        },
      ],
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-900">Node Registry</h2>
        <p className="text-gray-600">
          All available nodes organized by business domain
        </p>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          {availableNodes.map((domain) => (
            <div key={domain.domain} className="border rounded-lg">
              <div className="p-4 bg-gray-50 border-b">
                <h3 className="font-medium text-gray-900 capitalize">
                  📁 {domain.domain.replace("-", " ")} Domain
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {domain.nodes.map((node) => (
                    <div
                      key={node.name}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {node.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {node.description}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          node.type === "modern"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {node.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ARCHITECTURE SECTION
// ============================================================================

function ArchitectureSection() {
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-900">
          System Architecture
        </h2>
        <p className="text-gray-600">
          Overview of the domain-driven design implementation
        </p>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          {/* ARCHITECTURE PRINCIPLES */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              🏗️ Architecture Principles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Domain-Driven Design
                </h4>
                <p className="text-sm text-gray-600">
                  Business logic organized by domains rather than technical
                  layers
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Clean Separation
                </h4>
                <p className="text-sm text-gray-600">
                  Complete independence between modern and legacy systems
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Import Aliases
                </h4>
                <p className="text-sm text-gray-600">
                  Semantic imports using @domain, @infrastructure patterns
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Memory Safety
                </h4>
                <p className="text-sm text-gray-600">
                  Advanced cleanup utilities prevent memory leaks
                </p>
              </div>
            </div>
          </div>

          {/* DIRECTORY STRUCTURE */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              📁 Directory Structure
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
              <div className="space-y-1">
                <div>features/business-logic-modern/</div>
                <div className="ml-4">
                  ├── 📁 domains/{" "}
                  <span className="text-gray-500"># Business areas</span>
                </div>
                <div className="ml-8">├── content-creation/</div>
                <div className="ml-8">├── automation-triggers/</div>
                <div className="ml-8">├── data-visualization/</div>
                <div className="ml-8">└── testing-debugging/</div>
                <div className="ml-4">
                  ├── 📁 infrastructure/{" "}
                  <span className="text-gray-500"># Shared services</span>
                </div>
                <div className="ml-8">├── components/</div>
                <div className="ml-8">├── flow-engine/</div>
                <div className="ml-8">├── registries/</div>
                <div className="ml-8">└── theming/</div>
                <div className="ml-4">├── 📁 documentation/</div>
                <div className="ml-4">├── 📁 tooling/</div>
                <div className="ml-4">└── 📁 testing/</div>
              </div>
            </div>
          </div>

          {/* BENEFITS */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              🎯 Benefits Achieved
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                "Maintainable codebase",
                "Scalable architecture",
                "Team collaboration",
                "Independent deployment",
                "Clear boundaries",
                "Type safety",
              ].map((benefit) => (
                <div key={benefit} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-sm text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
