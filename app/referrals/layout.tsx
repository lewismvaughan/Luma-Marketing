import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Referral Program - Luma POS',
  description: 'Earn 15% revenue share by referring vendors to Luma POS. Share your unique link and earn from subscription payments and ticket sales.',
}

export default function ReferralsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
