// nodes/initialElements.ts
import { Node, NodeToolbar } from '@xyflow/react'

/* ------------------------------------------------------------------ */
/*  DATA SHAPES                                                       */
/* ------------------------------------------------------------------ */
export interface TextNodeData { text: string }
export interface TextUppercaseNodeData { text: string }
export interface ResultNodeData {}          // no extra data yet

/* ------------------------------------------------------------------ */
/*  STRICT NODE UNION                                                 */
/* ------------------------------------------------------------------ */
export type MyNode =
  | (Node<TextNodeData & Record<string, unknown>>      & { type: 'textNode' })
  | (Node<TextUppercaseNodeData & Record<string, unknown>> & { type: 'uppercaseNode' })
  | (Node<ResultNodeData & Record<string, unknown>>    & { type: 'resultNode' })

/* ------------------------------------------------------------------ */
/*  TYPE-GUARDS                                                       */
/* ------------------------------------------------------------------ */
export const isTextNode = (n: MyNode): n is Extract<MyNode, { type: 'textNode' }> =>
  n.type === 'textNode'
