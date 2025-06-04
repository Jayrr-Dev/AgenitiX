// app/api/flows/[flowId]/route.ts

import { dummyFlows } from "@/features/business-logic-modern/dashboard/data";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  const { flowId } = await params;
  const flow = dummyFlows.find((f) => f.id === flowId);
  if (!flow)
    return NextResponse.json({ error: "Flow not found" }, { status: 404 });
  return NextResponse.json(flow);
}
