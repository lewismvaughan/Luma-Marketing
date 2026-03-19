'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Mail } from 'lucide-react'
import { event } from '@/lib/analytics'

const footerLinks = {
  product: [
    { name: 'Features', href: '/#features' },
    { name: 'Pricing', href: '/#pricing' },
    { name: 'FAQ', href: '/#faq' },
    { name: 'Get Started', href: '/get-started' },
    { name: 'Download App', href: '/download' },
  ],
  features: [
    { name: 'Tap to Pay', href: '/#tap-to-pay' },
    { name: 'Events & Ticketing', href: '/#events-showcase' },
    { name: 'Online Ordering', href: '/#preorder-showcase' },
    { name: 'Invoicing', href: '/#invoice-showcase' },
    { name: 'Analytics', href: '/#app-showcase' },
    { name: 'Revenue Splits', href: '/#features' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Events', href: '/events' },
    { name: 'Referral Program', href: '/referrals' },
    { name: 'Transaction Rates', href: '/pricing' },
  ],
  legal: [
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
  ],
}

const _socialLinks = [
  { name: 'Email', icon: Mail, href: 'mailto:support@lumapos.co' },
]

export default function Footer() {
  const pathname = usePathname()

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/#')) {
      const hash = href.substring(1)

      if (pathname === '/') {
        // Already on home page, scroll to element with offset
        e.preventDefault()
        const element = document.querySelector(hash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }
      // If on different page, let normal navigation happen
    }
  }

  return (
    <footer className="bg-gray-950 border-t border-gray-800">
      <div className="container mx-auto px-6 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8 pl-[30px] min-[340px]:pl-[45px] md:pl-0">
          <div className="col-span-2 md:col-span-1 md:-mt-[50px]">
            <Link href="/" className="flex items-center -ml-[30px] min-[340px]:-ml-[45px] md:ml-0">
              <img src="/luma-wordmark.svg" alt="Luma" width="1024" height="1024" className="h-24 sm:h-32 w-auto" />
            </Link>
            <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 -ml-[10px] min-[340px]:-ml-[25px] md:ml-0">
              The mobile POS for events. Lower fees, no contracts.
            </p>
            <a
              href="mailto:support@lumapos.co"
              onClick={() => event('footer_click_email')}
              className="text-gray-400 hover:text-primary transition-colors text-xs sm:text-sm flex items-center gap-2 -ml-[10px] min-[340px]:-ml-[25px] md:ml-0"
            >
              <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              support@lumapos.co
            </a>
          </div>

          <div>
            <p className="text-xs sm:text-sm font-semibold text-gray-100 tracking-wider uppercase mb-3 sm:mb-4">
              Product
            </p>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    onClick={(e) => { handleNavClick(e, link.href); event(`footer_click_${link.name.toLowerCase().replace(/\s+/g, '_')}`) }}
                    className="text-gray-400 hover:text-primary text-xs sm:text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs sm:text-sm font-semibold text-gray-100 tracking-wider uppercase mb-3 sm:mb-4">
              Features
            </p>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.features.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    onClick={(e) => { handleNavClick(e, link.href); event(`footer_click_${link.name.toLowerCase().replace(/\s+/g, '_')}`) }}
                    className="text-gray-400 hover:text-primary text-xs sm:text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs sm:text-sm font-semibold text-gray-100 tracking-wider uppercase mb-3 sm:mb-4">
              Company
            </p>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    onClick={(e) => { handleNavClick(e, link.href); event(`footer_click_${link.name.toLowerCase().replace(/\s+/g, '_')}`) }}
                    className="text-gray-400 hover:text-primary text-xs sm:text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs sm:text-sm font-semibold text-gray-100 tracking-wider uppercase mb-3 sm:mb-4">
              Legal
            </p>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    onClick={(e) => { handleNavClick(e, link.href); event(`footer_click_${link.name.toLowerCase().replace(/\s+/g, '_')}`) }}
                    className="text-gray-400 hover:text-primary text-xs sm:text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-800">
          <p className="text-center text-xs sm:text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Luma. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}