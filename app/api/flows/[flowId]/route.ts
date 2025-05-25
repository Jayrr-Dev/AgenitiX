// app/api/flows/[flowId]/route.ts

import { NextResponse } from 'next/server'
import type { Flow } from '@/features/business-logic/types'
import { dummyFlows } from '@/features/business-logic/data'


export function GET({ params }: { params: { flowId: string } }) {
  const flow = dummyFlows.find((f) => f.id === params.flowId)
  if (!flow) return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
  return NextResponse.json(flow)
}
