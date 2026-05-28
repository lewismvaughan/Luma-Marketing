'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { publicEventsApi, type PublicEvent } from '@/lib/api/events'
import { CalendarDays, MapPin, Search, Ticket } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import type { Socket } from 'socket.io-client'

// --- Date helpers ---

function startOfDay(d: Date) {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

function endOfWeek(d: Date) {
  const c = new Date(d)
  c.setDate(c.getDate() + (7 - c.getDay()))
  c.setHours(23, 59, 59, 999)
  return c
}

function endOfMonth(d: Date) {
  const c = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  c.setHours(23, 59, 59, 999)
  return c
}

function getRelativeLabel(dateStr: string, timezone: string = 'America/New_York'): string {
  const now = new Date()
  const d = new Date(dateStr)
  const today = startOfDay(now)
  const target = startOfDay(d)
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays >= 2 && diffDays <= 6) {
    return d.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone })
  }
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: timezone })
}

function formatTime(dateStr: string, timezone: string = 'America/New_York') {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: timezone })
}

interface EventGroup {
  label: string
  events: PublicEvent[]
}

function groupEvents(events: PublicEvent[]): EventGroup[] {
  const now = new Date()
  const weekEnd = endOfWeek(now)
  const monthEnd = endOfMonth(now)

  const thisWeek: PublicEvent[] = []
  const thisMonth: PublicEvent[] = []
  const later: PublicEvent[] = []

  for (const evt of events) {
    const d = new Date(evt.startsAt)
    if (d <= weekEnd) thisWeek.push(evt)
    else if (d <= monthEnd) thisMonth.push(evt)
    else later.push(evt)
  }

  const groups: EventGroup[] = []
  if (thisWeek.length) groups.push({ label: 'This Week', events: thisWeek })
  if (thisMonth.length) groups.push({ label: 'This Month', events: thisMonth })
  if (later.length) groups.push({ label: 'Upcoming', events: later })
  return groups
}

// --- Helpers ---

interface EventTier {
  price: number
  maxQuantity: number | null
  available: number | null
}

interface EventWithTiers {
  minPrice?: number | null
  tiers?: EventTier[]
  totalAvailable?: number
}

function getLowestPrice(evt: EventWithTiers & { currency?: string; isRsvpOnly?: boolean }): string | null {
  const cur = evt.currency || 'usd'
  if (evt.isRsvpOnly) return 'Free RSVP'
  if (evt.minPrice !== undefined && evt.minPrice !== null) {
    return evt.minPrice === 0 ? 'Free' : formatCurrency(evt.minPrice, cur)
  }
  if (evt.tiers?.length) {
    const min = Math.min(...evt.tiers.map((t) => t.price))
    return min === 0 ? 'Free' : formatCurrency(min, cur)
  }
  return null
}

function isEventSoldOut(evt: EventWithTiers): boolean {
  if (evt.tiers?.length) {
    return evt.tiers.every((t) => t.maxQuantity !== null && t.available !== null && t.available <= 0)
  }
  // List endpoint doesn't always have tiers — check totalAvailable if present
  if (evt.totalAvailable !== undefined) return evt.totalAvailable <= 0
  return false
}

function getTotalAvailable(evt: EventWithTiers): number | null {
  if (evt.tiers?.length) {
    return evt.tiers.reduce((sum: number, t) => sum + (t.available ?? 0), 0)
  }
  return null
}

// --- Event Card ---

function EventCard({ evt }: { evt: PublicEvent }) {
  const price = getLowestPrice(evt)
  const soldOut = isEventSoldOut(evt)
  const available = getTotalAvailable(evt)

  return (
    <Link
      href={`/events/${evt.slug}`}
      className="group block rounded-xl sm:rounded-2xl bg-gray-900/80 border border-gray-800 overflow-hidden hover:border-gray-700 transition-all duration-300 sm:hover:-translate-y-1"
    >
      {/* Mobile: Horizontal layout */}
      <div className="flex sm:hidden">
        {/* Thumbnail */}
        <div className="w-28 h-28 flex-shrink-0 bg-gray-800 relative overflow-hidden">
          <img
            src={evt.imageUrl || '/events.webp'}
            alt={evt.name}
            className="w-full h-full object-cover"
          />
          {soldOut && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-xs font-semibold text-red-400">Sold Out</span>
            </div>
          )}
        </div>
        {/* Content */}
        <div className="flex-1 p-3 min-w-0">
          <h3 className="text-sm font-semibold text-white mb-1 truncate group-hover:text-primary transition-colors">
            {evt.name}
          </h3>
          <div className="space-y-1 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3 text-gray-500 shrink-0" />
              <span className="truncate">{getRelativeLabel(evt.startsAt, evt.timezone)} · {formatTime(evt.startsAt, evt.timezone)}{evt.endsAt ? (new Date(evt.endsAt).toDateString() !== new Date(evt.startsAt).toDateString() ? ` – ${getRelativeLabel(evt.endsAt, evt.timezone)}, ${formatTime(evt.endsAt, evt.timezone)}` : ` – ${formatTime(evt.endsAt, evt.timezone)}`) : ''}</span>
            </div>
            {(evt.locationName || evt.locationAddress) && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-gray-500 shrink-0" />
                <span className="truncate">{evt.locationName || evt.locationAddress}</span>
              </div>
            )}
          </div>
          {price && !soldOut && (
            <div className="mt-2 text-xs font-medium text-primary">
              {price === 'Free' || price === 'Free RSVP' ? price : `From ${price}`}
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Stacked layout */}
      <div className="hidden sm:block">
        {/* Image */}
        <div className="aspect-[16/9] bg-gray-800 relative overflow-hidden">
          <img
            src={evt.imageUrl || '/events.webp'}
            alt={evt.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {price && !soldOut && (
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1 text-sm font-semibold text-white">
              {price === 'Free' || price === 'Free RSVP' ? price : `From ${price}`}
            </div>
          )}
          {soldOut && (
            <div className="absolute top-3 right-3 bg-red-600/90 backdrop-blur-sm rounded-lg px-3 py-1 text-sm font-semibold text-white">
              Sold Out
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-primary transition-colors">
            {evt.name}
          </h3>
          {evt.organizationName && (
            <p className="text-xs text-gray-500 mb-3">by {evt.organizationName}</p>
          )}

          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gray-500 shrink-0" />
              <span>{getRelativeLabel(evt.startsAt, evt.timezone)} at {formatTime(evt.startsAt, evt.timezone)}{evt.endsAt ? (new Date(evt.endsAt).toDateString() !== new Date(evt.startsAt).toDateString() ? ` – ${getRelativeLabel(evt.endsAt, evt.timezone)}, ${formatTime(evt.endsAt, evt.timezone)}` : ` – ${formatTime(evt.endsAt, evt.timezone)}`) : ''}</span>
            </div>
            {(evt.locationName || evt.locationAddress) && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  {evt.locationName && (
                    <span className="block truncate">{evt.locationName}</span>
                  )}
                  {evt.locationAddress && (
                    <span className="block text-xs text-gray-500 truncate">{evt.locationAddress}</span>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-gray-500 shrink-0" />
              <span>
                {soldOut
                  ? 'Sold out'
                  : available !== null
                  ? available > 0
                    ? `${available} ${evt.isRsvpOnly ? 'spots available' : 'tickets available'}`
                    : 'Sold out'
                  : evt.isRsvpOnly ? 'RSVP open' : 'Tickets available'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// --- Page ---

export default function EventsPage() {
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchEvents = useCallback(async () => {
    try {
      const params: { search?: string } = {}
      if (debouncedSearch) params.search = debouncedSearch
      const res = await publicEventsApi.list(params)
      setEvents(res.events)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Socket.IO for real-time updates
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3334'
    let socket: Socket | null = null
    let cancelled = false

    import('socket.io-client').then(({ io }) => {
      if (cancelled) return
      try {
        socket = io(`${apiUrl}/public`, {
          transports: ['websocket', 'polling'],
          autoConnect: true,
          // Bounded so a stuck tab can't hammer the API indefinitely.
          reconnectionAttempts: 20,
          reconnectionDelayMax: 30000,
        })

        socket.on('connect', () => {
          socket?.emit('join', 'events:public')
        })

        socket.on('EVENT_CREATED', () => fetchEvents())
        socket.on('EVENT_UPDATED', () => fetchEvents())
        socket.on('EVENT_DELETED', () => fetchEvents())
        socket.on('TICKET_PURCHASED', () => fetchEvents())
      } catch {
        // Socket not available, graceful fallback
      }
    })

    return () => {
      cancelled = true
      socket?.disconnect()
    }
  }, [fetchEvents])

  const groups = useMemo(() => groupEvents(events), [events])
  const hasSearch = debouncedSearch.length > 0

  return (
    <div className="relative min-h-screen bg-black">
      <Header />
      <main className="pt-24 sm:pt-28 pb-16 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-14">
            <h1 className="heading-1 mb-2 sm:mb-4">Upcoming Events</h1>
            <p className="text-sm sm:text-base text-gray-400">
              Discover events powered by Luma POS.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-xl mx-auto mb-6 sm:mb-10">
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-gray-900 border border-gray-700 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Events */}
          {loading ? (
            <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl sm:rounded-2xl bg-gray-900/80 border border-gray-800 overflow-hidden animate-pulse">
                  {/* Mobile skeleton */}
                  <div className="flex sm:hidden">
                    <div className="w-28 h-28 bg-gray-800 flex-shrink-0" />
                    <div className="flex-1 p-3 space-y-2">
                      <div className="h-4 w-3/4 bg-gray-800 rounded" />
                      <div className="h-3 w-1/2 bg-gray-800/60 rounded" />
                      <div className="h-3 w-2/3 bg-gray-800/60 rounded" />
                    </div>
                  </div>
                  {/* Desktop skeleton */}
                  <div className="hidden sm:block">
                    <div className="aspect-video bg-gray-800" />
                    <div className="p-5 space-y-3">
                      <div className="h-5 w-3/4 bg-gray-800 rounded" />
                      <div className="h-3 w-1/4 bg-gray-800/60 rounded" />
                      <div className="h-4 w-1/2 bg-gray-800 rounded" />
                      <div className="h-4 w-2/3 bg-gray-800 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20">
              <CalendarDays className="h-16 w-16 text-gray-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No events found</h3>
              <p className="text-gray-500">
                {hasSearch ? 'Try a different search term.' : 'Check back soon for upcoming events.'}
              </p>
            </div>
          ) : hasSearch ? (
            /* Flat grid when searching — no grouping */
            <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
              {events.map((evt) => (
                <EventCard key={evt.id} evt={evt} />
              ))}
            </div>
          ) : (
            /* Grouped by timeframe */
            <div className="space-y-8 sm:space-y-12">
              {groups.map((group) => (
                <div key={group.label}>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-300 mb-3 sm:mb-5 flex items-center gap-2 sm:gap-3">
                    <span>{group.label}</span>
                    <span className="text-[10px] sm:text-xs font-normal text-gray-600 bg-gray-800 rounded-full px-2 sm:px-2.5 py-0.5">
                      {group.events.length}
                    </span>
                  </h2>
                  <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
                    {group.events.map((evt) => (
                      <EventCard key={evt.id} evt={evt} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
