// import Logic from "@/features/business-logic/agenitix";
// export default async function LogicPage() {
//   return (
//       <Logic />
//   );
// }

// app/build/[flowId]/page.tsx

import { notFound } from 'next/navigation'
import type { Flow } from '@/features/business-logic/types'

type Props = {
  params: { flowId: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

/**
 * Fetches a single flow by ID and renders your flow‐builder.
 */
export default function MatrixPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Matrix Page</h1>
      {/* Add your static or client-side content here */}
      <div className="border rounded-lg p-6 text-gray-500">
        This is the static Matrix page.
      </div>
    </div>
  );
}
