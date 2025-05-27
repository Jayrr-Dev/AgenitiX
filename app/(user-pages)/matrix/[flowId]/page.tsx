// app/build/[flowId]/page.tsx
import { notFound } from 'next/navigation'
import { dummyFlows } from '@/features/business-logic/data'
import FlowEditor from '@/features/business-logic/FlowEditor'

// TYPES
interface FlowPageProps {
  params: {
    flowId: string
  }
  searchParams: { [key: string]: string | string[] | undefined }
}

/**
 * Server component that looks up a Flow by ID from dummy data.
 * @param params - Contains the flowId from the URL
 * @param searchParams - Contains any query parameters
 */
export default function FlowPage({ params }: FlowPageProps) {
  const { flowId } = params

  // find in our dummy array
  const flow = dummyFlows.find((f) => f.id === flowId)
  if (!flow) notFound()

  return (
    <div className="h-[100vh] w-[100vw]">
      <FlowEditor />
    </div>
  )
}
