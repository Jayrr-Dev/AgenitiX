// nodes/initialElements.ts
import { Node } from '@xyflow/react'

/* ------------------------------------------------------------------ */
/*  DATA SHAPES                                                       */
/* ------------------------------------------------------------------ */
export interface TextNodeData { text: string }
export interface UppercaseNodeData { text: string }
export interface ResultNodeData {}          // no extra data yet

/* ------------------------------------------------------------------ */
/*  STRICT NODE UNION                                                 */
/* ------------------------------------------------------------------ */
export type MyNode =
  | (Node<TextNodeData & Record<string, unknown>>      & { type: 'textNode' })
  | (Node<UppercaseNodeData & Record<string, unknown>> & { type: 'uppercaseNode' })
  | (Node<ResultNodeData & Record<string, unknown>>    & { type: 'resultNode' })

/* ------------------------------------------------------------------ */
/*  TYPE-GUARDS                                                       */
/* ------------------------------------------------------------------ */
export const isTextNode = (n: MyNode): n is Extract<MyNode, { type: 'textNode' }> =>
  n.type === 'textNode'
