'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function ReferralRedirect() {
  const router = useRouter()
  const params = useParams()
  const code = params.code as string

  useEffect(() => {
    if (code) {
      router.replace(`/get-started?ref=${encodeURIComponent(code)}`)
    }
  }, [code, router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mx-auto mb-4" />
        <p className="text-gray-400">Redirecting...</p>
      </div>
    </div>
  )
}
