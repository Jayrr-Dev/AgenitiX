// app/api/flows/route.ts

import { dummyFlows } from "@/features/business-logic-modern/dashboard/data";
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(dummyFlows);
}
