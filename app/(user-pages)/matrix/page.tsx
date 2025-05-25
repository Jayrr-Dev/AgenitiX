// import Logic from "@/features/business-logic/agenitix";
// export default async function LogicPage() {
//   return (
//       <Logic />
//   );
// }

// app/build/[flowId]/page.tsx

import { notFound } from 'next/navigation'
import type { Flow } from '@/features/business-logic/types'

interface FlowPageProps {
  params: { flowId: string }
}

/**
 * Fetches a single flow by ID and renders your flow‐builder.
 */
export default async function FlowPage({ params }: FlowPageProps) {
  const { flowId } = params

  // 🔥 replace with real data fetching (Supabase, Prisma, etc.)
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/flows/${flowId}`)
  if (!res.ok) notFound()

  const flow: Flow = await res.json()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{flow.name}</h1>
      {/* TODO: drop in your live flow editor component here */}
      <div className="border rounded-lg p-6 text-gray-500">
        Your flow editor for <strong>{flow.id}</strong> goes here.
      </div>
    </div>
  )
}
