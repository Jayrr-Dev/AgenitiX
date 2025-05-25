// app/api/flows/route.ts

import { NextResponse } from 'next/server'
import type { Flow } from '@/features/business-logic/types'
import { dummyFlows } from '@/features/business-logic/data'


export function GET() {
  return NextResponse.json(dummyFlows)
}
