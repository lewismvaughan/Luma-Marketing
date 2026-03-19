# Luma-Marketing - Marketing Website & Onboarding

> **For full ecosystem context, see the root [CLAUDE.md](../CLAUDE.md)**

## Project Overview

Luma-Marketing is the marketing website and vendor onboarding platform for Luma POS. It provides the public-facing website with pricing information, feature showcases, and a multi-step signup wizard with Stripe subscription integration.

**Tech Stack:**
- **Framework:** Next.js 16 (App Router, Static Export)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Animations:** Framer Motion (desktop), CSS animations (mobile)
- **Payments:** Stripe Elements (subscription checkout)
- **Icons:** Lucide React

---

## Directory Structure

```
Luma-Marketing/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Landing page (composition of sections)
│   ├── get-started/              # Multi-step onboarding wizard
│   │   └── page.tsx              # ~950 lines - full signup flow
│   ├── menu/                     # Public external menus (QR code entry point)
│   │   └── [slug]/
│   │       ├── page.tsx          # Menu browsing with cart (~430 lines)
│   │       ├── checkout/
│   │       │   └── page.tsx      # Checkout form + Stripe payment (~666 lines)
│   │       └── success/
│   │           └── page.tsx      # Order confirmation + live tracking (~403 lines)
│   ├── events/                   # Public events pages
│   │   ├── page.tsx              # Events listing grid
│   │   └── [slug]/
│   │       └── page.tsx          # Individual event + ticket purchase
│   ├── about/                    # About page
│   ├── contact/                  # Contact form
│   ├── privacy/                  # Privacy policy
│   ├── terms/                    # Terms of service
│   ├── custom-plan-request/      # Enterprise plan request form
│   ├── onboarding/               # Onboarding completion & auth refresh
│   ├── subscription/             # Payment success page
│   └── layout.tsx                # Root layout with providers
├── components/
│   ├── ui/                       # Base components
│   │   ├── Button.tsx            # Button variants
│   │   ├── Card.tsx              # Card with hover effects
│   │   ├── Input.tsx             # Form input
│   │   └── Badge.tsx             # Status badges
│   ├── providers/
│   │   └── AuthProvider.tsx      # Auth context provider
│   ├── Hero.tsx                  # Hero section with phone mockup
│   ├── Features.tsx              # Feature showcase grid
│   ├── EventsShowcase.tsx        # Events/ticketing showcase section
│   ├── Pricing.tsx               # Pricing tier cards
│   ├── FAQ.tsx                   # Accordion FAQ section
│   ├── Header.tsx                # Navigation with scroll effects
│   ├── Footer.tsx                # Site footer with links
│   └── ...                       # Other marketing sections
├── lib/
│   ├── api/                      # API client
│   │   ├── client.ts             # Base HTTP client
│   │   ├── auth.ts               # Auth service
│   │   ├── menu.ts               # Public menu API (catalog fetch, preorder CRUD)
│   │   └── interceptor.ts        # Request/response interceptors
│   ├── stripe.ts                 # Stripe initialization
│   ├── pricing.ts                # Pricing tier definitions
│   └── auth-handoff.ts           # Cross-app auth token handoff
├── hooks/
│   ├── useFadeIn.ts              # Viewport-triggered fade animation
│   ├── useAuth.ts                # Authentication state
│   └── useIsMobile.ts            # Mobile detection
└── styles/
    └── globals.css               # Tailwind v4 + custom utilities
```

---

## Key Pages

| Route | Purpose |
|-------|---------|
| `/` | Marketing landing with Hero, Features, EventsShowcase, Pricing, FAQ |
| `/get-started` | Multi-step signup wizard with payment |
| `/menu/[slug]` | Public external menu — browse products, add to cart (QR code entry point) |
| `/menu/[slug]/checkout` | Preorder checkout — customer info, tips, Stripe payment |
| `/menu/[slug]/success` | Order confirmation — real-time status tracking via Socket.IO |
| `/events` | Public events listing (browse upcoming events) |
| `/events/[slug]` | Public event page with ticket purchase |
| `/about` | Company mission and values |
| `/contact` | Contact form |
| `/custom-plan-request` | Enterprise custom pricing request |
| `/terms` | Terms of service |
| `/privacy` | Privacy policy |
| `/onboarding` | Post-signup completion handler |
| `/subscription` | Payment success confirmation |

---

## Public Events Pages

The marketing site hosts public-facing event pages where customers can browse and purchase tickets.

### `/events` - Events Listing
- Grid of upcoming public events
- Shows event image, name, date, location
- Links to individual event pages

### `/events/[slug]` - Event Detail Page
- Event hero with image and details
- Ticket tier selection and quantity
- Stripe checkout integration
- Apple/Google Wallet pass delivery after purchase
- Ticket confirmation emails with QR codes

**Key Features:**
- Events are created by vendors in the Vendor Dashboard
- Public events appear on the marketing site automatically
- Tickets include QR codes for scanning at entry
- Wallet passes for Apple Wallet and Google Wallet
- Day-before reminder emails

---

## External Menus & Preorder Checkout

The marketing site hosts the customer-facing external menu pages. Vendors generate QR codes in the Vendor Dashboard that link to `https://lumapos.co/menu/{slug}`. Customers scan the QR code to browse, order, and optionally pay — all without creating an account.

### `/menu/[slug]` - Menu Browsing

- Fetches catalog data from `GET /menu/public/{slug}` (unauthenticated API endpoint)
- Displays products in a responsive grid (2-4 columns) with category tabs
- Cart managed in React state and persisted to `sessionStorage` (`preorder_cart_{slug}`)
- Floating cart button appears when items are added; opens a cart drawer modal
- Quantity controls (+/-) on product cards and in cart drawer

### `/menu/[slug]/checkout` - Checkout

- Reads cart from `sessionStorage`, redirects to menu if empty
- Customer form: first name, last name, email (required), phone (optional), order notes
- **Payment mode** determined by catalog's `preorderPaymentMode`:
  - `pay_now` — Stripe PaymentElement for card entry, payment confirmed server-side
  - `pay_at_pickup` — no payment collected, customer pays via Tap to Pay at pickup
  - `both` — customer chooses between the two options
- **Tips** shown if `catalog.showTipScreen === true`, with preset percentages and optional custom amount
- **Tax** calculated as `subtotal * (taxRate / 100)` from catalog settings
- Submits to `POST /menu/public/{slug}/preorder` with items, customer info, and optional `paymentMethodId`
- On success, redirects to `/menu/{slug}/success?id={preorderId}&email={email}`

**Stripe integration:**
```tsx
<Elements stripe={stripePromise} options={{
  mode: 'payment',
  amount: Math.round(total * 100), // base unit → smallest unit (assumes 2-decimal currency)
  currency: catalogCurrency, // Must use the catalog's currency from the API — NEVER hardcode 'usd'
  paymentMethodCreation: 'manual',
  appearance: { theme: 'night', variables: { colorPrimary: '#2563EB', colorBackground: '#111827' } },
}}>
  <PayNowCheckoutForm />
</Elements>
```

The form creates a PaymentMethod client-side, sends the `paymentMethodId` to the API, and the API confirms the charge on the connected Stripe account.

### `/menu/[slug]/success` - Order Tracking

- Fetches order status from `GET /menu/public/{slug}/preorder/{id}?email={email}`
- Connects to Socket.IO `/public` namespace, joins `preorder:{preorderId}` room
- Listens for real-time events: `preorder:updated`, `preorder:ready`, `preorder:completed`, `preorder:cancelled`
- Visual status progression: Pending → Confirmed → Preparing → Ready → Picked Up (or Cancelled)
- Shows estimated ready time, order summary, pickup instructions, and live connection indicator

### Menu API Client (`lib/api/menu.ts`)

```typescript
export const publicMenuApi = {
  getCatalog: (slug) =>           // GET /menu/public/{slug}
  createPreorder: (slug, data) => // POST /menu/public/{slug}/preorder
  getPreorderStatus: (slug, id, email) => // GET /menu/public/{slug}/preorder/{id}?email=...
  cancelPreorder: (slug, id, email) =>    // POST /menu/public/{slug}/preorder/{id}/cancel
};
```

### Key Data Types

```typescript
interface PublicCatalog {
  id: string; name: string; slug: string;
  organizationName: string;
  preorderPaymentMode: 'pay_now' | 'pay_at_pickup' | 'both';
  pickupInstructions: string | null;
  estimatedPrepTime: number;
  taxRate: number; showTipScreen: boolean;
  tipPercentages: number[]; allowCustomTip: boolean;
  categories: PublicCategory[];
  products: PublicProduct[];
}

interface CreatePreorderRequest {
  customerName: string; customerEmail: string;
  customerPhone?: string;
  paymentType: 'pay_now' | 'pay_at_pickup';
  items: { catalogProductId: string; quantity: number; notes?: string }[];
  tipAmount?: number; orderNotes?: string;
  paymentMethodId?: string; // Required for pay_now
}
```

### Important Notes
- **No auth required** — all menu endpoints are public
- **Monetary values** from the API are in **dollars** (not cents) — display directly, do NOT divide by 100
- **Cart is session-scoped** — cleared on successful order, stored per-slug in `sessionStorage`
- **Socket.IO** connects to the `/public` namespace (unauthenticated) for real-time order tracking

---

## Pricing Tiers

Plan definitions: `lib/pricing.ts`. Transaction fee strings there are US defaults for the homepage.

**Rate data is in `lib/stripe-rates.ts`** — Stripe base rates per country + Luma platform markup. Both the homepage `Pricing.tsx` and the dedicated `/pricing` page use country-aware rates via `getLumaMarkup(tier, currency)`.

### Luma platform markup (on top of Stripe)

**Default (US/CA/AU/NZ/SG/MY):** Starter 0.2% + 3, Pro 0.1% + 1
**EU/UK (EUR/GBP/CHF/SEK/DKK/NOK/CZK):** Starter 0.5% + 5, Pro 0.4% + 2 (fixed scaled per currency)

These mirror `Luma-API/src/config/platform-fees.ts` — keep them in sync.

### Stripe base rates (Terminal / Tap to Pay)

| Region | Terminal | TTP Extra | Online |
|--------|---------|-----------|--------|
| US/CA | 2.7% + $0.05 | +$0.10–$0.15 | 2.9% + $0.30 |
| EU (EUR) | 1.4% + €0.10 | +€0.10 | 1.5% + €0.25 |
| UK | 1.4% + £0.10 | +£0.10 | 1.5% + £0.20 |
| AU | 1.7% + A$0.10 | 1.95%+A$0.15* | 1.75% + A$0.30 |
| NZ | 2.6% + NZ$0.05 | +NZ$0.15 | 2.65% + NZ$0.30 |
| SG | 3.4% + S$0.50 | +S$0.15 | 3.4% + S$0.50 |
| MY | 2.8% + RM 0.50 | +RM 0.45 | 3.0% + RM 1.00 |

*AU has a separate TTP rate, not a surcharge. Full data for all 23 countries in `lib/stripe-rates.ts`.

### Country detection

`middleware.ts` reads `x-vercel-ip-country` header (Vercel Edge), sets `luma-country` cookie. Client components read the cookie to show country-specific rates.

---

## Multi-Currency Support (MANDATORY)

Luma supports 23 countries with different currencies. The marketing site must never assume USD when displaying prices or processing payments.

### Rules

1. **NEVER** hardcode `"$"` for currency symbols — use the org/catalog currency from API responses
2. **NEVER** use raw `/ 100` or `* 100` — use proper conversion based on zero-decimal currency status
3. **Checkout pages** (`/menu/[slug]/checkout`) must use the catalog's currency from the API, not hardcoded `'usd'`
4. **Rate displays** must use `formatFixedFee()` and `formatRate()` from `lib/stripe-rates.ts` — these handle currency-appropriate formatting
5. **Pricing page** (`/pricing`) uses country-detected currency via the `luma-country` cookie

---

## Onboarding Flow (`/get-started`)

The signup wizard is a multi-step form with conditional steps based on the selected tier.

### Steps

1. **Pricing Selection**
   - Display tier cards with features
   - Starter/Pro/Enterprise selection
   - Enterprise redirects to custom plan request

2. **Account Creation**
   - Email input with availability check
   - Password with strength requirements
   - Real-time email validation via API

3. **Business Information**
   - First name, last name
   - Business name
   - Business type (dropdown)
   - Phone number

4. **Use Case** (Enterprise only)
   - Custom requirements gathering
   - Expected transaction volume
   - Special needs

5. **Payment** (Pro only)
   - Stripe Elements integration
   - Card input with validation
   - Night theme styling

6. **Confirmation**
   - Success message
   - Auto-redirect to vendor dashboard
   - Token handoff via URL hash

### Implementation Details

```typescript
// Form state management
const [step, setStep] = useState(1);
const [formData, setFormData] = useState({
  tier: 'starter',
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  businessName: '',
  businessType: '',
  phone: '',
});

// Email availability check
const checkEmail = async (email: string) => {
  const available = await authService.checkEmailAvailability(email);
  setEmailError(available ? null : 'Email already in use');
};

// Stripe payment for Pro tier
const handlePayment = async () => {
  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: `${window.location.origin}/subscription`,
    },
  });
};
```

---

## Design System

### Colors
```css
/* Primary */
--primary-50: #EFF6FF;
--primary-600: #2563EB;    /* Main brand color */
--primary-700: #1D4ED8;
--primary-950: #172554;

/* Background */
--bg-primary: #000000;     /* Pure black */
--bg-card: #111827;        /* gray-900 */
--bg-card-hover: #1F2937;  /* gray-800 */

/* Text */
--text-primary: #FFFFFF;
--text-secondary: #9CA3AF;  /* gray-400 */
--text-muted: #6B7280;      /* gray-500 */
```

### Typography
```css
/* Headings in globals.css */
.heading-1 {
  @apply text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight;
}
.heading-2 {
  @apply text-3xl md:text-4xl font-bold tracking-tight;
}
.heading-3 {
  @apply text-xl md:text-2xl font-semibold;
}
```

### Component Patterns

```tsx
// Button variants
<Button variant="primary" size="lg">Get Started</Button>
<Button variant="secondary">Learn More</Button>
<Button variant="ghost">Cancel</Button>
<Button variant="white">Contact Sales</Button>

// Card with hover
<Card variant="default" hover className="p-6">
  <h3>Feature Title</h3>
  <p>Description text</p>
</Card>
```

### Image Handling

Use Next.js `<Image>` for local static images in `/public/`. Use native `<img>` for external/dynamic URLs.

**Use `<Image>` (Next.js) for:**
- Screenshots in `/public/screenshots/`
- App store badges (`/apple-download.png`, `/google-download.png`)
- Any static assets with known dimensions

```tsx
import Image from 'next/image'

// Static screenshot with fill (parent must have position: relative)
<Image src="/screenshots/hero-center.webp" alt="..." fill className="object-cover" />

// Static image with explicit dimensions
<Image src="/apple-download.png" alt="Download on App Store" width={168} height={56} />
```

**Use `<img>` (native) for:**
- External API URLs (QR code generators, CDN images)
- Dynamic URLs from API responses (event images, user avatars)
- URLs that can't be optimized at build time

```tsx
// QR code from external API - must use native <img>
<img
  src={`https://api.qrserver.com/v1/create-qr-code/?data=${url}`}
  alt="QR Code"
  className="w-40 h-40"
/>

// Event image from API - URL not known at build time
<img src={event.coverImageUrl} alt={event.name} className="w-full h-auto" />
```

**Note:** The ESLint rule `@next/next/no-img-element` is disabled in this project because external URLs require native `<img>`.

---

## Animation System

### Desktop (Framer Motion)
```tsx
import { motion, useInView } from 'framer-motion';

const ref = useRef(null);
const isInView = useInView(ref, { once: true });

<motion.div
  ref={ref}
  initial={{ opacity: 0, y: 20 }}
  animate={isInView ? { opacity: 1, y: 0 } : {}}
  transition={{ duration: 0.5 }}
>
  {children}
</motion.div>
```

### Mobile (CSS + Intersection Observer)
```tsx
// useFadeIn hook for performance
const { ref, isVisible } = useFadeIn();

<div
  ref={ref}
  className={`transition-opacity duration-500 ${
    isVisible ? 'opacity-100' : 'opacity-0'
  }`}
>
  {children}
</div>
```

### Mobile Performance
- Framer Motion disabled below 1024px viewport
- Blur effects reduced via CSS media queries
- `isMobile` state defaults to `true` to prevent hydration mismatch

---

## API Integration

### Auth Service (`lib/api/auth.ts`)
```typescript
export const authService = {
  signup: (data: SignupData) =>
    apiClient.post('/auth/signup', data),

  login: (credentials: LoginData) =>
    apiClient.post('/auth/login', credentials),

  refreshTokens: () =>
    apiClient.post('/auth/refresh'),

  checkEmailAvailability: (email: string) =>
    apiClient.post('/auth/check-email', { email }),
};
```

### API Client (`lib/api/client.ts`)
```typescript
const apiClient = {
  get: <T>(url: string) => fetch(url).then(r => r.json()),
  post: <T>(url: string, data: any) =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),
};
```

---

## Cross-App Auth Handoff

After signup, users are redirected to the vendor dashboard with tokens passed via URL hash:

```typescript
// lib/auth-handoff.ts
export const handoffToVendor = (tokens: AuthTokens) => {
  const params = new URLSearchParams({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });

  window.location.href = `${DASHBOARD_URL}/#${params.toString()}`;
};

// Vendor dashboard extracts tokens from hash
const extractTokensFromHash = () => {
  const hash = window.location.hash.slice(1);
  const params = new URLSearchParams(hash);
  return {
    accessToken: params.get('accessToken'),
    refreshToken: params.get('refreshToken'),
  };
};
```

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_APP_NAME=Luma POS
NEXT_PUBLIC_APP_URL=https://lumapos.co
NEXT_PUBLIC_API_URL=http://localhost:3334
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:3335
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

---

## Build & Deploy

```bash
# Development
npm run dev              # Start dev server at localhost:3333

# Production build (static export)
npm run build            # Outputs to /out directory

# Preview production build
npm run start

# Docker builds
npm run build:dev        # Build + push dev Docker image
npm run build:prod       # Build + push prod Docker image
```

### Static Export
The site is configured for static HTML export (no Node.js server required):

```typescript
// next.config.ts
export default {
  output: 'export',
  images: { unoptimized: true },
};
```

Deployable to: S3, Vercel, Cloudflare Pages, Netlify, GitHub Pages

---

## Common Tasks

### Add a new marketing section
1. Create component in `components/`
2. Import and add to `app/page.tsx`
3. Use `useFadeIn` hook for mobile, `useInView` + Framer Motion for desktop
4. Follow existing section patterns for consistency

### Add a new page
1. Create `app/[route]/page.tsx`
2. Add to Header navigation if needed
3. Add to Footer links if needed
4. Follow existing page patterns

### Modify pricing tiers
Edit `lib/pricing.ts` for plan names/features/prices. Edit `lib/stripe-rates.ts` for transaction rates (Stripe base + Luma markup). Changes propagate to:
- Homepage Pricing component (country-aware rates)
- `/pricing` dedicated rates page
- FAQ component (fee answers)
- Onboarding wizard tier selection

### Update onboarding steps
Edit `app/get-started/page.tsx`:
- Steps are conditional based on selected tier
- Form validation is inline
- Stripe Elements styling in payment step

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `next` 16.x | React framework (App Router) |
| `tailwindcss` 4.x | Styling |
| `framer-motion` | Desktop animations |
| `@stripe/react-stripe-js` | Payment forms |
| `@stripe/stripe-js` | Stripe SDK |
| `lucide-react` | Icons |
| `react-intersection-observer` | Scroll-triggered effects |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Hydration mismatch | Check `isMobile` defaults to `true` |
| Stripe not loading | Verify publishable key, check HTTPS |
| Email check failing | Verify API URL, check CORS settings |
| Static export issues | Ensure no server-side features used |
| Animation jank on mobile | Animations should be CSS-only below 1024px |

---

## Video Assets

The dashboard demo video (`public/analytics-loop.webm`) is a looping clip that plays forward then reverse. It was created using **ffmpeg**.

**Concatenate forward + reverse into a loop:**
```bash
ffmpeg -i forward.webm -i reverse.webm -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0" -c:v libvpx-vp9 -crf 35 -b:v 0 -r 15 -an analytics-loop.webm
```

**Or generate the reverse from a single source:**
```bash
ffmpeg -i source.webm -filter_complex "[0:v]split[fwd][rev];[rev]reverse[r];[fwd][r]concat=n=2:v=1:a=0" -c:v libvpx-vp9 -crf 35 -b:v 0 -r 15 -an analytics-loop.webm
```

**Key flags:** `-c:v libvpx-vp9` (VP9 codec), `-crf 35` (quality, higher = smaller), `-b:v 0` (variable bitrate), `-r 15` (15fps, sufficient for UI scroll recordings), `-an` (no audio)

---

## Code Review & Quality Enforcement

All implementations will be reviewed by Codex. The following standards are enforced:

### Code Standards
- **TypeScript strict mode** — no `any` types unless explicitly justified
- **Consistent naming** — camelCase for variables/functions, PascalCase for components/types, UPPER_SNAKE_CASE for constants
- **No dead code** — unused imports, variables, components, or commented-out blocks must be removed
- **Performance** — images must be optimized, animations must not block the main thread, bundle size must be monitored
- **Accessibility** — proper semantic HTML, ARIA labels, keyboard navigation, sufficient color contrast
- **SEO** — proper meta tags, structured data, and semantic headings on all public pages

### Functionality Checks
- **All code paths tested** — happy path, error cases, empty states, and loading states must be verified
- **Onboarding flow** — signup wizard must handle all edge cases (Stripe failures, validation errors, back navigation)
- **Static export compatibility** — no server-side features that break `next export`
- **Cross-browser testing** — must work on Chrome, Safari, Firefox, and mobile browsers
- **Responsive design** — all pages must work on mobile, tablet, and desktop viewports

### Review Process
- Codex will flag violations of these standards during review
- PRs with unresolved violations will not be approved
- When in doubt, prefer explicit over clever — readability and correctness over brevity

---

**Remember:** This is the first touchpoint for new vendors. Ensure fast load times, clear messaging, and a smooth onboarding experience. Test the full signup flow regularly.
