// app/dashboard/page.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Flow } from '@/features/business-logic/types'
import { IconPlus } from '@tabler/icons-react'

export default function DashboardPage() {
  // State to hold fetched flows
  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/flows')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load flows')
        return res.json() as Promise<Flow[]>
      })
      .then(setFlows)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="p-8">Loading…</p>
  if (error) return <p className="p-8 text-red-600">Error: {error}</p>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">My Flows</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* New Flow card */}
        <Link href="/build/new">
          <a className="group border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition">
            <IconPlus size={32} className="text-gray-400 mb-2 group-hover:text-gray-600" />
            <span className="text-lg font-medium text-gray-700 group-hover:text-gray-900">
              New Flow
            </span>
          </a>
        </Link>

        {/* Existing Flows */}
        {flows.map((flow) => (
          <div key={flow.id} className="relative border rounded-lg p-6">
            {flow.private && (
              <span className="absolute top-3 right-3 bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded">
                PRIVATE
              </span>
            )}

            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-purple-100 rounded flex items-center justify-center text-purple-600 font-bold uppercase">
                {flow.name.charAt(0)}
              </div>
              <h2 className="text-lg font-semibold">{flow.name}</h2>
            </div>

            <Link href={`/build/${flow.id}`}>
              <a className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                Open
              </a>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
