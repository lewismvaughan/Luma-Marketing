/**
 * Stripe rate data for all 23 supported countries.
 *
 * Rates sourced from official Stripe pricing pages (March 2026).
 * These are Stripe's base processing fees — Luma's platform markup
 * is applied on top via getLumaMarkup() below.
 */

export interface StripeRate {
  percent: number
  /** Fixed fee in smallest currency unit (cents, pence, øre, etc.) */
  fixed: number
}

export interface CountryRate {
  code: string
  name: string
  currency: string
  /** Stripe Terminal (card_present) base rate */
  terminal: StripeRate
  /**
   * Tap to Pay surcharge per authorization (smallest currency unit).
   * Added on top of terminal base. null = use ttpRate instead (Australia).
   */
  ttpSurcharge: number | null
  /**
   * Australia has a completely separate TTP rate instead of a surcharge.
   * For all other countries this is null.
   */
  ttpRate: StripeRate | null
  /** Manual card entry / online (card-not-present) rate */
  manualCard: StripeRate
}

/**
 * Luma platform markup per subscription tier.
 * Applied on top of Stripe's processing fees.
 *
 * Mirrors Luma-API/src/config/platform-fees.ts
 */

export type LumaTier = 'starter' | 'pro'

interface LumaMarkupConfig {
  percentRate: number
  fixedCents: number
  label: string
}

/** Default markup (US/CA/AU/NZ/SG/MY) */
const DEFAULT_MARKUP: Record<LumaTier, LumaMarkupConfig> = {
  starter: { percentRate: 0.002, fixedCents: 3, label: '0.2%' },
  pro: { percentRate: 0.001, fixedCents: 1, label: '0.1%' },
}

/**
 * Regional markup overrides by currency.
 * EU/UK: higher markup because Stripe's base is ~1.4% (vs 2.7% in US).
 * Total customer rates still well below US levels.
 *
 * Fixed fees for non-EUR currencies scaled to approximate EUR equivalents.
 */
const REGIONAL_MARKUP: Record<string, Record<LumaTier, LumaMarkupConfig>> = {
  eur: {
    starter: { percentRate: 0.005, fixedCents: 5, label: '0.5%' },
    pro:     { percentRate: 0.004, fixedCents: 2, label: '0.4%' },
  },
  gbp: {
    starter: { percentRate: 0.005, fixedCents: 5, label: '0.5%' },
    pro:     { percentRate: 0.004, fixedCents: 2, label: '0.4%' },
  },
  chf: {
    starter: { percentRate: 0.005, fixedCents: 5, label: '0.5%' },
    pro:     { percentRate: 0.004, fixedCents: 2, label: '0.4%' },
  },
  sek: {
    starter: { percentRate: 0.005, fixedCents: 55, label: '0.5%' },
    pro:     { percentRate: 0.004, fixedCents: 22, label: '0.4%' },
  },
  dkk: {
    starter: { percentRate: 0.005, fixedCents: 38, label: '0.5%' },
    pro:     { percentRate: 0.004, fixedCents: 15, label: '0.4%' },
  },
  nok: {
    starter: { percentRate: 0.005, fixedCents: 55, label: '0.5%' },
    pro:     { percentRate: 0.004, fixedCents: 22, label: '0.4%' },
  },
  czk: {
    starter: { percentRate: 0.005, fixedCents: 125, label: '0.5%' },
    pro:     { percentRate: 0.004, fixedCents: 50, label: '0.4%' },
  },
}

/** Get the Luma markup for a tier + currency. Returns regional override if one exists. */
export function getLumaMarkup(tier: LumaTier, currency: string): LumaMarkupConfig {
  return REGIONAL_MARKUP[currency.toLowerCase()]?.[tier] || DEFAULT_MARKUP[tier]
}

export const COUNTRY_RATES: CountryRate[] = [
  // North America
  {
    code: 'US', name: 'United States', currency: 'usd',
    terminal: { percent: 2.7, fixed: 5 },
    ttpSurcharge: 10, ttpRate: null,
    manualCard: { percent: 2.9, fixed: 30 },
  },
  {
    code: 'CA', name: 'Canada', currency: 'cad',
    terminal: { percent: 2.7, fixed: 5 },
    ttpSurcharge: 15, ttpRate: null,
    manualCard: { percent: 2.9, fixed: 30 },
  },

  // UK
  {
    code: 'GB', name: 'United Kingdom', currency: 'gbp',
    terminal: { percent: 1.4, fixed: 10 },
    ttpSurcharge: 10, ttpRate: null,
    manualCard: { percent: 1.5, fixed: 20 },
  },

  // Oceania
  {
    code: 'AU', name: 'Australia', currency: 'aud',
    terminal: { percent: 1.7, fixed: 10 },
    ttpSurcharge: null,
    ttpRate: { percent: 1.95, fixed: 15 },
    manualCard: { percent: 1.75, fixed: 30 },
  },
  {
    code: 'NZ', name: 'New Zealand', currency: 'nzd',
    terminal: { percent: 2.6, fixed: 5 },
    ttpSurcharge: 15, ttpRate: null,
    manualCard: { percent: 2.65, fixed: 30 },
  },

  // EU (EUR)
  {
    code: 'IE', name: 'Ireland', currency: 'eur',
    terminal: { percent: 1.4, fixed: 10 },
    ttpSurcharge: 10, ttpRate: null,
    manualCard: { percent: 1.5, fixed: 25 },
  },
  {
    code: 'FR', name: 'France', currency: 'eur',
    terminal: { percent: 1.4, fixed: 10 },
    ttpSurcharge: 10, ttpRate: null,
    manualCard: { percent: 1.5, fixed: 25 },
  },
  {
    code: 'DE', name: 'Germany', currency: 'eur',
    terminal: { percent: 1.4, fixed: 10 },
    ttpSurcharge: 10, ttpRate: null,
    manualCard: { percent: 1.5, fixed: 25 },
  },
  {
    code: 'ES', name: 'Spain', currency: 'eur',
    terminal: { percent: 1.4, fixed: 10 },
    ttpSurcharge: 10, ttpRate: null,
    manualCard: { percent: 1.5, fixed: 25 },
  },
  {
    code: 'IT', name: 'Italy', currency: 'eur',
    terminal: { percent: 1.4, fixed: 10 },
    ttpSurcharge: 10, ttpRate: null,
    manualCard: { percent: 1.5, fixed: 25 },
  },
  {
    code: 'NL', name: 'Netherlands', currency: 'eur',
    terminal: { percent: 1.4, fixed: 10 },
    ttpSurcharge: 10, ttpRate: null,
    manualCard: { percent: 1.5, fixed: 25 },
  },
  {
    code: 'BE', name: 'Belgium', currency: 'eur',
    terminal: { percent: 1.4, fixed: 10 },
    ttpSurcharge: 10, ttpRate: null,
    manualCard: { percent: 1.5, fixed: 25 },
  },
  {
    code: 'AT', name: 'Austria', currency: 'eur',
    terminal: { percent: 1.4, fixed: 10 },
    ttpSurcharge: 10, ttpRate: null,
    manualCard: { percent: 1.5, fixed: 25 },
  },
  {
    code: 'PT', name: 'Portugal', currency: 'eur',
    terminal: { percent: 1.4, fixed: 10 },
    ttpSurcharge: 10, ttpRate: null,
    manualCard: { percent: 1.5, fixed: 25 },
  },
  {
    code: 'FI', name: 'Finland', currency: 'eur',
    terminal: { percent: 1.4, fixed: 10 },
    ttpSurcharge: 10, ttpRate: null,
    manualCard: { percent: 1.5, fixed: 25 },
  },
  {
    code: 'LU', name: 'Luxembourg', currency: 'eur',
    terminal: { percent: 1.4, fixed: 10 },
    ttpSurcharge: 10, ttpRate: null,
    manualCard: { percent: 1.5, fixed: 25 },
  },

  // EU (non-EUR)
  {
    code: 'SE', name: 'Sweden', currency: 'sek',
    terminal: { percent: 1.4, fixed: 100 },
    ttpSurcharge: 105, ttpRate: null,
    manualCard: { percent: 1.5, fixed: 180 },
  },
  {
    code: 'DK', name: 'Denmark', currency: 'dkk',
    terminal: { percent: 1.4, fixed: 75 },
    ttpSurcharge: 70, ttpRate: null,
    manualCard: { percent: 1.5, fixed: 180 },
  },
  {
    code: 'NO', name: 'Norway', currency: 'nok',
    terminal: { percent: 1.4, fixed: 100 },
    ttpSurcharge: 105, ttpRate: null,
    manualCard: { percent: 2.4, fixed: 200 },
  },
  {
    code: 'CH', name: 'Switzerland', currency: 'chf',
    terminal: { percent: 1.4, fixed: 10 },
    ttpSurcharge: 10, ttpRate: null,
    manualCard: { percent: 2.9, fixed: 30 },
  },
  {
    code: 'CZ', name: 'Czechia', currency: 'czk',
    terminal: { percent: 1.4, fixed: 225 },
    ttpSurcharge: 220, ttpRate: null,
    manualCard: { percent: 1.5, fixed: 450 },
  },

  // Asia
  {
    code: 'SG', name: 'Singapore', currency: 'sgd',
    terminal: { percent: 3.4, fixed: 50 },
    ttpSurcharge: 15, ttpRate: null,
    manualCard: { percent: 3.4, fixed: 50 },
  },
  {
    code: 'MY', name: 'Malaysia', currency: 'myr',
    terminal: { percent: 2.8, fixed: 50 },
    ttpSurcharge: 45, ttpRate: null,
    manualCard: { percent: 3.0, fixed: 100 },
  },
]

const ratesByCode = new Map(COUNTRY_RATES.map(r => [r.code, r]))

/** Estimated Stripe online card rate by currency. First match per currency wins (rates are identical within a currency). */
const onlineRatesByCurrency = new Map<string, StripeRate>()
for (const country of COUNTRY_RATES) {
  const cur = country.currency.toLowerCase()
  if (!onlineRatesByCurrency.has(cur)) {
    onlineRatesByCurrency.set(cur, country.manualCard)
  }
}

/** Get the estimated Stripe online card processing rate for a currency. Falls back to USD rates. */
export function getOnlineCardRate(currency: string): StripeRate {
  return onlineRatesByCurrency.get(currency.toLowerCase()) || onlineRatesByCurrency.get('usd')!
}

export function getCountryRate(code: string): CountryRate {
  return ratesByCode.get(code.toUpperCase()) || ratesByCode.get('US')!
}

/**
 * Format a fixed fee in smallest unit to display string.
 * e.g. 30 cents USD → "$0.30", 10 pence GBP → "£0.10", 225 haléřů CZK → "2.25 Kč"
 */
export function formatFixedFee(smallestUnit: number, currency: string): string {
  const cur = currency.toLowerCase()
  const ZERO_DECIMAL = ['jpy', 'krw', 'bif', 'clp', 'djf', 'gnf', 'kmf', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf']

  if (ZERO_DECIMAL.includes(cur)) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: cur.toUpperCase(),
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(smallestUnit)
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: cur.toUpperCase(),
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(smallestUnit / 100)
}

/**
 * Get the effective Tap to Pay rate for a country.
 * Returns { percent, fixed } representing the total TTP rate.
 */
export function getTTPRate(country: CountryRate): StripeRate {
  if (country.ttpRate) return country.ttpRate
  return {
    percent: country.terminal.percent,
    fixed: country.terminal.fixed + (country.ttpSurcharge || 0),
  }
}

/**
 * Format a rate as a human-readable string like "2.9% + $0.18"
 */
export function formatRate(rate: StripeRate, currency: string, markup?: LumaTier): string {
  let percent = rate.percent
  let fixed = rate.fixed

  if (markup) {
    const m = getLumaMarkup(markup, currency)
    percent = +(percent + m.percentRate * 100).toFixed(2)
    fixed = fixed + m.fixedCents
  }

  return `${percent}% + ${formatFixedFee(fixed, currency)}`
}

/**
 * Get the full rate display string for Tap to Pay at a given tier.
 */
export function getTTPRateDisplay(code: string, tier: LumaTier): string {
  const country = getCountryRate(code)
  const ttp = getTTPRate(country)
  return formatRate(ttp, country.currency, tier)
}

/**
 * Get the full rate display string for manual card at a given tier.
 */
export function getManualCardRateDisplay(code: string, tier: LumaTier): string {
  const country = getCountryRate(code)
  return formatRate(country.manualCard, country.currency, tier)
}
