'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { publicMenuApi, type PreorderResponse } from '@/lib/api/menu'
import type { Socket } from 'socket.io-client'
import { Check, Clock, ChefHat, Bell, PartyPopper, XCircle, Mail, ArrowLeft, MapPin, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'

type PreorderStatus = 'pending' | 'preparing' | 'ready' | 'picked_up' | 'cancelled' | 'refunded'

const STATUS_CONFIG: Record<PreorderStatus, {
  icon: typeof Clock
  title: string
  description: string
  color: string
  bgColor: string
  ringColor: string
}> = {
  pending: {
    icon: Clock,
    title: 'Order Received',
    description: 'Your order has been received',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    ringColor: 'ring-amber-500/30',
  },
  preparing: {
    icon: ChefHat,
    title: 'Being Prepared',
    description: 'Your order is being made right now',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/20',
    ringColor: 'ring-violet-500/30',
  },
  ready: {
    icon: Bell,
    title: 'Ready for Pickup!',
    description: 'Head over to pick up your order',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    ringColor: 'ring-emerald-500/30',
  },
  picked_up: {
    icon: PartyPopper,
    title: 'Complete',
    description: 'Thanks for your order!',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    ringColor: 'ring-emerald-500/30',
  },
  cancelled: {
    icon: XCircle,
    title: 'Order Cancelled',
    description: 'This order has been cancelled',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    ringColor: 'ring-red-500/30',
  },
  refunded: {
    icon: XCircle,
    title: 'Order Refunded',
    description: 'A refund has been issued to your original payment method',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    ringColor: 'ring-red-500/30',
  },
}

const STATUS_STEPS: { key: PreorderStatus; label: string }[] = [
  { key: 'pending', label: 'Received' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
]

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffMins = Math.round(diffMs / 60000)

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  if (diffMins > 0 && diffMins <= 60) {
    return `~${diffMins} min (${timeStr})`
  }
  return timeStr
}

export default function SuccessPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const preorderId = searchParams.get('id') || ''
  const customerEmail = searchParams.get('email') || ''

  const [preorder, setPreorder] = useState<PreorderResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  // Load preorder data
  useEffect(() => {
    if (!preorderId || !customerEmail) {
      setError('Missing order information')
      setLoading(false)
      return
    }

    const loadPreorder = async () => {
      try {
        const res = await publicMenuApi.getPreorderStatus(slug, preorderId, customerEmail)
        setPreorder(res.preorder)
      } catch (err: unknown) {
        const error = err as { error?: string }
        setError(error?.error || 'Failed to load order')
      } finally {
        setLoading(false)
      }
    }

    loadPreorder()
  }, [slug, preorderId, customerEmail])

  // Connect to Socket.IO for real-time updates
  useEffect(() => {
    if (!preorderId || !customerEmail) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3334'
    let cancelled = false

    const fetchPreorder = () => {
      publicMenuApi.getPreorderStatus(slug, preorderId, customerEmail)
        .then(res => {
          setPreorder(res.preorder)
        })
        .catch(() => {})
    }

    import('socket.io-client').then(({ io }) => {
      if (cancelled) return

      const socket = io(`${apiUrl}/public`, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        // Bounded — Infinity meant a stuck order-tracking tab would hammer
        // the API forever if WS dropped.
        reconnectionAttempts: 20,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
      })

      socketRef.current = socket

      // Handle initial connection
      socket.on('connect', () => {
        setIsConnected(true)
        socket.emit('join', `preorder:${preorderId}`)
        // Always fetch fresh data on connect/reconnect
        fetchPreorder()
      })

      socket.on('disconnect', () => {
        setIsConnected(false)
      })

      // Handle all preorder events by fetching fresh data
      const handlePreorderEvent = (data: { preorderId?: string; status?: string }) => {
        if (data.preorderId === preorderId) {
          fetchPreorder()
        }
      }

      socket.on('preorder:updated', handlePreorderEvent)
      socket.on('preorder:ready', handlePreorderEvent)
      socket.on('preorder:completed', handlePreorderEvent)
      socket.on('preorder:cancelled', handlePreorderEvent)
    })

    return () => {
      cancelled = true
      socketRef.current?.disconnect()
    }
  }, [preorderId, slug, customerEmail])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto mb-2" />
          <p className="text-gray-500 text-xs">Loading order...</p>
        </div>
      </div>
    )
  }

  if (error || !preorder) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black flex items-center justify-center p-4">
        <div className="text-center max-w-xs">
          <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
            <XCircle className="h-6 w-6 text-red-400" />
          </div>
          <h1 className="text-lg font-bold text-white mb-1">Order Not Found</h1>
          <p className="text-gray-400 text-sm mb-4">{error || 'Unable to find your order.'}</p>
          <Link
            href={`/menu/${slug}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Menu
          </Link>
        </div>
      </div>
    )
  }

  const status = preorder.status as PreorderStatus
  const config = STATUS_CONFIG[status]
  const StatusIcon = config.icon
  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === status)
  const isCancelled = status === 'cancelled' || status === 'refunded'
  const isRefunded = status === 'refunded'
  const isComplete = status === 'picked_up'

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-gray-950/80 border-b border-white/5">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href={`/menu/${slug}`}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Menu</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-gray-600'}`} />
            <span className="text-xs text-gray-500">
              {isConnected ? 'Live updates' : 'Connecting...'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 py-6 sm:py-8">
        {/* Status Hero */}
        <div className="flex items-center gap-5 mb-6">
          <div className="relative shrink-0">
            <div className={`h-20 w-20 rounded-full ${config.bgColor} flex items-center justify-center ring-4 ${config.ringColor}`}>
              <StatusIcon className={`h-10 w-10 ${config.color}`} strokeWidth={status === 'ready' ? 2.5 : 2} />
            </div>
            {(status === 'pending' || status === 'preparing') && (
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-current animate-spin opacity-30" style={{ animationDuration: '2s' }} />
            )}
          </div>
          <div className="min-w-0">
            <h1 className={`text-2xl font-bold ${config.color}`}>
              {config.title}
            </h1>
            <p className="text-gray-400 text-base mt-1">
              {isRefunded
                ? `A refund of ${formatCurrency(preorder.totalAmount, preorder.currency || 'usd')} has been issued to your original payment method.`
                : isCancelled
                  ? 'This order has been cancelled. No payment was collected.'
                  : config.description}
            </p>
            <p className="text-gray-500 text-sm font-mono mt-1">
              Order #{preorder.dailyNumber}
            </p>
            {isRefunded && (
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full mt-2 inline-block">
                Refunded {formatCurrency(preorder.totalAmount, preorder.currency || 'usd')}
              </span>
            )}
          </div>
        </div>

        {/* Progress Steps */}
        {!isCancelled && !isComplete && (
          <div className="mb-6 flex items-center gap-2 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
            {STATUS_STEPS.map((step, i) => {
              const isActive = i <= currentStepIndex
              const isCurrent = step.key === status

              return (
                <div key={step.key} className="flex-1 flex flex-col items-center">
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'bg-gray-800 text-gray-500'
                    } ${isCurrent ? 'ring-2 ring-primary/40 scale-110' : ''}`}
                  >
                    {isActive && i < currentStepIndex ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${
                    isCurrent ? 'text-white' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Estimated Time */}
        {preorder.estimatedReadyAt && !['ready', 'picked_up', 'cancelled'].includes(status) && (
          <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/10 border border-primary/20">
            <Clock className="h-5 w-5 text-primary shrink-0" />
            <span className="text-sm text-gray-400">Ready:</span>
            <span className="text-base font-semibold text-white">
              {formatTime(preorder.estimatedReadyAt)}
            </span>
          </div>
        )}

        {/* Order Summary Card */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-semibold text-white text-base">{preorder.catalogName}</h3>
            {preorder.paymentType === 'pay_now' ? (
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full">
                Paid
              </span>
            ) : (
              <span className="text-xs font-semibold text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-full">
                Pay at pickup
              </span>
            )}
          </div>

          <div className="p-4">
            {/* Items */}
            <div className="space-y-3 mb-4">
              {preorder.items.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                  <span className="text-gray-300 text-base">
                    <span className="text-gray-500">{item.quantity}×</span> {item.name}
                  </span>
                  <span className="text-gray-400 tabular-nums text-base">
                    {formatCurrency(item.unitPrice * item.quantity, preorder.currency || 'usd')}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-white/5 pt-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Subtotal</span>
                <span className="text-sm text-gray-400 tabular-nums">{formatCurrency(preorder.subtotal, preorder.currency || 'usd')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Tax</span>
                <span className="text-sm text-gray-400 tabular-nums">{formatCurrency(preorder.taxAmount, preorder.currency || 'usd')}</span>
              </div>
              {preorder.tipAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Tip</span>
                  <span className="text-sm text-gray-400 tabular-nums">{formatCurrency(preorder.tipAmount, preorder.currency || 'usd')}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <span className="text-base font-semibold text-white">Total</span>
                <span className="text-xl font-bold text-white tabular-nums">{formatCurrency(preorder.totalAmount, preorder.currency || 'usd')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          {/* Pickup Instructions */}
          {preorder.pickupInstructions && !isComplete && !isCancelled && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <MapPin className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-300">Pickup Location</p>
                <p className="text-sm text-gray-500 leading-relaxed mt-0.5">{preorder.pickupInstructions}</p>
              </div>
            </div>
          )}

          {/* Email Notice */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <Mail className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm text-gray-400">
              Confirmation sent to <span className="text-gray-300 font-medium">{customerEmail}</span>
            </p>
          </div>
        </div>

        {/* Action Button */}
        <Link
          href={`/menu/${slug}`}
          className="block w-full text-center py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-base font-semibold transition-colors cursor-pointer"
        >
          Order More
        </Link>

        {/* Powered by Luma */}
        <div className="mt-8 mb-2 flex items-center justify-center gap-2">
          <span className="text-xs text-gray-600">Powered by</span>
          <Link href="/" className="cursor-pointer">
            <img src="/luma-wordmark.svg" alt="Luma" className="h-16 w-auto opacity-40 hover:opacity-60 transition-opacity -translate-x-[14px] translate-y-[0px]" />
          </Link>
        </div>
      </main>
    </div>
  )
}
