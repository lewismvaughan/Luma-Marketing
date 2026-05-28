'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { publicMenuApi, type PublicCatalog, type PublicProduct } from '@/lib/api/menu'
import type { Socket } from 'socket.io-client'
import { ArrowLeft, Plus, Minus, ShoppingBag, MapPin, Clock, X, ChevronRight } from 'lucide-react'
import { formatCurrency, formatCents } from '@/lib/currency'

interface CartItem {
  product: PublicProduct
  quantity: number
  notes?: string
}

export default function MenuPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [catalog, setCatalog] = useState<PublicCatalog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)

  const refreshCatalog = useCallback(async () => {
    try {
      const res = await publicMenuApi.getCatalog(slug)
      setCatalog(res.catalog)
    } catch {
      // Silently fail on refresh — keep showing existing data
    }
  }, [slug])

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const res = await publicMenuApi.getCatalog(slug)
        setCatalog(res.catalog)
        // Select first category by default
        if (res.catalog.categories.length > 0) {
          setSelectedCategory(res.catalog.categories[0].id)
        }
      } catch (err: unknown) {
        const error = err as { error?: string }
        setError(error?.error || 'Menu not found')
      } finally {
        setLoading(false)
      }
    }

    loadCatalog()
  }, [slug])

  // Connect to Socket.IO for real-time menu updates
  useEffect(() => {
    if (!catalog) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3334'
    let cancelled = false

    import('socket.io-client').then(({ io }) => {
      if (cancelled) return

      const socket = io(`${apiUrl}/public`, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        // Bounded — Infinity meant a stuck tab would hammer the API forever.
        reconnectionAttempts: 20,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
      })

      socketRef.current = socket

      socket.on('connect', () => {
        socket.emit('join', `catalog:${catalog.id}`)
      })

      // Refetch menu data on any catalog change
      socket.on('catalog:updated', () => {
        refreshCatalog()
      })

      socket.on('catalog:deleted', () => {
        setError('This menu is no longer available')
        setCatalog(null)
      })
    })

    return () => {
      cancelled = true
      socketRef.current?.disconnect()
    }
  }, [catalog?.id, refreshCatalog])

  const filteredProducts = useMemo(() => {
    if (!catalog) return []
    if (!selectedCategory) return catalog.products.filter(p => p.isActive)
    return catalog.products.filter(p => p.isActive && p.categoryId === selectedCategory)
  }, [catalog, selectedCategory])

  const currency = catalog?.currency || 'usd'

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.product.price / 100) * item.quantity, 0)
  }, [cart])

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  const addToCart = (product: PublicProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.catalogProductId === product.catalogProductId)
      if (existing) {
        return prev.map(item =>
          item.product.catalogProductId === product.catalogProductId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQuantity = (catalogProductId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.catalogProductId === catalogProductId) {
          const newQuantity = item.quantity + delta
          if (newQuantity <= 0) return null
          return { ...item, quantity: newQuantity }
        }
        return item
      }).filter(Boolean) as CartItem[]
    })
  }

  const removeFromCart = (catalogProductId: string) => {
    setCart(prev => prev.filter(item => item.product.catalogProductId !== catalogProductId))
  }

  const getCartQuantity = (catalogProductId: string) => {
    return cart.find(item => item.product.catalogProductId === catalogProductId)?.quantity || 0
  }

  const proceedToCheckout = () => {
    // Store cart in sessionStorage for checkout page
    sessionStorage.setItem(`preorder_cart_${slug}`, JSON.stringify(cart))
    router.push(`/menu/${slug}/checkout`)
  }

  if (loading) {
    return (
      <div className="relative min-h-screen bg-black">
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/80 border-b border-white/5">
          <div className="container mx-auto px-4 sm:px-6 max-w-2xl py-2 flex items-center gap-2.5">
            <img src="/luma-wordmark.svg" alt="Luma" className="h-14 sm:h-16 w-auto" />
          </div>
        </header>
        <main className="pb-24">
          <div className="container mx-auto px-4 sm:px-6 max-w-2xl pt-6">
            <div className="animate-pulse">
              <div className="h-4 w-24 bg-gray-800 rounded mb-6" />
              <div className="h-8 w-48 bg-gray-800 rounded mb-2" />
              <div className="h-4 w-64 bg-gray-800 rounded mb-8" />
              <div className="flex gap-2 mb-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-9 w-20 bg-gray-800 rounded-full" />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-48 bg-gray-800/50 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !catalog) {
    return (
      <div className="relative min-h-screen bg-black">
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/80 border-b border-white/5">
          <div className="container mx-auto px-4 sm:px-6 max-w-2xl py-2 flex items-center gap-2.5">
            <img src="/luma-wordmark.svg" alt="Luma" className="h-14 sm:h-16 w-auto" />
          </div>
        </header>
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
          <ShoppingBag className="h-12 w-12 text-gray-600 mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Menu not found</h1>
          <p className="text-gray-400 text-sm mb-6">{error || 'This menu may not be available for pre-orders.'}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-black">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/80 border-b border-white/5">
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl py-2 flex items-center justify-between">
          <Link href="https://lumapos.co" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <img src="/luma-wordmark.svg" alt="Luma" className="h-14 sm:h-16 w-auto" />
          </Link>
          {catalog.organizationName && (
            <span className="text-sm text-gray-500 truncate ml-4">by {catalog.organizationName}</span>
          )}
        </div>
      </header>
      <main className="pb-32">
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl pt-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">{catalog.name}</h1>
            {catalog.description && (
              <p className="text-sm text-gray-400 mt-2">{catalog.description}</p>
            )}
          </div>

          {/* Info badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            {catalog.location && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900/60 border border-gray-800 text-xs text-gray-300">
                <MapPin className="h-3 w-3 text-gray-500" />
                {catalog.location}
              </div>
            )}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900/60 border border-gray-800 text-xs text-gray-300">
              <Clock className="h-3 w-3 text-gray-500" />
              ~{catalog.estimatedPrepTime} min prep time
            </div>
          </div>

          {/* Category tabs - only show categories with products */}
          {(() => {
            const categoriesWithProducts = catalog.categories.filter(cat =>
              catalog.products.some(p => p.isActive && p.categoryId === cat.id)
            );
            if (categoriesWithProducts.length === 0) return null;
            return (
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                    selectedCategory === null
                      ? 'bg-primary text-white'
                      : 'bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  All
                </button>
                {categoriesWithProducts
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                        selectedCategory === category.id
                          ? 'bg-primary text-white'
                          : 'bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
              </div>
            );
          })()}

          {/* Product grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {filteredProducts
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(product => {
                const qty = getCartQuantity(product.catalogProductId)
                return (
                  <button
                    key={product.catalogProductId}
                    onClick={() => addToCart(product)}
                    className={`rounded-lg bg-gray-900/60 border overflow-hidden group text-left transition-all hover:border-gray-700 hover:bg-gray-900/80 active:scale-[0.98] cursor-pointer relative ${
                      qty > 0 ? 'border-primary/50 ring-1 ring-primary/20' : 'border-gray-800'
                    }`}
                  >
                    {/* Product image */}
                    <div className="aspect-[4/3] relative bg-gray-800">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-gray-600" />
                        </div>
                      )}

                      {/* Add button - only show when qty is 0 */}
                      {qty === 0 && (
                        <div className="absolute top-2 right-2">
                          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Plus className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}

                      {/* Quantity controls overlay on image - only show when qty > 0 */}
                      {qty > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent pt-4 pb-2 px-2">
                          <div className="flex items-center justify-center gap-2">
                            <div
                              role="button"
                              aria-label={`Decrease quantity of ${product.name}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                updateQuantity(product.catalogProductId, -1)
                              }}
                              className="h-8 w-8 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center text-white hover:bg-gray-700 hover:border-gray-500 transition-colors cursor-pointer"
                            >
                              <Minus className="h-4 w-4" />
                            </div>
                            <div className="h-8 min-w-[32px] px-3 rounded-full bg-primary flex items-center justify-center">
                              <span className="text-white font-bold text-sm" aria-label={`Quantity: ${qty}`}>{qty}</span>
                            </div>
                            <div
                              role="button"
                              aria-label={`Increase quantity of ${product.name}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                addToCart(product)
                              }}
                              className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary-600 transition-colors cursor-pointer"
                            >
                              <Plus className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Product info - always visible */}
                    <div className="p-2">
                      <h3 className="font-medium text-white text-xs sm:text-sm leading-tight mb-0.5 line-clamp-2">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-gray-500 text-[10px] sm:text-xs leading-tight mb-1 line-clamp-1 hidden sm:block">
                          {product.description}
                        </p>
                      )}
                      <p className="text-primary font-semibold text-xs sm:text-sm">
                        {formatCents(product.price, currency)}
                      </p>
                    </div>
                  </button>
                )
              })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <ShoppingBag className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No items in this category</p>
            </div>
          )}
        </div>
      </main>

      {/* Floating cart button */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black to-transparent z-30">
          <div className="container mx-auto max-w-2xl">
            <button
              onClick={() => setShowCart(true)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 rounded-2xl bg-primary text-white font-semibold shadow-lg shadow-primary/20 hover:bg-primary-600 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                  {cartItemCount}
                </div>
                <span>View Cart</span>
              </div>
              <span>{formatCurrency(cartTotal, currency)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Cart drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCart(false)}
          />

          {/* Drawer */}
          <div className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">Your Order</h2>
              <button
                onClick={() => setShowCart(false)}
                className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cart.map(item => (
                <div
                  key={item.product.catalogProductId}
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-800/50 border border-gray-700"
                >
                  {/* Image */}
                  {item.product.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="h-10 w-10 rounded-md object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="h-4 w-4 text-gray-500" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white truncate leading-tight">
                      {item.product.name}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {formatCents(item.product.price * item.quantity, currency)}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => updateQuantity(item.product.catalogProductId, -1)}
                      aria-label={`Decrease quantity of ${item.product.name}`}
                      className="h-6 w-6 rounded flex items-center justify-center text-white bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-white font-medium text-xs w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.catalogProductId, 1)}
                      aria-label={`Increase quantity of ${item.product.name}`}
                      className="h-6 w-6 rounded flex items-center justify-center text-white bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromCart(item.product.catalogProductId)}
                    aria-label={`Remove ${item.product.name} from cart`}
                    className="text-gray-500 hover:text-red-400 transition-colors p-0.5 flex-shrink-0 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer with total and checkout */}
            <div className="p-4 border-t border-gray-800 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white font-semibold">{formatCurrency(cartTotal, currency)}</span>
              </div>
              <p className="text-xs text-gray-500">
                Tax calculated at checkout
              </p>
              <button
                onClick={proceedToCheckout}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-600 transition-colors cursor-pointer"
              >
                Continue to Checkout
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
