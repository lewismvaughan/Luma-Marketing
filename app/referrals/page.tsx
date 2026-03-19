'use client'

import { useState, useCallback, useRef, useEffect, memo } from 'react'
import { useFadeIn } from '@/hooks/useFadeIn'
import { Share2, UserPlus, DollarSign, CreditCard, Ticket, Clock, Banknote, ChevronRight, ArrowRight, Gift, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/Button'
import { event } from '@/lib/analytics'

export default function ReferralsPage() {
  return (
    <div className="relative">
      {/* Top glow effect */}
      <div className="absolute top-0 left-0 right-0 z-[60]">
        <div className="h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent" />
      </div>
      <div className="absolute top-0 left-0 right-0 h-[150px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent z-30 pointer-events-none" />

      <div className="relative z-10">
        <Header />
        <main>
          <ReferralHero />
          <HowItWorksSection />
          <WhatYouEarnSection />
          <PayoutsSection />
          <ReferralFAQ />
          <BottomCTA />
        </main>
        <Footer />
      </div>
    </div>
  )
}

/* ── Hero Section ── */
function ReferralHero() {
  const { ref, isVisible } = useFadeIn()

  return (
    <section className="pt-32 sm:pt-40 pb-12 sm:pb-16 md:pb-20 lg:pb-24 bg-black relative overflow-hidden">
      {/* Background accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(37, 99, 235, 0.10) 0%, transparent 70%)',
        }}
      />
      <div className="container relative z-10">
        <div ref={ref} className={`fade-in-section ${isVisible ? 'visible' : ''} text-center max-w-3xl mx-auto`}>
          <div className="fade-child inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
            <Gift className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary-200">Referral Program</span>
          </div>

          <h1 className="fade-child heading-1 mb-4 sm:mb-6">
            Share Luma, Earn{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
              15% Revenue Share
            </span>
          </h1>

          <p className="fade-child text-base sm:text-lg md:text-xl text-gray-400 mb-8 sm:mb-10 max-w-2xl mx-auto">
            Refer fellow vendors to Luma and earn 15% of their subscription payments and ticket sale fees for their first 12 months.
          </p>

          <div className="fade-child flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <a
              href={process.env.NEXT_PUBLIC_DASHBOARD_URL ? `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/referrals` : '/get-started'}
              onClick={() => event('referral_cta_hero_get_link')}
              className="w-full sm:w-auto"
            >
              <Button size="lg" variant="primary" className="w-full sm:w-auto group text-sm sm:text-base">
                Get Your Referral Link
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault()
                document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })
                event('referral_cta_hero_learn_more')
              }}
              className="w-full sm:w-auto"
            >
              <Button variant="secondary" size="lg" className="w-full sm:w-auto text-sm sm:text-base">
                Learn More
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── How It Works ── */
const howItWorksSteps = [
  {
    icon: Share2,
    title: 'Share Your Link',
    description: 'Share your unique referral code with fellow vendors, food trucks, and event organizers. Each code is tied to your account.',
    gradient: 'from-primary-500 to-primary-700',
  },
  {
    icon: UserPlus,
    title: 'They Sign Up',
    description: 'When they create a Luma account using your link, they\'re automatically tied to your referral. No extra steps needed.',
    gradient: 'from-primary-400 to-primary-600',
  },
  {
    icon: DollarSign,
    title: 'You Earn',
    description: 'Earn 15% of their subscription payments and ticket sale platform fees. Automatically paid to your Stripe account.',
    gradient: 'from-primary-600 to-primary-800',
  },
]

function HowItWorksSection() {
  const { ref, isVisible } = useFadeIn()

  return (
    <section id="how-it-works" className="section-padding bg-gradient-to-b from-black to-gray-950 relative overflow-hidden scroll-mt-24">
      <div className="container relative z-10">
        <div ref={ref} className={`fade-in-section ${isVisible ? 'visible' : ''} text-center max-w-3xl mx-auto mb-10 sm:mb-16`}>
          <h2 className="fade-child heading-2 mb-3 sm:mb-4">
            How it works
          </h2>
          <p className="fade-child text-base sm:text-lg text-gray-400">
            Three simple steps to start earning from your referrals.
          </p>
        </div>

        <div className={`fade-in-section ${isVisible ? 'visible' : ''} max-w-4xl mx-auto`}>
          <div className="fade-child grid md:grid-cols-3 gap-6 sm:gap-8">
            {howItWorksSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={step.title} className="relative text-center group">
                  {/* Connector line (desktop only) */}
                  {index < howItWorksSteps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-gradient-to-r from-gray-700 to-gray-800" />
                  )}

                  <div className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg relative`}>
                    <Icon className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-900 border-2 border-gray-700 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{index + 1}</span>
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── What You Earn ── */
function WhatYouEarnSection() {
  const { ref, isVisible } = useFadeIn()

  return (
    <section className="section-padding bg-gray-950 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(37, 99, 235, 0.06) 0%, transparent 70%)',
        }}
      />
      <div className="container relative z-10">
        <div ref={ref} className={`fade-in-section ${isVisible ? 'visible' : ''} text-center max-w-3xl mx-auto mb-10 sm:mb-16`}>
          <h2 className="fade-child heading-2 mb-3 sm:mb-4">
            What you earn
          </h2>
          <p className="fade-child text-base sm:text-lg text-gray-400">
            Earn a share of every dollar Luma makes from your referrals.
          </p>
        </div>

        <div className={`fade-in-section ${isVisible ? 'visible' : ''} max-w-4xl mx-auto`}>
          <div className="fade-child grid md:grid-cols-2 gap-6 sm:gap-8">
            {/* Subscription Referrals Card */}
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-gray-800 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/15 rounded-xl mb-4">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Subscription Referrals</h3>
              <p className="text-sm text-gray-400 mb-5 leading-relaxed">
                When someone you refer subscribes to Luma Pro ($29.99/mo), you earn $4.50 every month they stay subscribed.
              </p>
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Example earnings</div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">1 referral</span>
                    <span className="text-sm font-medium text-white">$4.50/mo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">5 referrals</span>
                    <span className="text-sm font-medium text-white">$22.50/mo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">20 referrals</span>
                    <span className="text-sm font-medium text-primary">$90.00/mo</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Sale Fees Card */}
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-gray-800 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/15 rounded-xl mb-4">
                <Ticket className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Ticket Sale Fees</h3>
              <p className="text-sm text-gray-400 mb-5 leading-relaxed">
                When your referrals sell event tickets, you earn 15% of the platform fee Luma collects on each sale.
              </p>
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">How it adds up</div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Ticket sold for $50</span>
                    <span className="text-sm text-gray-500">Platform fee collected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Your 15% share</span>
                    <span className="text-sm font-medium text-white">Earned automatically</span>
                  </div>
                  <div className="h-px bg-gray-700/50" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">High-volume referral</span>
                    <span className="text-sm font-medium text-primary">Scales with their sales</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── How Payouts Work ── */
const payoutFeatures = [
  {
    icon: Banknote,
    title: 'Automatic deposits',
    description: 'Earnings are automatically deposited to your Stripe Connect account. No manual withdrawal needed.',
  },
  {
    icon: Clock,
    title: '30-day hold period',
    description: 'New earnings have a 30-day hold for security and to account for refunds or chargebacks.',
  },
  {
    icon: DollarSign,
    title: '$1.00 minimum balance',
    description: 'Automatic transfers are triggered once your referral balance reaches $1.00.',
  },
  {
    icon: ShieldCheck,
    title: 'Fully automated',
    description: 'No invoices, no manual steps. Everything is tracked and paid out through Stripe automatically.',
  },
]

function PayoutsSection() {
  const { ref, isVisible } = useFadeIn()

  return (
    <section className="section-padding bg-gradient-to-b from-gray-950 to-black relative overflow-hidden">
      <div className="container relative z-10">
        <div ref={ref} className={`fade-in-section ${isVisible ? 'visible' : ''} text-center max-w-3xl mx-auto mb-10 sm:mb-16`}>
          <h2 className="fade-child heading-2 mb-3 sm:mb-4">
            How payouts work
          </h2>
          <p className="fade-child text-base sm:text-lg text-gray-400">
            Set it and forget it. Your earnings come to you automatically.
          </p>
        </div>

        <div className={`fade-in-section ${isVisible ? 'visible' : ''} max-w-4xl mx-auto`}>
          <div className="fade-child grid sm:grid-cols-2 gap-4 sm:gap-6">
            {payoutFeatures.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="flex items-start gap-4 bg-gray-900/50 border border-gray-800 rounded-xl p-5 sm:p-6"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── FAQ ── */
interface FaqItem {
  question: string
  answer: string
}

const referralFaqs: FaqItem[] = [
  {
    question: 'How much can I earn?',
    answer: 'There\'s no cap on referrals. You earn 15% of subscription payments and ticket sale platform fees from every vendor you refer for their first 12 months on Luma. The more people you refer, the more you earn.',
  },
  {
    question: 'When do I get paid?',
    answer: 'Earnings have a 30-day hold period for security and to account for potential refunds or chargebacks. After the hold clears, funds are automatically deposited to your Stripe Connect account.',
  },
  {
    question: 'How do I share my referral link?',
    answer: 'Log into your vendor dashboard and go to the Referrals section. You\'ll find your unique referral code and a shareable link. You can share it via text, email, social media, or anywhere else.',
  },
  {
    question: 'What counts as a qualifying referral?',
    answer: 'A referral qualifies when someone signs up for Luma using your referral link or code. They must be a new user who hasn\'t previously created a Luma account. The referral is tracked automatically at signup.',
  },
  {
    question: 'Can I refer myself?',
    answer: 'No, self-referrals are not allowed. Referral codes cannot be used on accounts associated with the same email, organization, or Stripe account. Attempting self-referral may result in removal from the program.',
  },
  {
    question: 'Do my referrals get any benefit?',
    answer: 'Currently, the referral program benefits the referrer. Referred users sign up with the same plans and pricing available to everyone. We may introduce welcome bonuses for referred users in the future.',
  },
  {
    question: 'What if a referral cancels or gets a refund?',
    answer: 'If a referred user cancels their subscription or receives a refund, the corresponding referral earnings are adjusted. This is why there\'s a 30-day hold period on new earnings.',
  },
]

const MobileAccordionItem = memo(function MobileAccordionItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: FaqItem
  isOpen: boolean
  onToggle: () => void
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (isOpen && contentRef.current) {
      setHeight(contentRef.current.scrollHeight)
    } else {
      setHeight(0)
    }
  }, [isOpen])

  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-900/50">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full px-4 py-3.5 flex items-center justify-between text-left cursor-pointer"
      >
        <span className={`font-medium text-sm pr-4 transition-colors duration-200 ${isOpen ? 'text-white' : 'text-gray-400'}`}>
          {faq.question}
        </span>
        <ChevronRight
          className={`h-4 w-4 text-gray-500 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-90' : ''
          }`}
        />
      </button>
      <div
        className="overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height }}
      >
        <div ref={contentRef} className="px-4 pb-4">
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed">{faq.answer}</p>
        </div>
      </div>
    </div>
  )
})

const MobileReferralFAQ = memo(function MobileReferralFAQ({ faqs }: { faqs: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const handleToggle = useCallback((index: number) => {
    setOpenIndex(prev => prev === index ? null : index)
    event('referral_faq_toggle', { question: faqs[index].question })
  }, [faqs])

  return (
    <div className="md:hidden space-y-2">
      {faqs.map((faq, index) => (
        <MobileAccordionItem
          key={index}
          faq={faq}
          isOpen={openIndex === index}
          onToggle={() => handleToggle(index)}
        />
      ))}
    </div>
  )
})

const DesktopReferralFAQ = memo(function DesktopReferralFAQ({ faqs }: { faqs: FaqItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const answerRef = useRef<HTMLDivElement>(null)

  const handleSelect = useCallback((index: number) => {
    setActiveIndex(index)
    event('referral_faq_toggle', { question: faqs[index].question })
  }, [faqs])

  useEffect(() => {
    if (answerRef.current) {
      answerRef.current.scrollHeight
    }
  }, [activeIndex])

  return (
    <div className="hidden md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6 lg:gap-10">
      <nav className="flex flex-col gap-1" role="tablist">
        {faqs.map((faq, index) => {
          const isActive = activeIndex === index
          return (
            <button
              key={index}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSelect(index)}
              className={`group relative text-left px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gray-800/80 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              }`}
            >
              <span className="flex items-center gap-3">
                <ChevronRight
                  className={`h-4 w-4 flex-shrink-0 transition-all duration-200 ${
                    isActive ? 'text-primary translate-x-0.5' : 'text-gray-600 group-hover:text-gray-500'
                  }`}
                />
                <span className="text-sm lg:text-base font-medium">{faq.question}</span>
              </span>
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-full" />
              )}
            </button>
          )
        })}
      </nav>

      <div className="relative min-h-[200px]">
        <div className="sticky top-28 border border-gray-800 rounded-2xl bg-gray-900/60 backdrop-blur-sm p-6 lg:p-8">
          <h3 className="text-white font-semibold text-base lg:text-lg mb-4">
            {faqs[activeIndex].question}
          </h3>
          <div
            ref={answerRef}
            key={activeIndex}
            className="animate-fade-in"
          >
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">{faqs[activeIndex].answer}</p>
          </div>
        </div>
      </div>
    </div>
  )
})

function ReferralFAQ() {
  const { ref, isVisible } = useFadeIn()

  return (
    <section className="section-padding bg-black relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(37, 99, 235, 0.08) 0%, transparent 70%)',
        }}
      />
      <div className="container relative z-10">
        <div ref={ref} className={`fade-in-section ${isVisible ? 'visible' : ''} text-center max-w-3xl mx-auto mb-8 sm:mb-12`}>
          <h2 className="fade-child heading-2 mb-3 sm:mb-4">
            Frequently asked questions
          </h2>
          <p className="fade-child text-base sm:text-lg text-gray-400">
            Everything you need to know about the referral program.
          </p>
        </div>

        <div className={`fade-in-section ${isVisible ? 'visible' : ''} max-w-4xl mx-auto`}>
          <div className="fade-child">
            <MobileReferralFAQ faqs={referralFaqs} />
            <DesktopReferralFAQ faqs={referralFaqs} />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Bottom CTA ── */
function BottomCTA() {
  const { ref, isVisible } = useFadeIn()

  return (
    <section className="section-padding bg-gradient-to-b from-black to-gray-950 relative overflow-hidden">
      <div className="container">
        <div ref={ref} className={`fade-in-section ${isVisible ? 'visible' : ''} relative`}>
          <div className="fade-child">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="heading-2 text-white mb-4 sm:mb-6">
                Ready to start earning?
              </h2>
              <p className="text-base sm:text-lg text-gray-400 mb-8 sm:mb-10">
                Log into your vendor dashboard to get your unique referral link and start sharing.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
                <a
                  href={process.env.NEXT_PUBLIC_DASHBOARD_URL ? `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/referrals` : '/get-started'}
                  onClick={() => event('referral_cta_bottom_dashboard')}
                  className="w-full sm:w-auto"
                >
                  <Button size="lg" variant="primary" className="w-full sm:w-auto group text-sm sm:text-base">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </a>
                <Link
                  href="/get-started"
                  onClick={() => event('referral_cta_bottom_get_started')}
                  className="w-full sm:w-auto"
                >
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto text-sm sm:text-base">
                    Create an Account
                  </Button>
                </Link>
              </div>
              <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-500">
                Already a Luma vendor? Sign in to access your referral dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
