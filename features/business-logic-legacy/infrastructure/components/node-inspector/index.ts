// Main component
export { default as NodeInspector } from './NodeInspector';

// Types
export * from './types';

// Components
export { NodeHeader } from './components/NodeHeader';
export { NodeOutput } from './components/NodeOutput';
export { NodeControls } from './components/NodeControls';
export { ErrorLog } from './components/ErrorLog';

// Controls
export { BaseControl, StatusBadge, ActionButton } from './controls/BaseControl';
export { TextNodeControl } from './controls/TextNodeControl';
export * from './controls/TriggerControls';

// Utils
export { JsonHighlighter } from './utils/JsonHighlighter';

// Hooks
export { useInspectorState } from './hooks/useInspectorState';

// Constants
export * from './constants'; 