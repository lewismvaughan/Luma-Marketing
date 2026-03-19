'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { publicEventsApi, type PublicEvent } from '@/lib/api/events'
import { Check, Mail, Ticket, CalendarDays, MapPin, ArrowRight } from 'lucide-react'

export default function SuccessPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const ticketIds = searchParams.get('tickets')?.split(',').filter(Boolean) || []
  const customerEmail = searchParams.get('email') || ''

  const [event, setEvent] = useState<PublicEvent | null>(null)

  useEffect(() => {
    publicEventsApi.getBySlug(slug)
      .then(res => setEvent(res.event))
      .catch(() => {})
  }, [slug])

  return (
    <div className="relative min-h-screen">
      <Header />
      <main className="pt-24 sm:pt-28 pb-16">
        <div className="mx-auto px-4 sm:px-6 max-w-2xl">
          {/* Success checkmark */}
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
              <Check className="h-8 w-8 text-emerald-400" strokeWidth={3} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-1">You&apos;re in!</h1>
          <p className="text-sm text-gray-400 text-center mb-8">
            {event?.isRsvpOnly
              ? ticketIds.length > 1
                ? `${ticketIds.length} RSVPs confirmed`
                : 'Your RSVP is confirmed'
              : ticketIds.length > 1
                ? `${ticketIds.length} tickets confirmed`
                : 'Your ticket is confirmed'}
          </p>

          {/* Event info */}
          {event && (
            <div className="rounded-xl bg-gray-900/60 border border-gray-800 p-4 mb-6">
              <h3 className="font-semibold text-white text-sm mb-2">{event.name}</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2.5 text-gray-400">
                  <CalendarDays className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                  <span>
                    {new Date(event.startsAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: event.timezone || 'America/New_York' })}
                    {' · '}
                    {new Date(event.startsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: event.timezone || 'America/New_York' })}
                  </span>
                </div>
                {event.locationName && (
                  <div className="flex items-center gap-2.5 text-gray-400">
                    <MapPin className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                    <span>{event.locationName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Next steps */}
          <div className="space-y-3 mb-8">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-900/40 border border-gray-800/60">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Check your email</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Your {event?.isRsvpOnly ? 'confirmation' : `ticket${ticketIds.length > 1 ? 's' : ''}`} and QR code{ticketIds.length > 1 ? 's' : ''} have been sent to{customerEmail ? <> <span className="text-gray-300">{customerEmail}</span></> : ' your inbox'}.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-900/40 border border-gray-800/60">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Ticket className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Show QR at the door</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Present the QR code from your email when you arrive.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href={`/events/${slug}`}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 border border-gray-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              View Event
            </Link>
            <Link
              href="/events"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Browse More Events
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
