import type { Metadata, Viewport } from 'next'
import { Inter, Roboto_Mono } from 'next/font/google'
import './globals.css'
import ScrollToTop from '@/components/ScrollToTop'
import { AuthProvider } from '@/components/providers/AuthProvider'
import Analytics from '@/components/Analytics'
import CookieConsent from '@/components/CookieConsent'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const robotoMono = Roboto_Mono({ 
  subsets: ['latin'],
  variable: '--font-roboto-mono',
})

export const viewport: Viewport = {
  themeColor: '#050505',
}

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_APP_NAME} - Mobile Point of Sale`,
  description: 'Accept payments anywhere with Tap to Pay on your phone. Built for mobile bars, food trucks, and event vendors. No hardware needed, lower fees, instant payouts.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3333'),
  alternates: {},
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '64x64 48x48 32x32 16x16', type: 'image/x-icon' },
      { url: '/luma-black-rounded.png', sizes: '192x192', type: 'image/png' },
      { url: '/luma-black-rounded.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/luma-black-rounded.png',
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'Luma - Mobile Point of Sale',
    description: 'Accept payments anywhere with Tap to Pay. Built for bars, food trucks, and event vendors.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://lumapos.co',
    siteName: 'Luma POS',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/apple-thumbnail.png',
        width: 1200,
        height: 630,
        alt: 'Luma POS - Accept payments anywhere',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luma - Mobile Point of Sale',
    description: 'Accept payments anywhere with Tap to Pay. Built for bars, food trucks, and event vendors.',
    images: ['/apple-thumbnail.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Luma POS',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <head />
      <body suppressHydrationWarning>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PCNRKR3G"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <AuthProvider>
          <Analytics />
          <CookieConsent />
          <ScrollToTop />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}