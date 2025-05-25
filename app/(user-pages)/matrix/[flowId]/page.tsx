// app/build/[flowId]/page.tsx
import { notFound } from 'next/navigation'
import { dummyFlows } from '@/features/business-logic/data'
import FlowEditor from '@/features/business-logic/FlowEditor'
interface FlowPageProps {
  params: { flowId: string }
}

/**
 * Server component that looks up a Flow by ID from dummy data.
 */
export default async function FlowPage({ params }: FlowPageProps) {
  const { flowId } = await params

  // find in our dummy array
  const flow = dummyFlows.find((f) => f.id === flowId)
  if (!flow) notFound()

  return (
    <div className="h-[100vh] w-[100vw]">
      <FlowEditor />
      </div>
    // <div className="p-8">
    //   {/* <h1 className="text-2xl font-bold mb-4 absolute top-0 left-0">{flow.name}</h1> */}

    //   {/* your editor will live here */}
      
    // </div>
  )
}
