// app/api/flows/[flowId]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import type { Flow } from '@/features/business-logic/types'
import { dummyFlows } from '@/features/business-logic/data'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  const { flowId } = await params
  const flow = dummyFlows.find((f) => f.id === flowId)
  if (!flow) return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
  return NextResponse.json(flow)
}
