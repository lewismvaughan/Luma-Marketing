'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Download } from 'lucide-react'
import { event } from '@/lib/analytics'

const navigation = [
  { name: 'Features', href: '/#features' },
  { name: 'Pricing', href: '/#pricing' },
  { name: 'Events', href: '/events' },
  { name: 'Referrals', href: '/referrals' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
]

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    // Check initial scroll position
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/#')) {
      const hash = href.substring(1)

      if (pathname === '/') {
        // Already on home page, just scroll smoothly
        e.preventDefault()
        const element = document.querySelector(hash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }
      // If on different page, let normal navigation happen
      // ScrollToTop component handles scrolling to hash
    }
  }

  return (
    <header className="fixed top-0 z-50 w-full">
      {/* Background that fades in */}
      <div
        style={{
          opacity: scrolled ? 1 : 0,
          transition: 'opacity 0.5s ease',
          willChange: 'opacity',
        }}
        className="absolute inset-0 bg-gray-900 shadow-lg shadow-black/10 pointer-events-none"
      />
      {/* Separate blur layer */}
      <div
        style={{
          opacity: scrolled ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
        className="absolute inset-0 backdrop-blur-md pointer-events-none"
      />
      <nav className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <img src="/luma-wordmark.svg" alt="Luma" width="1024" height="1024" className="h-[88px] sm:h-32 w-auto -translate-y-[1px]" fetchPriority="high" />
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => { handleNavClick(e, item.href); event(`nav_click_${item.name.toLowerCase().replace(/\s+/g, '_')}`) }}
                  className="text-gray-300 hover:text-primary font-medium transition-colors duration-200"
                >
                  {item.name}
                </Link>
              ))}
              <Link
                href="/download"
                onClick={() => event('cta_header_download')}
                className="ml-6 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700/50 hover:border-gray-600 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download
              </Link>
              <Link
                href="/get-started"
                onClick={() => event('cta_header_get_started')}
                className="nav-btn-primary inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:from-primary-400 hover:to-primary-500 hover:shadow-lg hover:shadow-primary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Get Started
              </Link>
            </div>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isOpen}
              className="p-2 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Backdrop to close menu on outside click */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[-1] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile menu - smooth slide down animation */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
          isOpen ? 'max-h-[500px]' : 'max-h-0'
        }`}
      >
        <div className={`bg-gray-900/95 backdrop-blur-md border-t border-gray-800 px-4 py-4 space-y-1 transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}>
          {navigation.map((item, index) => (
            <Link
              key={item.name}
              href={item.href}
              className="block px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-800/80 hover:text-white font-medium transition-all duration-200"
              style={{ transitionDelay: isOpen ? `${index * 50}ms` : '0ms' }}
              onClick={(e) => {
                handleNavClick(e, item.href)
                event(`nav_click_${item.name.toLowerCase().replace(/\s+/g, '_')}`)
                setIsOpen(false)
              }}
            >
              {item.name}
            </Link>
          ))}
          <div className="pt-3 mt-2 border-t border-gray-800 space-y-2">
            <Link
              href="/download"
              className="flex items-center justify-center gap-2 w-full rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-3.5 font-semibold text-white transition-all duration-200 hover:bg-gray-700/50"
              onClick={() => { event('cta_header_download'); setIsOpen(false) }}
            >
              <Download className="h-4 w-4" />
              Download
            </Link>
            <Link
              href="/get-started"
              className="block w-full text-center rounded-xl bg-primary px-4 py-3.5 font-semibold text-white transition-all duration-200 hover:bg-primary-600 hover:-translate-y-0.5"
              onClick={() => { event('cta_header_get_started'); setIsOpen(false) }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}