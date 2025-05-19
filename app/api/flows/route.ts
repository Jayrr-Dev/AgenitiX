// app/api/flows/route.ts

import { NextResponse } from 'next/server'
import { dummyFlows as flows } from '@/features/business-logic/data'

export async function GET() {
  return NextResponse.json(flows)
}
