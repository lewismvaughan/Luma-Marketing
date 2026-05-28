'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { publicEventsApi, type PublicEvent, type PublicTier } from '@/lib/api/events'
import { CalendarDays, MapPin, Ticket, ArrowLeft, ExternalLink, Mail, ShieldAlert, AlertTriangle, Plus, Minus, Share2, Flame } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import type { Socket } from 'socket.io-client'

// --- Countdown hook ---

function useCountdown(targetDate: string | null) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!targetDate) return
    const id = setInterval(() => setNow(new Date()), 60_000) // update every minute
    return () => clearInterval(id)
  }, [targetDate])

  if (!targetDate) return null
  const target = new Date(targetDate)
  const diff = target.getTime() - now.getTime()
  if (diff <= 0 || diff > 24 * 60 * 60 * 1000) return null // only show within 24h

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) return `Starts in ${hours}h ${minutes}m`
  return `Starts in ${minutes}m`
}


export default function EventPage() {
  const params = useParams()
  const slug = params.slug as string

  const [event, setEvent] = useState<PublicEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [copied, setCopied] = useState(false)

  // Only one tier can be selected at a time — the one with qty > 0
  const selectedTierId = Object.entries(quantities).find(([, qty]) => qty > 0)?.[0] || null
  const totalQuantity = Object.values(quantities).reduce((sum, q) => sum + q, 0)
  const totalPrice = event?.tiers
    ? Object.entries(quantities).reduce((sum, [tierId, qty]) => {
        const tier = event.tiers.find(t => t.id === tierId)
        return sum + (tier ? tier.price * qty : 0)
      }, 0)
    : 0

  const countdown = useCountdown(event?.startsAt ?? null)

  const fetchEvent = useCallback(async () => {
    try {
      const res = await publicEventsApi.getBySlug(slug)
      setEvent(res.event)
    } catch {
      setError('Event not found')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchEvent()
  }, [fetchEvent])

  // Real-time updates for ticket availability
  useEffect(() => {
    if (!event) return
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3334'
    let socket: Socket | null = null
    let cancelled = false

    import('socket.io-client').then(({ io }) => {
      if (cancelled) return
      try {
        socket = io(`${apiUrl}/public`, {
          transports: ['websocket', 'polling'],
          autoConnect: true,
          // Bounded so a stuck event page can't hammer the API indefinitely.
          reconnectionAttempts: 20,
          reconnectionDelayMax: 30000,
        })

        socket.on('connect', () => {
          socket?.emit('join', `event:${event.id}`)
        })

        socket.on('TICKET_PURCHASED', () => fetchEvent())
        socket.on('TICKET_REFUNDED', () => fetchEvent())
      } catch {
        // graceful fallback
      }
    })

    return () => {
      cancelled = true
      socket?.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id, fetchEvent])

  // Format dates in the event's timezone (not the viewer's local time)
  const eventTimezone = event?.timezone || 'America/New_York'

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: eventTimezone,
    })
  }

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: eventTimezone,
    })
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
      timeZone: eventTimezone,
    })
  }

  const isSoldOut = (tier: PublicTier) => {
    return tier.maxQuantity !== null && tier.available !== null && tier.available <= 0
  }

  const salesOpen = event
    ? (!event.salesStartAt || new Date(event.salesStartAt) <= new Date()) &&
      (!event.salesEndAt || new Date(event.salesEndAt) > new Date())
    : false

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: event?.name, url })
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="relative min-h-screen bg-black">
        <div className="relative z-10">
          <main className="pb-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 animate-pulse">
              {/* Banner skeleton */}
              <div className="h-48 sm:h-64 md:h-80 bg-gray-800/50 rounded-xl sm:rounded-2xl mb-6 sm:mb-8" />
              <div className="grid lg:grid-cols-3 gap-6 lg:gap-12">
                <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                  <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                    <div className="h-20 sm:h-24 bg-gray-800/40 rounded-xl sm:rounded-2xl" />
                    <div className="h-20 sm:h-24 bg-gray-800/40 rounded-xl sm:rounded-2xl" />
                  </div>
                  <div className="h-32 sm:h-40 bg-gray-800/30 rounded-xl sm:rounded-2xl" />
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="h-6 sm:h-8 w-20 sm:w-24 bg-gray-800 rounded-lg" />
                  <div className="h-32 sm:h-40 bg-gray-800/40 rounded-xl sm:rounded-2xl" />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="relative min-h-screen bg-black">
        <div className="relative z-10">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gray-800/50 flex items-center justify-center mb-4 sm:mb-6">
              <CalendarDays className="h-8 w-8 sm:h-10 sm:w-10 text-gray-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Event Not Found</h1>
            <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8 max-w-sm">This event may have ended or the link may be incorrect.</p>
            <Link href="/events" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 sm:px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition-colors">
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-black">
      <div className="relative z-10">
        <main className="pb-28 lg:pb-16">
          {/* Hero Banner */}
          <div className="w-full h-48 sm:h-72 md:h-96 bg-gray-900 relative overflow-hidden">
            <img
              src={event.bannerUrl || event.imageUrl || '/events.webp'}
              alt={event.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            {/* Mobile: Title overlay on banner */}
            <div className="absolute bottom-0 left-0 right-0 md:hidden">
              <div className="px-4 pb-4">
                {countdown && (
                  <div className="inline-flex items-center gap-1.5 bg-orange-500/90 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-full mb-2">
                    <Flame className="h-3 w-3" />
                    {countdown}
                  </div>
                )}
                <h1 className="text-xl font-bold text-white drop-shadow-lg leading-tight">{event.name}</h1>
                {event.organizationName && (
                  <p className="text-gray-300 text-xs mt-1">by {event.organizationName}</p>
                )}
              </div>
            </div>

            {/* Desktop: Title overlay on banner */}
            <div className="absolute bottom-0 left-0 right-0 hidden md:block">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                <div className="flex items-end justify-between">
                  <div>
                    {countdown && (
                      <div className="inline-flex items-center gap-1.5 bg-orange-500/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
                        <Flame className="h-3.5 w-3.5" />
                        {countdown}
                      </div>
                    )}
                    <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 drop-shadow-lg">{event.name}</h1>
                    {event.organizationName && (
                      <p className="text-gray-300 text-sm">Hosted by <span className="text-white font-medium">{event.organizationName}</span></p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back link & share */}
            <div className="flex items-center justify-between mt-4 sm:mt-6 mb-4 sm:mb-6">
              <Link
                href="/events"
                className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-xs sm:text-sm"
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                All Events
              </Link>
              <button
                type="button"
                onClick={handleShare}
                className="md:hidden inline-flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-xs cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" />
                {copied ? 'Copied!' : 'Share'}
              </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 lg:gap-12">
              {/* Event Details */}
              <div className="lg:col-span-2">
                {/* Detail cards - compact on mobile */}
                <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 mb-6 sm:mb-8">
                  <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-800/60">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">Date & Time</p>
                      <p className="text-xs sm:text-sm font-medium text-white">{formatDate(event.startsAt)}</p>
                      <p className="text-xs sm:text-sm text-gray-400">
                        {formatTime(event.startsAt)} – {formatDate(event.endsAt) !== formatDate(event.startsAt) ? `${formatDateShort(event.endsAt)}, ` : ''}{formatTime(event.endsAt)}
                      </p>
                    </div>
                  </div>

                  {event.locationName && (
                    <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-800/60">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">Location</p>
                        <p className="text-xs sm:text-sm font-medium text-white truncate">{event.locationName}</p>
                        {event.locationAddress && (
                          <p className="text-xs sm:text-sm text-gray-400 truncate">{event.locationAddress}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 sm:mt-1.5 text-[10px] sm:text-xs">
                          <a
                            href={`https://maps.apple.com/?q=${encodeURIComponent(event.locationAddress || event.locationName || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-0.5 sm:gap-1"
                          >
                            Apple Maps <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          </a>
                          <span className="text-gray-600">·</span>
                          <a
                            href={`https://maps.google.com/maps?q=${encodeURIComponent(event.locationAddress || event.locationName || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-0.5 sm:gap-1"
                          >
                            Google Maps <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              {/* Age restriction */}
              {event.ageRestriction && (
                <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] sm:text-xs font-medium mb-6 sm:mb-8">
                  <ShieldAlert className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>{event.ageRestriction}</span>
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-4">About this event</h2>
                  <div className="prose prose-invert prose-sm max-w-none text-gray-300 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                    {event.description}
                  </div>
                </div>
              )}

              {/* Contact & Policies */}
              {(event.contactEmail || event.refundPolicy) && (
                <div className="space-y-2 sm:space-y-3 pt-4 sm:pt-6 border-t border-gray-800/60">
                  {event.contactEmail && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                      <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
                      <span>Questions? <a href={`mailto:${event.contactEmail}`} className="text-primary hover:underline">{event.contactEmail}</a></span>
                    </div>
                  )}
                  {event.refundPolicy && (
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-400">
                      <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 shrink-0 mt-0.5" />
                      <span>{event.refundPolicy}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Ticket Tiers Sidebar (desktop) */}
            <div className="lg:col-span-1 hidden lg:block">
              <div className="sticky top-6">
                <TicketSidebar
                  event={event}
                  slug={slug}
                  quantities={quantities}
                  setQuantities={setQuantities}
                  salesOpen={salesOpen}
                  isSoldOut={isSoldOut}
                  selectedTierId={selectedTierId}
                  totalQuantity={totalQuantity}
                  totalPrice={totalPrice}
                  formatDateShort={formatDateShort}
                  formatTime={formatTime}
                />
              </div>
            </div>

            {/* Ticket Tiers (mobile — inline) */}
            <div className="lg:hidden lg:col-span-1">
              <TicketSidebar
                event={event}
                slug={slug}
                quantities={quantities}
                setQuantities={setQuantities}
                salesOpen={salesOpen}
                isSoldOut={isSoldOut}
                selectedTierId={selectedTierId}
                totalQuantity={totalQuantity}
                totalPrice={totalPrice}
                formatDateShort={formatDateShort}
                formatTime={formatTime}
              />
            </div>
          </div>
        </div>
          {/* Footer logo */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-10">
            <div className="border-t border-gray-800/60 pt-6 flex items-center justify-center gap-2">
              <span className="text-xs text-gray-600">Powered by</span>
              <Link href="/events" className="inline-flex items-center hover:opacity-80 transition-opacity">
                <img src="/luma-wordmark.svg" alt="Luma" className="h-16 w-auto opacity-40 hover:opacity-60 transition-opacity -translate-x-[14px] translate-y-[0px]" />
              </Link>
            </div>
          </div>
      </main>

        {/* Sticky mobile checkout bar */}
        {selectedTierId && totalQuantity > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-gray-950/95 backdrop-blur-md border-t border-gray-800 px-4 py-3 safe-area-pb">
            <Link
              href={`/events/${slug}/checkout?tier=${selectedTierId}&qty=${quantities[selectedTierId]}`}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
            >
              <Ticket className="h-4 w-4" />
              {event?.isRsvpOnly
                ? `RSVP · ${totalQuantity} ${totalQuantity === 1 ? 'spot' : 'spots'}`
                : `Get Tickets · ${totalQuantity} ${totalQuantity === 1 ? 'ticket' : 'tickets'}${totalPrice > 0 ? ` · ${formatCurrency(totalPrice, event?.currency || 'usd')}` : ' · Free'}`}
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}

// --- Ticket Sidebar (shared between desktop & mobile) ---

function TicketSidebar({
  event,
  slug,
  quantities,
  setQuantities,
  salesOpen,
  isSoldOut,
  selectedTierId,
  totalQuantity,
  totalPrice,
  formatDateShort,
  formatTime,
}: {
  event: PublicEvent
  slug: string
  quantities: Record<string, number>
  setQuantities: React.Dispatch<React.SetStateAction<Record<string, number>>>
  salesOpen: boolean
  isSoldOut: (tier: PublicTier) => boolean
  selectedTierId: string | null
  totalQuantity: number
  totalPrice: number
  formatDateShort: (d: string) => string
  formatTime: (d: string) => string
}) {
  return (
    <div className="rounded-xl sm:rounded-2xl border border-gray-800/60 bg-gradient-to-b from-gray-900/80 to-gray-950/80 p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-5">{event?.isRsvpOnly ? 'RSVP' : 'Tickets'}</h2>

      {!salesOpen && (
        <div className="p-3 rounded-lg sm:rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs sm:text-sm mb-4 sm:mb-5">
          {event.salesStartAt && new Date(event.salesStartAt) > new Date()
            ? `Sales open ${formatDateShort(event.salesStartAt)} at ${formatTime(event.salesStartAt)}`
            : 'Ticket sales have ended'}
        </div>
      )}

      <div className="space-y-2 sm:space-y-3">
        {event.tiers
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((tier) => {
            const soldOut = isSoldOut(tier)
            const qty = quantities[tier.id] || 0
            const isSelected = qty > 0
            const maxQty = Math.min(
              event.maxTicketsPerOrder || 10,
              tier.available !== null ? tier.available : 999
            )
            return (
              <div
                key={tier.id}
                className={`rounded-lg sm:rounded-xl border p-3 sm:p-4 transition-all ${
                  soldOut
                    ? 'bg-gray-900/30 border-gray-800/50 opacity-50'
                    : isSelected
                    ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20'
                    : 'bg-gray-900/40 border-gray-800/60 hover:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-white text-xs sm:text-sm">{tier.name}</h3>
                  <span className={`text-sm sm:text-base font-bold ${isSelected ? 'text-primary' : 'text-white'}`}>
                    {event?.isRsvpOnly ? 'Free' : tier.price === 0 ? 'Free' : formatCurrency(tier.price, event?.currency || 'usd')}
                  </span>
                </div>

                {tier.description && (
                  <p className="text-[11px] sm:text-xs text-gray-400 mb-2 sm:mb-3 leading-relaxed">{tier.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <span className={`text-[11px] sm:text-xs ${soldOut ? 'text-red-400' : 'text-gray-500'}`}>
                    {soldOut
                      ? 'Sold out'
                      : tier.available !== null
                      ? `${tier.available} left`
                      : 'Available'}
                  </span>

                  {salesOpen && !soldOut && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setQuantities(prev => ({ ...prev, [tier.id]: Math.max(0, qty - 1) }))}
                        disabled={qty === 0}
                        className="h-7 w-7 rounded-md sm:rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-xs sm:text-sm font-medium text-white tabular-nums">{qty}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newQty = Math.min(maxQty, qty + 1)
                          const reset: Record<string, number> = {}
                          event.tiers.forEach(t => { reset[t.id] = 0 })
                          reset[tier.id] = newQty
                          setQuantities(reset)
                        }}
                        disabled={qty >= maxQty}
                        className="h-7 w-7 rounded-md sm:rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
      </div>

      {/* Go to Checkout button (desktop only — mobile uses sticky bar) */}
      {selectedTierId && totalQuantity > 0 && (
        <Link
          href={`/events/${slug}/checkout?tier=${selectedTierId}&qty=${quantities[selectedTierId]}`}
          className="hidden lg:inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-600 transition-colors mt-5"
        >
          <Ticket className="h-4 w-4" />
          {event?.isRsvpOnly
            ? `RSVP Now · ${totalQuantity} ${totalQuantity === 1 ? 'spot' : 'spots'}`
            : `Go to Checkout · ${totalQuantity} ${totalQuantity === 1 ? 'ticket' : 'tickets'}${totalPrice > 0 ? ` · ${formatCurrency(totalPrice, event?.currency || 'usd')}` : ' · Free'}`}
        </Link>
      )}
    </div>
  )
}
