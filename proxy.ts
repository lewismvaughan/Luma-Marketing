import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SUPPORTED_CODES = new Set([
  'US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'FR', 'DE', 'ES', 'IT',
  'NL', 'BE', 'AT', 'PT', 'FI', 'SE', 'DK', 'NO', 'CH', 'LU',
  'CZ', 'SG', 'MY',
])

export function proxy(request: NextRequest) {
  // Vercel injects x-vercel-ip-country automatically on Edge
  const raw = request.headers.get('x-vercel-ip-country')

  const response = NextResponse.next()

  if (raw) {
    // On Vercel — use IP-based country
    const resolved = SUPPORTED_CODES.has(raw) ? raw : 'US'
    console.log(`[proxy] ip-country=${raw} resolved=${resolved}`)
    response.headers.set('x-country', resolved)
    response.cookies.set('luma-country', resolved, {
      path: '/',
      maxAge: 60 * 60 * 24,
      sameSite: 'lax',
    })
  } else {
    // No Vercel header (local dev / self-hosted) — delete any stale cookie
    // so client-side IP detection can take over
    response.cookies.delete('luma-country')
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
