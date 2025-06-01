'use client'

/* -------------------------------------------------------------------------- */
/*  ENHANCED CENTRALIZED NODE REGISTRY - Complete Auto-Generation            */
/*  – All node metadata in one place: types, configs, controls, imports      */
/*  – Auto-generates types, constants, and inspector mappings               */
/*  – True single-file registration - ZERO external updates needed          */
/* -------------------------------------------------------------------------- */

import React from 'react';
import { Position } from '@xyflow/react';

// ============================================================================
// NODE COMPONENT IMPORTS
// ============================================================================

// Media nodes
import CreateText from './media/CreateText';
import CreateTextRefactor from './media/CreateTextRefactor';
import TurnToUppercase from './media/TurnToUppercase';
import TurnToText from './media/TurnToText';

// Main/Enhanced nodes
import { CreateTextEnhanced } from './main/CreateTextEnhanced';
import { CyclePulseEnhanced } from './main/CyclePulseEnhanced';
import { TriggerToggleEnhanced } from './main/TriggerToggleEnhanced';
import { ViewOutputEnhanced } from './main/ViewOutputEnhanced';
import ViewOutput from './main/ViewOutput';
import ViewOutputRefactor from './main/ViewOutputRefactor';

// Logic nodes (in main folder)
import LogicAnd from './main/LogicAnd';
import LogicOr from './main/LogicOr';
import LogicNot from './main/LogicNot';
import LogicXor from './main/LogicXor';
import LogicXnor from './main/LogicXnor';

// Automation nodes
import TriggerOnClick from './automation/TriggerOnClick';
import TriggerOnPulse from './automation/TriggerOnPulse';
import TriggerOnToggle from './automation/TriggerOnToggle';
import TriggerOnToggleRefactor from './automation/TriggerOnToggleRefactor';
import CyclePulse from './automation/CyclePulse';
import CycleToggle from './automation/CycleToggle';
import TurnToBoolean from './automation/TurnToBoolean';
import CountInput from './automation/CountInput';
import DelayInput from './automation/DelayInput';

// Test/Input nodes (in main folder)
import TestInput from './test/TestInput';
import EditObject from './main/EditObject';
import EditArray from './main/EditArray';

// Test nodes
import TestError from './test/TestError';
import TestJson from './test/TestJson';
import TestErrorRefactored from './test/TestErrorRefactored';

// ============================================================================
// ENHANCED TYPE DEFINITIONS
// ============================================================================

export type NodeCategory = 'create' | 'logic' | 'trigger' | 'test' | 'turn' | 'count' | 'delay' | 'edit' | 'cycle' | 'view';
export type SidebarFolder = 'main' | 'media' | 'automation' | 'test' | 'integrations' | 'misc' | 'testing';
export type InspectorControlType = 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'range' | 'none';

// Enhanced control configuration
export interface ControlField {
  key: string;
  type: InspectorControlType;
  label: string;
  placeholder?: string;
  options?: Array<{ value: any; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
}

export interface ControlGroup {
  title: string;
  fields: ControlField[];
}

// NODE TYPE CONFIGURATION INTERFACE
export interface NodeTypeConfig {
  defaultData: Record<string, any>;
  hasTargetPosition: boolean;
  targetPosition?: Position;
  hasOutput: boolean;
  hasControls: boolean;
  displayName: string;
}

// INSPECTOR CONTROL CONFIGURATION INTERFACE
export interface InspectorControlConfig {
  type: 'factory' | 'legacy' | 'none';
  controlGroups?: ControlGroup[];
  legacyControlType?: string;
}

// Complete node registration interface
export interface EnhancedNodeRegistration {
  // ========================================
  // CORE IDENTIFICATION
  // ========================================
  nodeType: string;
  component: React.ComponentType<any>;
  
  // ========================================
  // UI METADATA
  // ========================================
  label: string;
  description: string;
  icon?: string;
  
  // ========================================
  // ORGANIZATION
  // ========================================
  category: NodeCategory;
  folder: SidebarFolder;
  
  // ========================================
  // TYPE SYSTEM (Auto-generates types/index.ts)
  // ========================================
  dataInterface: Record<string, any>; // TypeScript interface definition
  hasTargetPosition?: boolean;
  targetPosition?: Position;
  
  // ========================================
  // CONFIGURATION (Auto-generates constants/index.ts)
  // ========================================
  defaultData: Record<string, any>;
  hasOutput?: boolean;
  hasControls?: boolean;
  displayName?: string;
  
  // ========================================
  // INSPECTOR CONTROLS (Auto-generates NodeControls.tsx logic)
  // ========================================
  inspectorControls?: {
    type: 'factory' | 'legacy' | 'none';
    controlGroups?: ControlGroup[];
    legacyControlType?: string; // For legacy nodes like 'TextNodeControl'
  };
  
  // ========================================
  // OPTIONAL METADATA
  // ========================================
  tags?: string[];
  deprecated?: boolean;
  experimental?: boolean;
  version?: string;
}

// ============================================================================
// ENHANCED CENTRALIZED NODE REGISTRY
// ============================================================================

export const ENHANCED_NODE_REGISTRY: Record<string, EnhancedNodeRegistration> = {
  // ====================================
  // MAIN FOLDER NODES
  // ====================================
  
  ViewOutput: {
    nodeType: 'viewOutput',
    component: ViewOutput,
    label: 'View Output',
    description: 'Display the final result of your flow. Connect any node to see its output value in a clean, readable format.',
    category: 'view',
    folder: 'main',
    
    // Type system
    dataInterface: {
      label: 'string',
      isActive: 'boolean',
      displayedValues: 'Array<{ type: string; content: any; id: string; }>'
    },
    hasTargetPosition: true,
    targetPosition: Position.Top,
    
    // Configuration  
    defaultData: { 
      label: 'Result', 
      isActive: false,
      displayedValues: []
    },
    hasOutput: true,
    hasControls: true,
    displayName: 'View Output',
    
    // Inspector controls
    inspectorControls: {
      type: 'none' // View nodes typically don't need controls
    }
  },
  
  ViewOutputRefactor: {
    nodeType: 'viewOutputRefactor',
    component: ViewOutputRefactor,
    label: '🔧 View Output (Refactored)',
    description: 'Carbon copy of ViewOutput using centralized registry system. Demonstrates the new modular registration architecture with identical functionality.',
    category: 'view',
    folder: 'testing',
    experimental: true,
    
    // Type system
    dataInterface: {
      displayedValues: 'Array<{ type: string; content: any; id: string; }>',
      isActive: 'boolean'
    },
    hasTargetPosition: true,
    targetPosition: Position.Top,
    
    // Configuration
    defaultData: { 
      displayedValues: [],
      isActive: false 
    },
    hasOutput: true,
    hasControls: false,
    displayName: '🔧 View Output (Refactored)',
    
    // Inspector controls
    inspectorControls: {
      type: 'none'
    }
  },
  
  CreateTextEnhanced: {
    nodeType: 'createTextEnhanced',
    component: CreateTextEnhanced,
    label: '✨ Enhanced Text',
    description: 'Bulletproof CreateText with prefix support, validation, and enterprise architecture. No state sync bugs!',
    category: 'create',
    folder: 'main',
    experimental: true,
    
    // Type system
    dataInterface: {
      text: 'string',
      output: 'string',
      isEnabled: 'boolean',
      prefix: 'string',
      maxLength: 'number',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: { 
      text: '', 
      output: '', 
      isEnabled: true, 
      prefix: '', 
      maxLength: 500, 
      isActive: false 
    },
    hasControls: true,
    displayName: '✨ Enhanced Text',
    
    // Inspector controls
    inspectorControls: {
      type: 'factory' // Uses NodeFactory inspector system
    }
  },
  
  CyclePulseEnhanced: {
    nodeType: 'cyclePulseEnhanced',
    component: CyclePulseEnhanced,
    label: '⚡ Enhanced Pulse',
    description: 'Bulletproof CyclePulse with timer management, burst mode, auto-start, and enterprise architecture. No timer bugs!',
    category: 'cycle',
    folder: 'main',
    experimental: true,
    
    // Type system
    dataInterface: {
      cycleDuration: 'number',
      pulseDuration: 'number',
      infinite: 'boolean',
      maxCycles: 'number',
      autoStart: 'boolean',
      burstMode: 'boolean',
      burstCount: 'number',
      isRunning: 'boolean',
      isPulsing: 'boolean',
      cycleCount: 'number',
      progress: 'number',
      currentPhase: "'waiting' | 'pulsing' | 'stopped'",
      output: 'boolean',
      text: 'string | undefined',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: { 
      cycleDuration: 2000,
      pulseDuration: 500,
      infinite: true,
      maxCycles: 1,
      autoStart: false,
      burstMode: false,
      burstCount: 3,
      isRunning: false,
      isPulsing: false,
      cycleCount: 0,
      progress: 0,
      currentPhase: 'stopped',
      output: false,
      isActive: false 
    },
    hasControls: true,
    displayName: '⚡ Enhanced Pulse',
    
    // Inspector controls
    inspectorControls: {
      type: 'factory'
    }
  },
  
  TriggerToggleEnhanced: {
    nodeType: 'triggerToggleEnhanced',
    component: TriggerToggleEnhanced,
    label: '🔄 Enhanced Toggle',
    description: 'Bulletproof TriggerToggle with auto-toggle mode, pulse mode, and enterprise architecture. No sync issues!',
    category: 'trigger',
    folder: 'main',
    experimental: true,
    
    // Type system  
    dataInterface: {
      triggered: 'boolean',
      autoToggle: 'boolean',
      holdDuration: 'number',
      pulseMode: 'boolean',
      value: 'boolean',
      text: 'string | undefined',
      _pulseTimerId: 'number | undefined',
      _lastTriggerState: 'boolean | undefined',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: { 
      triggered: false,
      autoToggle: false,
      holdDuration: 1000,
      pulseMode: false,
      value: false,
      text: undefined,
      isActive: false 
    },
    hasControls: true,
    displayName: '🔄 Enhanced Toggle',
    
    // Inspector controls
    inspectorControls: {
      type: 'factory'
    }
  },
  
  ViewOutputEnhanced: {
    nodeType: 'viewOutputEnhanced',
    component: ViewOutputEnhanced,
    label: '📤 Enhanced View',
    description: 'Bulletproof ViewOutput with filtering, history, and enhanced data type visualization. Enterprise-grade data viewing!',
    category: 'view',
    folder: 'main',
    experimental: true,
    
    // Type system
    dataInterface: {
      displayedValues: 'Array<{ type: string; content: any; id: string; timestamp?: number; }>',
      maxHistory: 'number',
      autoScroll: 'boolean',
      showTypeIcons: 'boolean',
      groupSimilar: 'boolean',
      filterEmpty: 'boolean',
      filterDuplicates: 'boolean',
      includedTypes: 'string[]',
      text: 'string | undefined',
      _valueHistory: 'Array<{ values: any[]; timestamp: number; }> | undefined',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: { 
      displayedValues: [],
      maxHistory: 10,
      autoScroll: true,
      showTypeIcons: true,
      groupSimilar: false,
      filterEmpty: true,
      filterDuplicates: false,
      includedTypes: [],
      text: undefined,
      isActive: false 
    },
    hasControls: true,
    displayName: '📤 Enhanced View',
    
    // Inspector controls
    inspectorControls: {
      type: 'factory'
    }
  },
  
  LogicAnd: {
    nodeType: 'logicAnd',
    component: LogicAnd,
    label: 'AND (⋀)',
    description: 'Only outputs TRUE when ALL connected inputs are true. Like saying "I need this AND that AND the other thing to proceed."',
    category: 'logic',
    folder: 'main',
    
    // Type system
    dataInterface: {
      value: 'boolean',
      inputCount: 'number | undefined',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: { 
      value: false, 
      inputCount: 2, 
      isActive: false 
    },
    displayName: 'Logic AND',
    
    // Inspector controls
    inspectorControls: {
      type: 'none'
    }
  },
  
  LogicOr: {
    nodeType: 'logicOr',
    component: LogicOr,
    label: 'OR (⋁)',
    description: 'Outputs TRUE when ANY connected input is true. Like saying "I need this OR that OR any of these options to proceed."',
    category: 'logic',
    folder: 'main',
    
    // Type system
    dataInterface: {
      value: 'boolean',
      inputCount: 'number | undefined',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: { 
      value: false, 
      inputCount: 2, 
      isActive: false 
    },
    displayName: 'Logic OR',
    
    // Inspector controls
    inspectorControls: {
      type: 'none'
    }
  },
  
  LogicNot: {
    nodeType: 'logicNot',
    component: LogicNot,
    label: 'NOT (¬)',
    description: 'Flips the input - turns TRUE into FALSE and FALSE into TRUE. Perfect for creating opposite conditions.',
    category: 'logic',
    folder: 'main',
    
    // Type system
    dataInterface: {
      value: 'boolean',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: { 
      value: false, 
      isActive: false 
    },
    displayName: 'Logic NOT',
    
    // Inspector controls
    inspectorControls: {
      type: 'none'
    }
  },
  
  LogicXor: {
    nodeType: 'logicXor',
    component: LogicXor,
    label: 'XOR (⊕)',
    description: 'Only TRUE when exactly one input is true. Like an "either/or" choice - you can have one thing OR another, but not both.',
    category: 'logic',
    folder: 'main',
    
    // Type system
    dataInterface: {
      value: 'boolean',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: { 
      value: false, 
      isActive: false 
    },
    displayName: 'Logic XOR',
    
    // Inspector controls
    inspectorControls: {
      type: 'none'
    }
  },
  
  LogicXnor: {
    nodeType: 'logicXnor',
    component: LogicXnor,
    label: 'XNOR (⊙)',
    description: 'TRUE when all inputs match (all true OR all false). Perfect for checking if things are "in sync" with each other.',
    category: 'logic',
    folder: 'main',
    
    // Type system
    dataInterface: {
      value: 'boolean',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: { 
      value: false, 
      isActive: false 
    },
    displayName: 'Logic XNOR',
    
    // Inspector controls
    inspectorControls: {
      type: 'none'
    }
  },
  
  TestInput: {
    nodeType: 'testInput',
    component: TestInput,
    label: 'Test Input',
    description: 'Create test values to experiment with your flow. Type in any value and see how it affects connected nodes.',
    category: 'test',
    folder: 'main',
    
    // Type system
    dataInterface: {
      value: 'unknown | undefined',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: { 
      value: undefined, 
      isActive: false 
    },
    displayName: 'Test Input',
    
    // Inspector controls
    inspectorControls: {
      type: 'legacy',
      legacyControlType: 'TextNodeControl'
    }
  },
  
  EditObject: {
    nodeType: 'editObject',
    component: EditObject,
    label: 'Edit Object',
    description: 'Create and edit complex data objects with multiple properties. Perfect for structured data like user profiles or settings.',
    category: 'edit',
    folder: 'main',
    
    // Type system
    dataInterface: {
      value: 'Record<string, unknown> | undefined',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: { 
      value: {}, 
      isActive: false 
    },
    displayName: 'Edit Object',
    
    // Inspector controls
    inspectorControls: {
      type: 'legacy',
      legacyControlType: 'TextNodeControl'
    }
  },
  
  EditArray: {
    nodeType: 'editArray',
    component: EditArray,
    label: 'Edit Array',
    description: 'Create and edit lists of items. Great for managing collections like shopping lists, user groups, or data sets.',
    category: 'edit',
    folder: 'main',
    
    // Type system
    dataInterface: {
      value: 'unknown[] | undefined',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: { 
      value: [], 
      isActive: false 
    },
    displayName: 'Edit Array',
    
    // Inspector controls
    inspectorControls: {
      type: 'legacy',
      legacyControlType: 'TextNodeControl'
    }
  },
  
  // ====================================
  // MEDIA FOLDER NODES
  // ====================================
  
  CreateText: {
    nodeType: 'createText',
    component: CreateText,
    label: 'Create Text',
    description: 'Create and edit text content. Use the textarea to type your message, then connect to other nodes to pass the text along.',
    category: 'create',
    folder: 'media',
    
    // Type system
    dataInterface: {
      text: 'string',
      heldText: 'string | undefined',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: { 
      text: '', 
      heldText: '', 
      isActive: false 
    },
    hasControls: true,
    displayName: 'Create Text',
    
    // Inspector controls
    inspectorControls: {
      type: 'legacy',
      legacyControlType: 'TextNodeControl'
    }
  },
  
  CreateTextRefactor: {
    nodeType: 'createTextRefactor',
    component: CreateTextRefactor,
    label: '🔧 Create Text (Refactored)',
    description: 'Enterprise CreateText using new refactored factory system. Carbon copy of original with modular architecture and enhanced performance.',
    category: 'create',
    folder: 'media',
    experimental: true,
    
    // Type system
    dataInterface: {
      text: 'string',
      heldText: 'string | undefined',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: { 
      text: '', 
      heldText: '', 
      isActive: false 
    },
    hasControls: true,
    displayName: '🔧 Create Text (Refactored)',
    
    // Inspector controls
    inspectorControls: {
      type: 'legacy',
      legacyControlType: 'TextNodeControl'
    }
  },
  
  TurnToUppercase: {
    nodeType: 'turnToUppercase',
    component: TurnToUppercase,
    label: 'Turn To Uppercase',
    description: 'Takes any text input and converts it to ALL CAPITAL LETTERS. Perfect for making text stand out or formatting headers.',
    category: 'turn',
    folder: 'media',
    
    // Type system
    dataInterface: {
      text: 'string',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: { 
      text: '', 
      isActive: false 
    },
    displayName: 'Turn To Uppercase',
    
    // Inspector controls
    inspectorControls: {
      type: 'none' // Processing node - no manual input needed
    }
  },
  
  TurnToText: {
    nodeType: 'turnToText',
    component: TurnToText,
    label: 'Turn To Text',
    description: 'Converts any input (numbers, objects, etc.) into readable text. Great for displaying complex data as simple text.',
    category: 'turn',
    folder: 'media',
    
    // Type system
    dataInterface: {
      text: 'string',
      originalValue: 'unknown | undefined',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: { 
      text: '', 
      originalValue: undefined, 
      isActive: false 
    },
    displayName: 'Turn To Text',
    
    // Inspector controls
    inspectorControls: {
      type: 'legacy',
      legacyControlType: 'TextNodeControl'
    }
  },
  
  // ====================================
  // AUTOMATION FOLDER NODES  
  // ====================================
  
  TriggerOnClick: {
    nodeType: 'triggerOnClick',
    component: TriggerOnClick,
    label: 'Trigger',
    description: 'Acts like a gate - click the button to allow data to flow through. Great for controlling when things happen in your flow.',
    category: 'trigger',
    folder: 'automation',
    
    // Type system
    dataInterface: {
      triggered: 'boolean',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: { 
      triggered: false, 
      isActive: false 
    },
    hasControls: true,
    displayName: 'Trigger On Click',
    
    // Inspector controls
    inspectorControls: {
      type: 'legacy',
      legacyControlType: 'TriggerOnClickControl'
    }
  },
  
  TriggerOnPulse: {
    nodeType: 'triggerOnPulse',
    component: TriggerOnPulse,
    label: 'Pulse Trigger',
    description: 'Sends a quick "pulse" signal when clicked. Like pressing a doorbell - one click sends one signal to connected nodes.',
    category: 'trigger',
    folder: 'automation',
    
    // Type system
    dataInterface: {
      triggered: 'boolean',
      duration: 'number | undefined',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: { 
      triggered: false, 
      duration: 500, 
      isActive: false 
    },
    hasControls: true,
    displayName: 'Trigger On Pulse',
    
    // Inspector controls
    inspectorControls: {
      type: 'legacy',
      legacyControlType: 'TriggerOnPulseControl'
    }
  },
  
  TriggerOnToggle: {
    nodeType: 'triggerOnToggle',
    component: TriggerOnToggle,
    label: 'Toggle Trigger',
    description: 'A simple ON/OFF switch. Click to toggle between true and false states. Perfect for enabling/disabling parts of your flow.',
    category: 'trigger',
    folder: 'automation',
    
    // Type system
    dataInterface: {
      triggered: 'boolean',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: { 
      triggered: false, 
      isActive: false 
    },
    hasControls: true,
    displayName: 'Trigger On Toggle',
    
    // Inspector controls
    inspectorControls: {
      type: 'legacy',
      legacyControlType: 'TriggerOnToggleControl'
    }
  },
  
  TriggerOnToggleRefactor: {
    nodeType: 'triggerOnToggleRefactor',
    component: TriggerOnToggleRefactor,
    label: '🔧 Toggle Trigger (Refactored)',
    description: 'Carbon copy of TriggerOnToggle using enhanced registry system. Identical functionality with single-file registration architecture.',
    category: 'trigger',
    folder: 'testing',
    experimental: true,
    
    // Type system
    dataInterface: {
      triggered: 'boolean',
      value: 'boolean',
      outputValue: 'boolean',
      type: 'string',
      label: 'string',
      inputCount: 'number',
      hasExternalInputs: 'boolean',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: { 
      triggered: false,
      value: false,
      outputValue: false,
      type: 'TriggerOnToggleRefactor',
      label: '🔧 Toggle Trigger (Refactored)',
      inputCount: 0,
      hasExternalInputs: false,
      isActive: false 
    },
    hasControls: true,
    displayName: '🔧 Toggle Trigger (Refactored)',
    
    // Inspector controls
    inspectorControls: {
      type: 'legacy',
      legacyControlType: 'TriggerOnToggleControl' // Reuse existing control
    }
  },
  
  CyclePulse: {
    nodeType: 'cyclePulse',
    component: CyclePulse,
    label: 'Cycle Pulse',
    description: 'Automatically sends repeated pulses at timed intervals. Set how often and how many times to create automated sequences.',
    category: 'cycle',
    folder: 'automation',
    
    // Type system
    dataInterface: {
      triggered: 'boolean',
      isRunning: 'boolean | undefined',
      initialState: 'boolean | undefined',
      cycleDuration: 'number | undefined',
      pulseDuration: 'number | undefined',
      infinite: 'boolean | undefined',
      maxCycles: 'number | undefined',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: {
      triggered: false,
      isRunning: false,
      initialState: false,
      cycleDuration: 2000,
      pulseDuration: 500,
      infinite: true,
      maxCycles: 1,
      isActive: false
    },
    hasControls: true,
    displayName: 'Cycle Pulse',
    
    // Inspector controls
    inspectorControls: {
      type: 'legacy',
      legacyControlType: 'CyclePulseControl'
    }
  },
  
  CycleToggle: {
    nodeType: 'cycleToggle',
    component: CycleToggle,
    label: 'Cycle Toggle',
    description: 'Automatically switches between ON and OFF states. Set custom durations for each state to create blinking or cycling patterns.',
    category: 'cycle',
    folder: 'automation',
    
    // Type system
    dataInterface: {
      triggered: 'boolean',
      isRunning: 'boolean | undefined',
      initialState: 'boolean | undefined',
      onDuration: 'number | undefined',
      offDuration: 'number | undefined',
      infinite: 'boolean | undefined',
      maxCycles: 'number | undefined',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: {
      triggered: false,
      isRunning: false,
      initialState: false,
      onDuration: 4000,
      offDuration: 4000,
      infinite: true,
      maxCycles: 1,
      isActive: false
    },
    hasControls: true,
    displayName: 'Cycle Toggle',
    
    // Inspector controls
    inspectorControls: {
      type: 'legacy',
      legacyControlType: 'CycleToggleControl'
    }
  },
  
  TurnToBoolean: {
    nodeType: 'turnToBoolean',
    component: TurnToBoolean,
    label: 'Turn To Boolean',
    description: 'Converts any input into TRUE or FALSE. Numbers become false if zero, text becomes false if empty, etc.',
    category: 'turn',
    folder: 'automation',
    
    // Type system
    dataInterface: {
      value: 'unknown | undefined',
      triggered: 'boolean | undefined',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: { 
      value: '', 
      triggered: false, 
      isActive: false 
    },
    displayName: 'Turn To Boolean',
    
    // Inspector controls
    inspectorControls: {
      type: 'legacy',
      legacyControlType: 'TextNodeControl'
    }
  },
  
  CountInput: {
    nodeType: 'countInput',
    component: CountInput,
    label: 'Count Input',
    description: 'Counts up or down automatically. Set the starting number and step size. Counts each time it receives an input signal.',
    category: 'count',
    folder: 'automation',
    
    // Type system
    dataInterface: {
      count: 'number',
      multiplier: 'number',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: { 
      count: 0, 
      multiplier: 1, 
      isActive: false 
    },
    displayName: 'Count Input',
    
    // Inspector controls
    inspectorControls: {
      type: 'legacy',
      legacyControlType: 'TextNodeControl'
    }
  },
  
  DelayInput: {
    nodeType: 'delayInput',
    component: DelayInput,
    label: 'Delay Input',
    description: 'Adds a time delay to your flow. Data goes in, waits for the specified time, then comes out. Perfect for creating timed sequences.',
    category: 'delay',
    folder: 'automation',
    
    // Type system
    dataInterface: {
      delay: 'number',
      isProcessing: 'boolean | undefined',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: { 
      delay: 1000, 
      isProcessing: false, 
      isActive: false 
    },
    displayName: 'Delay Input',
    
    // Inspector controls
    inspectorControls: {
      type: 'legacy',
      legacyControlType: 'TextNodeControl'
    }
  },
  
  // ====================================
  // TEST FOLDER NODES
  // ====================================
  
  TestError: {
    nodeType: 'testError',
    component: TestError,
    label: 'Error Generator',
    description: 'Generate errors with custom messages and trigger conditions. Outputs JSON for Vibe Mode to set error states on connected nodes. Supports warning/error/critical levels.',
    category: 'test',
    folder: 'test',
    
    // Type system
    dataInterface: {
      errorMessage: 'string',
      errorType: "'warning' | 'error' | 'critical'",
      triggerMode: "'always' | 'trigger_on' | 'trigger_off'",
      isGeneratingError: 'boolean',
      text: 'string',
      json: 'any',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: { 
      errorMessage: 'Custom error message',
      errorType: 'error',
      triggerMode: 'trigger_on',
      isGeneratingError: false,
      text: '',
      json: '',
      isActive: false
    },
    hasControls: true,
    displayName: 'Error Generator',
    
    // Inspector controls
    inspectorControls: {
      type: 'legacy',
      legacyControlType: 'TextNodeControl'
    }
  },
  
  TestErrorRefactored: {
    nodeType: 'testErrorRefactored',
    component: TestErrorRefactored,
    label: '🔧 Error Generator (Refactored)',
    description: 'Refactored Error Generator using the new RefactoredNodeFactory system. Generate errors with custom messages and trigger conditions. Features enhanced enterprise safety layers, GPU acceleration, and ultra-fast propagation. Full error injection support for Vibe Mode.',
    icon: '⚡',
    category: 'test',
    folder: 'testing', // Place in testing folder since it's a refactored version
    
    // Type system
    dataInterface: {
      errorMessage: 'string',
      errorType: "'warning' | 'error' | 'critical'",
      triggerMode: "'always' | 'trigger_on' | 'trigger_off'",
      isGeneratingError: 'boolean',
      isManuallyActivated: 'boolean',
      text: 'string',
      json: 'any',
      isActive: 'boolean',
      // Error injection support
      isErrorState: 'boolean',
      error: 'string'
    },
    hasTargetPosition: true,
    targetPosition: Position.Left,
    
    // Configuration
    defaultData: { 
      errorMessage: 'Custom error message',
      errorType: 'error',
      triggerMode: 'trigger_on',
      isGeneratingError: false,
      isManuallyActivated: false,
      text: '',
      json: '',
      isActive: false
    },
    hasOutput: true,
    hasControls: true,
    displayName: 'Error Generator (Refactored)',
    
    // Inspector controls - Factory type since it uses RefactoredNodeFactory
    inspectorControls: {
      type: 'factory',
      controlGroups: [
        {
          title: 'Error Configuration',
          fields: [
            {
              key: 'errorMessage',
              type: 'textarea',
              label: 'Error Message',
              placeholder: 'Enter custom error message...',
              rows: 3
            },
            {
              key: 'errorType',
              type: 'select',
              label: 'Error Type',
              options: [
                { value: 'warning', label: 'Warning (Yellow)' },
                { value: 'error', label: 'Error (Orange)' },
                { value: 'critical', label: 'Critical (Red)' }
              ]
            },
            {
              key: 'triggerMode',
              type: 'select',
              label: 'Trigger Mode',
              options: [
                { value: 'always', label: 'Always Generate' },
                { value: 'trigger_on', label: 'Generate When Triggered ON' },
                { value: 'trigger_off', label: 'Generate When Triggered OFF' }
              ]
            }
          ]
        },
        {
          title: 'Status',
          fields: [
            {
              key: 'isGeneratingError',
              type: 'boolean',
              label: 'Currently Generating Error'
            },
            {
              key: 'isManuallyActivated',
              type: 'boolean',
              label: 'Manually Activated'
            }
          ]
        }
      ]
    },
    
    // Metadata
    tags: ['error', 'testing', 'vibe-mode', 'refactored'],
    experimental: true, // Mark as experimental since it's a refactored version
    version: '2.0.0' // Higher version since it's enhanced
  },
  
  TestJson: {
    nodeType: 'testJson',
    component: TestJson,
    label: 'Test JSON',
    description: 'Create and test JSON data for Vibe Mode. Parse JSON text and output valid JSON objects for programmatic node manipulation.',
    category: 'test',
    folder: 'test',
    
    // Type system
    dataInterface: {
      jsonText: 'string',
      parsedJson: 'any',
      parseError: 'string | null',
      json: 'any',
      isActive: 'boolean'
    },
    
    // Configuration
    defaultData: { 
      jsonText: '{"example": "value"}',
      parsedJson: null,
      parseError: null,
      json: null,
      isActive: false
    },
    hasControls: true,
    displayName: 'Test JSON',
    
    // Inspector controls
    inspectorControls: {
      type: 'legacy',
      legacyControlType: 'TextNodeControl'
    }
  }
};

// ============================================================================
// AUTO-GENERATION UTILITIES
// ============================================================================

/** Generate TypeScript interface definitions */
export const generateTypeDefinitions = (): string => {
  const interfaces: string[] = [];
  const unionTypes: string[] = [];
  
  Object.entries(ENHANCED_NODE_REGISTRY).forEach(([key, node]) => {
    // Generate interface
    const interfaceName = `${node.nodeType.charAt(0).toUpperCase() + node.nodeType.slice(1)}Data`;
    const fields = Object.entries(node.dataInterface)
      .map(([fieldName, fieldType]) => `  ${fieldName}: ${fieldType};`)
      .join('\n');
    
    interfaces.push(`export interface ${interfaceName} {\n${fields}\n}`);
    
    // Generate union type entry
    const unionEntry = node.hasTargetPosition 
      ? `  | (Node<${interfaceName} & Record<string, unknown>> & { type: '${node.nodeType}'; targetPosition: Position })`
      : `  | (Node<${interfaceName} & Record<string, unknown>> & { type: '${node.nodeType}' })`;
    unionTypes.push(unionEntry);
  });
  
  const unionTypeDefinition = `export type AgenNode =\n${unionTypes.join('\n')};`;
  
  return `${interfaces.join('\n\n')}\n\n${unionTypeDefinition}`;
};

/** Generate constants configuration */
export const generateNodeTypeConfig = (): Record<string, NodeTypeConfig> => {
  const config: Record<string, NodeTypeConfig> = {};
  
  Object.values(ENHANCED_NODE_REGISTRY).forEach(node => {
    config[node.nodeType] = {
      defaultData: node.defaultData,
      hasTargetPosition: node.hasTargetPosition || false,
      targetPosition: node.targetPosition,
      hasOutput: node.hasOutput || false,
      hasControls: node.hasControls || false,
      displayName: node.displayName || node.label
    };
  });
  
  return config;
};

/** Generate inspector control mapping */
export const generateInspectorControlMapping = (): Record<string, InspectorControlConfig> => {
  const mapping: Record<string, InspectorControlConfig> = {};
  
  Object.values(ENHANCED_NODE_REGISTRY).forEach(node => {
    if (node.inspectorControls) {
      mapping[node.nodeType] = node.inspectorControls;
    }
  });
  
  return mapping;
};

// ============================================================================
// BACKWARD COMPATIBILITY LAYER
// ============================================================================

/** Legacy registry for backward compatibility */
export const NODE_REGISTRY: Record<string, any> = {};

// Convert enhanced registry to legacy format
Object.entries(ENHANCED_NODE_REGISTRY).forEach(([key, node]) => {
  NODE_REGISTRY[key] = {
    nodeType: node.nodeType,
    component: node.component,
    label: node.label,
    description: node.description,
    category: node.category,
    folder: node.folder,
    icon: node.icon,
    tags: node.tags,
    deprecated: node.deprecated,
    experimental: node.experimental
  };
});

// ============================================================================
// EXISTING UTILITY FUNCTIONS (Enhanced)
// ============================================================================

/** Get all node types for ReactFlow registration */
export const getNodeTypes = (): Record<string, React.ComponentType<any>> => {
  const nodeTypes: Record<string, React.ComponentType<any>> = {};
  
  Object.values(ENHANCED_NODE_REGISTRY).forEach(node => {
    nodeTypes[node.nodeType] = node.component;
  });
  
  return nodeTypes;
};

/** Get category mapping for styling */
export const getCategoryMapping = (): Record<string, NodeCategory> => {
  const mapping: Record<string, NodeCategory> = {};
  
  Object.values(ENHANCED_NODE_REGISTRY).forEach(node => {
    mapping[node.nodeType] = node.category;
  });
  
  return mapping;
};

/** Get available nodes mapping for sidebar */
export const getAvailableNodes = () => {
  const available: Record<string, any> = {};
  
  Object.entries(ENHANCED_NODE_REGISTRY).forEach(([key, node]) => {
    available[key] = {
      nodeType: node.nodeType,
      folder: node.folder,
      label: node.label,
      description: node.description
    };
  });
  
  return available;
};

/** Get nodes by folder */
export const getNodesByFolder = (folder: SidebarFolder): EnhancedNodeRegistration[] => {
  return Object.values(ENHANCED_NODE_REGISTRY).filter(node => node.folder === folder);
};

/** Get nodes by category */
export const getNodesByCategory = (category: NodeCategory): EnhancedNodeRegistration[] => {
  return Object.values(ENHANCED_NODE_REGISTRY).filter(node => node.category === category);
};

/** Get experimental nodes */
export const getExperimentalNodes = (): EnhancedNodeRegistration[] => {
  return Object.values(ENHANCED_NODE_REGISTRY).filter(node => node.experimental === true);
};

/** Get deprecated nodes */
export const getDeprecatedNodes = (): EnhancedNodeRegistration[] => {
  return Object.values(ENHANCED_NODE_REGISTRY).filter(node => node.deprecated === true);
};

/** Helper to create node stencils */
export const createNodeStencils = (nodeKeys: string[], prefix: string) => {
  return nodeKeys.map((key, index) => {
    const node = ENHANCED_NODE_REGISTRY[key];
    if (!node) {
      console.warn(`Node "${key}" not found in registry`);
      return null;
    }
    
    return {
      id: `${prefix}-${key.toLowerCase()}-${index + 1}`,
      nodeType: node.nodeType,
      label: node.label,
      description: node.description
    };
  }).filter(Boolean) as Array<{
    id: string;
    nodeType: string;
    label: string;
    description: string;
  }>;
};

/** Auto-generate stencils from registry by folder/criteria */
export const autoGenerateStencils = (
  criteria: {
    folder?: SidebarFolder;
    category?: NodeCategory;
    experimental?: boolean;
    deprecated?: boolean;
  },
  prefix: string
) => {
  const nodes = Object.entries(ENHANCED_NODE_REGISTRY)
    .filter(([key, node]) => {
      if (criteria.folder && node.folder !== criteria.folder) return false;
      if (criteria.category && node.category !== criteria.category) return false;
      if (criteria.experimental !== undefined && node.experimental !== criteria.experimental) return false;
      if (criteria.deprecated !== undefined && node.deprecated !== criteria.deprecated) return false;
      return true;
    })
    .map(([key, node], index) => ({
      id: `${prefix}-${key.toLowerCase()}-${index + 1}`,
      nodeType: node.nodeType,
      label: node.label,
      description: node.description
    }));
  
  return nodes;
};

/** Get testing nodes - AUTO-GENERATED from registry */
export const getTestingNodes = () => {
  // Auto-generate from registry instead of manual list
  return autoGenerateStencils({ folder: 'testing' }, 'testing');
};

// ============================================================================
// ENHANCED REGISTRY EXPORTS
// ============================================================================

export { ENHANCED_NODE_REGISTRY as default }; 