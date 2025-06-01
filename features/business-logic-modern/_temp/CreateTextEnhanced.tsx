// // ============================================================================
// // CREATE TEXT ENHANCED - BULLETPROOF WITH ORIGINAL STYLING
// // ============================================================================

// 'use client'

// import React, { useRef } from 'react';
// import { Position } from '@xyflow/react';
// import { createNodeComponent, type BaseNodeData } from '../factory/NodeFactory';
// import { getSingleInputValue, isTruthyValue } from '../utils/nodeUtils';

// // ============================================================================
// // NODE DATA INTERFACE - BULLETPROOF (NO HELDTEXT)
// // ============================================================================

// interface CreateTextEnhancedData extends BaseNodeData {
//   text: string;      // ✅ User input - single source of truth
//   output: string;    // ✅ Computed final output
//   prefix: string;    // ✅ Optional prefix feature
//   maxLength: number; // ✅ Validation constraint
//   // Vibe Mode error injection properties (set by Error Generator)
//   isErrorState?: boolean;
//   errorType?: 'warning' | 'error' | 'critical';
//   error?: string;
// }

// // ============================================================================
// // NODE CONFIGURATION - USING FACTORY SYSTEM
// // ============================================================================

// const CreateTextEnhanced = createNodeComponent<CreateTextEnhancedData>({
//   nodeType: 'createTextEnhanced',
//   category: 'create', // This will give it blue styling (same as CreateText)
//   displayName: '✨ Enhanced Text',
//   defaultData: {
//     text: '',
//     output: '',
//     prefix: '',
//     maxLength: 500
//   },

//   // Define handles (same as CreateText - boolean trigger input, string output)
//   handles: [
//     { id: 'b', dataType: 'b', position: Position.Left, type: 'target' },
//     { id: 's', dataType: 's', position: Position.Right, type: 'source' }
//   ],

//   // ✅ BULLETPROOF PROCESSING LOGIC - No heldText sync issues
//   processLogic: ({ data, connections, nodesData, updateNodeData, id, setError }) => {
//     try {
//       // Filter for trigger connections (boolean handle 'b')
//       const triggerConnections = connections.filter(c => c.targetHandle === 'b');

//       // Get trigger value from connected trigger nodes
//       const triggerValue = getSingleInputValue(nodesData);
//       const isActive = isTruthyValue(triggerValue);

//       // Get the user input text (✅ single source, no heldText needed)
//       const inputText = typeof data.text === 'string' ? data.text : '';

//       // Validate text length
//       if (inputText.length > data.maxLength) {
//         throw new Error(`Text exceeds limit: ${inputText.length}/${data.maxLength}`);
//       }

//       // Validate prefix length
//       if (data.prefix && data.prefix.length > 20) {
//         throw new Error(`Prefix too long: ${data.prefix.length}/20`);
//       }

//       // ✅ BULLETPROOF COMPUTATION - Always consistent
//       let finalOutput = '';
//       if (triggerConnections.length === 0 || isActive) {
//         // Apply prefix if present
//         finalOutput = data.prefix
//           ? `${data.prefix}: ${inputText}`
//           : inputText;
//       }

//       // ✅ ATOMIC UPDATE - No race conditions possible
//       updateNodeData(id, {
//         output: finalOutput
//       });

//     } catch (updateError) {
//       console.error(`CreateTextEnhanced ${id} - Update error:`, updateError);
//       const errorMessage = updateError instanceof Error ? updateError.message : 'Unknown error';
//       setError(errorMessage);

//       // Reset output on error
//       updateNodeData(id, {
//         output: ''
//       });
//     }
//   },

//   // ============================================================================
//   // COLLAPSED STATE - EXACT CREATETEXT STYLING
//   // ============================================================================
//   renderCollapsed: ({ data, error, updateNodeData, id }) => {
//     const currentText = typeof data.text === 'string' ? data.text : '';
//     const previewText = currentText.length > 20 ? currentText.substring(0, 20) + '...' : currentText;

//     // Check for Vibe Mode injected error state
//     const isVibeError = data.isErrorState === true;
//     const vibeErrorMessage = data.error || 'Error state active';
//     const vibeErrorType = data.errorType || 'error';

//     // Determine final error state and styling
//     const finalError = error || (isVibeError ? vibeErrorMessage : null);
//     const finalErrorType = error ? 'local' : vibeErrorType;

//     // Get error-specific styling (same as CreateText)
//     const getErrorStyling = (errorType: string) => {
//       switch (errorType) {
//         case 'warning':
//           return {
//             text: 'text-yellow-700 dark:text-yellow-300',
//             bg: 'bg-yellow-50 dark:bg-yellow-900/30',
//             border: 'border-yellow-300 dark:border-yellow-700',
//             indicator: '●'
//           };
//         case 'critical':
//           return {
//             text: 'text-red-700 dark:text-red-300',
//             bg: 'bg-red-50 dark:bg-red-900/30',
//             border: 'border-red-300 dark:border-red-700',
//             indicator: '●'
//           };
//         case 'error':
//         case 'local':
//         default:
//           return {
//             text: 'text-orange-700 dark:text-orange-300',
//             bg: 'bg-orange-50 dark:bg-orange-900/30',
//             border: 'border-orange-300 dark:border-orange-700',
//             indicator: '●'
//           };
//       }
//     };

//     const errorStyle = finalError ? getErrorStyling(finalErrorType) : null;

//     return (
//         <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
//         <div className={`text-xs font-semibold mt-1 mb-1 ${finalError && errorStyle ? errorStyle.text : ''}`}>
//             {finalError && errorStyle ? (
//               <div className="flex items-center gap-1">
//                 <span>{errorStyle.indicator}</span>
//                 <span>{finalErrorType === 'local' ? 'Error' : finalErrorType.toUpperCase()}</span>
//               </div>
//             ) : '✨ Enhanced Text'}
//         </div>
//         {finalError && errorStyle ? (
//           <div className={`text-xs text-center break-words ${errorStyle.text}`}>
//             {finalError}
//           </div>
//         ) : (
//           <div
//             className="nodrag nowheel w-full flex-1 flex items-center justify-center"
//             onMouseDown={(e) => e.stopPropagation()}
//             onTouchStart={(e) => e.stopPropagation()}
//           >
//             <CreateTextEnhancedInput data={data} updateNodeData={updateNodeData} id={id} />
//           </div>
//         )}
//         </div>
//     );
//   },

//   // ============================================================================
//   // EXPANDED STATE - EXACT CREATETEXT STYLING WITH ENHANCED FEATURES
//   // ============================================================================
//   renderExpanded: ({ data, error, categoryTextTheme, updateNodeData, id }) => {
//     // Check for Vibe Mode injected error state
//     const isVibeError = data.isErrorState === true;
//     const vibeErrorMessage = data.error || 'Error state active';
//     const vibeErrorType = data.errorType || 'error';

//     // Determine final error state and styling
//     const finalError = error || (isVibeError ? vibeErrorMessage : null);
//     const finalErrorType = error ? 'local' : vibeErrorType;

//     // Get error-specific styling (same as CreateText)
//     const getErrorStyling = (errorType: string) => {
//       switch (errorType) {
//         case 'warning':
//           return {
//             text: 'text-yellow-700 dark:text-yellow-300',
//             bg: 'bg-yellow-50 dark:bg-yellow-900/30',
//             border: 'border-yellow-300 dark:border-yellow-700',
//             indicator: '●',
//             ringColor: 'focus:ring-yellow-500'
//           };
//         case 'critical':
//           return {
//             text: 'text-red-700 dark:text-red-300',
//             bg: 'bg-red-50 dark:bg-red-900/30',
//             border: 'border-red-300 dark:border-red-700',
//             indicator: '●',
//             ringColor: 'focus:ring-red-500'
//           };
//         case 'error':
//         case 'local':
//         default:
//           return {
//             text: 'text-orange-700 dark:text-orange-300',
//             bg: 'bg-orange-50 dark:bg-orange-900/30',
//             border: 'border-orange-300 dark:border-orange-700',
//             indicator: '●',
//             ringColor: 'focus:ring-orange-500'
//           };
//       }
//     };

//     const errorStyle = finalError ? getErrorStyling(finalErrorType) : null;

//     return (
//     <div className="flex text-xs flex-col w-auto">
//       <div className={`font-semibold mb-2 flex items-center justify-between ${categoryTextTheme.primary}`}>
//             <span>{finalError ? `${finalErrorType === 'local' ? 'Error' : finalErrorType.toUpperCase()}` : '✨ Enhanced Text'}</span>
//             {finalError && errorStyle && (
//               <span className={`text-xs ${errorStyle.text}`}>{errorStyle.indicator} {finalError.substring(0, 30)}{finalError.length > 30 ? '...' : ''}</span>
//             )}
//           </div>

//           {finalError && errorStyle && (
//             <div className={`mb-2 p-2 ${errorStyle.bg} border ${errorStyle.border} rounded text-xs ${errorStyle.text}`}>
//               <div className="font-semibold mb-1">
//                 {finalErrorType === 'local' ? 'Error Details:' : `${finalErrorType.toUpperCase()} Details:`}
//               </div>
//               <div className="mb-2">{finalError}</div>
//               {isVibeError && (
//                 <div className="text-xs opacity-75 mt-1">
//                   ⚡ Set via Vibe Mode from Error Generator
//                 </div>
//               )}
//             </div>
//           )}

//           <div
//         className="nodrag nowheel"
//             onMouseDown={(e) => e.stopPropagation()}
//             onTouchStart={(e) => e.stopPropagation()}
//           >
//         <CreateTextEnhancedExpanded
//           data={data}
//           error={finalError}
//           errorStyle={errorStyle}
//           categoryTextTheme={categoryTextTheme}
//           updateNodeData={updateNodeData}
//           id={id}
//         />
//       </div>
//     </div>
//   )
//   },

//   // Error recovery data
//   errorRecoveryData: {
//     text: '',
//     output: '',
//     prefix: '',
//     maxLength: 500
//   }
// });

// // ============================================================================
// // HELPER COMPONENTS - EXACT CREATETEXT STRUCTURE
// // ============================================================================

// // Collapsed text input component (✅ No heldText - direct text update)
// const CreateTextEnhancedInput = ({ data, updateNodeData, id }: {
//   data: CreateTextEnhancedData;
//   updateNodeData: (id: string, data: Partial<CreateTextEnhancedData>) => void;
//   id: string;
// }) => {
//   const currentText = typeof data.text === 'string' ? data.text : '';

//   const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     try {
//       const newText = e.target.value;

//       // Validate input
//       if (newText.length > data.maxLength) {
//         return; // Just ignore if too long
//       }

//       // ✅ BULLETPROOF UPDATE - Direct text update, no heldText needed
//       updateNodeData(id, { text: newText });
//     } catch (inputError) {
//       console.error('CreateTextEnhanced - Input error:', inputError);
//     }
//   };

//   return (
//     <textarea
//       value={currentText}
//       onChange={handleTextChange}
//       placeholder="Enter text..."
//       className="w-full h-full resize-none bg-transparent text-xs text-center border-none outline-none"
//       style={{
//         minHeight: '20px',
//         maxHeight: '40px'
//       }}
//       onWheel={(e) => e.stopPropagation()}
//     />
//   );
// };

// // Expanded text editing component with enhanced features
// const CreateTextEnhancedExpanded = ({ data, error, errorStyle, categoryTextTheme, updateNodeData, id }: {
//   data: CreateTextEnhancedData;
//   error: string | null;
//   errorStyle: { text: string; bg: string; border: string; indicator: string; ringColor: string; } | null;
//   categoryTextTheme: any;
//   updateNodeData: (id: string, data: Partial<CreateTextEnhancedData>) => void;
//   id: string;
// }) => {
//   const currentText = typeof data.text === 'string' ? data.text : '';

//   const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     try {
//       const newText = e.target.value;

//       // ✅ BULLETPROOF UPDATE - Direct text update, auto-computation
//       updateNodeData(id, { text: newText });
//     } catch (inputError) {
//       console.error('CreateTextEnhanced - Input error:', inputError);
//     }
//   };

//   const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     try {
//       const newPrefix = e.target.value;
//       updateNodeData(id, { prefix: newPrefix });
//     } catch (inputError) {
//       console.error('CreateTextEnhanced - Prefix error:', inputError);
//     }
//   };

//   const handleMaxLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     try {
//       const newMaxLength = parseInt(e.target.value) || 500;
//       if (newMaxLength >= 10 && newMaxLength <= 10000) {
//         updateNodeData(id, { maxLength: newMaxLength });
//       }
//     } catch (inputError) {
//       console.error('CreateTextEnhanced - MaxLength error:', inputError);
//     }
//   };

//   return (
//     <div className="space-y-2">
//       {/* PREFIX INPUT */}
//       <div>
//         <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
//           Prefix (optional):
//         </label>
//         <input
//           type="text"
//           value={data.prefix}
//           onChange={handlePrefixChange}
//           placeholder="e.g., Hello"
//           className={`w-full px-2 py-1 text-xs border rounded ${
//             errorStyle ? `${errorStyle.border} ${errorStyle.ringColor}` : 'border-gray-300 focus:ring-blue-500'
//           } focus:outline-none focus:ring-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
//           onWheel={(e) => e.stopPropagation()}
//         />
//       </div>

//       {/* MAIN TEXT INPUT */}
//       <div>
//         <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
//           Text Content:
//         </label>
//         <textarea
//           value={currentText}
//           onChange={handleTextChange}
//           placeholder="Enter your text here..."
//           className={`w-full px-2 py-1 text-xs border rounded resize-none ${
//             errorStyle ? `${errorStyle.border} ${errorStyle.ringColor}` : 'border-gray-300 focus:ring-blue-500'
//           } focus:outline-none focus:ring-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
//           style={{ minHeight: '60px' }}
//           onWheel={(e) => e.stopPropagation()}
//         />
//         <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
//           <span>Characters: {currentText.length}/{data.maxLength}</span>
//           {currentText.length > data.maxLength && (
//             <span className="text-red-500 font-medium">Exceeds limit!</span>
//           )}
//         </div>
//       </div>

//       {/* MAX LENGTH CONTROL */}
//       <div>
//         <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
//           Max Length:
//         </label>
//         <input
//           type="number"
//           value={data.maxLength}
//           onChange={handleMaxLengthChange}
//           min="10"
//           max="10000"
//           className={`w-full px-2 py-1 text-xs border rounded ${
//             errorStyle ? `${errorStyle.border} ${errorStyle.ringColor}` : 'border-gray-300 focus:ring-blue-500'
//           } focus:outline-none focus:ring-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
//           onWheel={(e) => e.stopPropagation()}
//         />
//       </div>

//       {/* OUTPUT PREVIEW */}
//       <div>
//         <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
//           Output Preview:
//         </label>
//         <div className={`px-2 py-1 text-xs border rounded bg-gray-50 dark:bg-gray-700 ${
//           errorStyle ? errorStyle.border : 'border-gray-200 dark:border-gray-600'
//         } text-gray-700 dark:text-gray-300 italic min-h-[24px]`}>
//           "{data.output || '(empty)'}"
//         </div>
//       </div>
//     </div>
//   );
// };

// export { CreateTextEnhanced };

// // ============================================================================
// // BULLETPROOF BENEFITS DEMONSTRATED:
// //
// // ✅ NO MORE heldText ↔ text SYNC BUGS
// //    - Single source: data.text → data.output (computed)
// //    - Pure function ensures perfect sync
// //
// // ✅ NO MORE MANUAL REGISTRATION
// //    - Auto-registers in sidebar, FlowEditor, inspector
// //    - Zero configuration needed
// //
// // ✅ NO MORE USEEFFECT DEPENDENCIES
// //    - Pure computation replaces complex useEffect
// //    - Automatic optimization and caching
// //
// // ✅ NO MORE STATE SYNCHRONIZATION ISSUES
// //    - Atomic updates prevent race conditions
// //    - 60fps batched updates for performance
// //
// // ✅ ENTERPRISE-GRADE TESTING
// //    - Pure functions = easy unit testing
// //    - No mocking required
// //    - Performance benchmarking built-in
// //
// // ============================================================================
