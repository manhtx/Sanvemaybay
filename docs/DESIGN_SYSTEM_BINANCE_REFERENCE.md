# FlyCheap Design System — Binance Financial Platform Reference

> **Origin:** Extracted Binance Design System (`binance.com`) adapted for FlyCheap Airfare Intelligence Engine.  
> **Philosophy:** High-trust, confident financial-grade interface. Deep near-black canvas (`#0B0E11`), iconic Binance Yellow (`#FCD535`) for high-voltage primary actions, crisp gray-blue hairlines (`#2B3139`), and trading green (`#0ECB81`) / red (`#F6465D`) for real-time price trend dynamics.

---

## 1. Executive Summary & Brand Alignment

FlyCheap is an **Airfare Opportunity Intelligence Instrument** — not a leisure travel agency. Its core value lies in helping travelers detect anomalous price drops, assess real total cost and separate-ticket risk, and decide with confidence.

Adopting the Binance financial-grade design system elevates FlyCheap from a generic travel search page into a high-precision travel market terminal:
- **High-contrast, dark-first canvas**: Minimizes eye strain during deep analysis while giving financial weight to deal data.
- **Iconic Yellow (`#FCD535`) voltage**: Directs focus immediately to the highest-priority conversion and decision point.
- **Price Signal Colors**: Green (`#0ECB81`) for price drops / high savings; Red (`#F6465D`) for price surges / high transfer risks.
- **Tabular Precision**: Clean sans-serif (`Inter`, `system-ui`) with strict tabular numerals for airline fares, departure times, and savings percentages.

---

## 2. Design Tokens

### Color Palette

| Token | Hex | Tailwind Utility | Semantic Role in FlyCheap |
|---|---|---|---|
| `--color-binance-primary` | `#FCD535` | `bg-binance-primary`, `text-binance-primary` | Primary CTA, brand highlights, active states |
| `--color-binance-primary-active` | `#F0B90B` | `bg-binance-primary-active` | Button hover & active interaction |
| `--color-binance-primary-disabled` | `#3A3A1F` | `bg-binance-primary-disabled` | Disabled primary buttons on dark |
| `--color-binance-on-primary` | `#181A20` | `text-binance-on-primary` | Dark text on yellow buttons |
| `--color-binance-canvas-dark` | `#0B0E11` | `bg-binance-canvas-dark` | Deep dark background canvas |
| `--color-binance-card-dark` | `#1E2329` | `bg-binance-card-dark` | Deal cards, search box, modal surfaces |
| `--color-binance-elevated-dark` | `#2B3139` | `bg-binance-elevated-dark` | Hovered rows, floating popovers, badges |
| `--color-binance-hairline-dark` | `#2B3139` | `border-binance-hairline-dark` | 1px border dividers, subtle card borders |
| `--color-binance-canvas-light` | `#FFFFFF` | `bg-binance-canvas-light` | Transactional/detail surface canvas |
| `--color-binance-soft-light` | `#FAFAFA` | `bg-binance-soft-light` | Soft background for light tables/footers |
| `--color-binance-strong-light` | `#F5F5F5` | `bg-binance-strong-light` | Card surfaces in light mode |
| `--color-binance-hairline-light` | `#EAECEF` | `border-binance-hairline-light` | Subtle dividers in light mode |
| `--color-binance-border-strong` | `#CDD1D6` | `border-binance-border-strong` | Active input border in light mode |
| `--color-binance-ink` | `#181A20` | `text-binance-ink` | Primary text in light mode |
| `--color-binance-body` | `#EAECEF` | `text-binance-body` | Primary text on dark canvas |
| `--color-binance-muted` | `#707A8A` | `text-binance-muted` | Secondary labels, flight route airport codes |
| `--color-binance-muted-strong` | `#929AA5` | `text-binance-muted-strong` | Timestamps, terms, disclaimer copy |
| `--color-trading-up` | `#0ECB81` | `text-trading-up`, `bg-trading-up` | Price drop, savings badge, positive deal score |
| `--color-trading-down` | `#F6465D` | `text-trading-down`, `bg-trading-down` | Price increase, transfer risk, alert urgency |
| `--color-binance-turquoise` | `#2DBDB6` | `text-binance-turquoise` | Special promo tags, airline direct fare indicators |
| `--color-info` | `#3B82F6` | `text-blue-500`, `border-blue-500` | Educational tooltips, neutral flight route info |

---

## 3. Typography Scale

- **Family Stack:** `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Tabular Numerals:** Always apply `.tabular-nums` for prices, dates, percentages, and flight durations.

| Role | Font Size | Line Height | Letter Spacing | Weight | Usage |
|---|---|---|---|---|---|
| `hero-display` | 64px (4rem) | 1.1 | -1px | 700 | Main landing hero headline |
| `display-lg` | 48px (3rem) | 1.1 | -0.5px | 700 | Category headlines, major value props |
| `display-md` | 40px (2.5rem) | 1.15 | -0.3px | 700 / 600 | Deal detail route headers |
| `display-sm` | 32px (2rem) | 1.2 | 0 | 600 | Section headers |
| `title-lg` | 24px (1.5rem) | 1.3 | 0 | 600 | Card titles, modal headers |
| `title-md` | 20px (1.25rem) | 1.35 | 0 | 600 / 500 | Filter headers, sub-sections |
| `title-sm` | 16px (1rem) | 1.4 | 0 | 600 / 500 | Deal card route, airline name |
| `number-display` | 40px (2.5rem) | 1.1 | -0.3px | 700 | Massive deal price callout |
| `number-md` | 16px (1rem) | 1.4 | 0 | 600 | Card price, savings percentage |
| `number-sm` | 14px (0.875rem) | 1.4 | 0 | 500 | Historical baseline price |
| `body-md` | 14px (0.875rem) | 1.5 | 0 | 400 | Default body text, descriptions |
| `body-sm` | 13px (0.8125rem) | 1.5 | 0 | 400 | Supporting metadata, terms |
| `caption` | 12px (0.75rem) | 1.4 | 0 | 400 / 500 | Freshness timestamps, footnotes |
| `button` | 14px (0.875rem) | 1 | 0 | 500 / 600 | Button labels |
| `nav-link` | 14px (0.875rem) | 1.4 | 0 | 500 | Navigation bar links |

---

## 4. Spacing, Radius & Geometry

- **Base scale:** 4px grid (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `80px`).
- **Card Padding:** 24px (`p-6`). Compact cards use 16px (`p-4`).
- **Section Gap:** 80px (`py-20`).
- **Max Content Width:** 1200px (`max-w-[1200px]` or `max-w-7xl`).
- **Border Radius:**
  - Control elements & inputs: `rounded-md` (6px) or `rounded-lg` (8px).
  - Cards & panels: `rounded-xl` (12px).
  - Pill badges & conversion buttons: `rounded-full` (`rounded-pill`, 9999px).

---

## 5. Component Patterns & Flight Intelligence Adaptation

### A. Primary Conversion Button (The Iconic Yellow CTA)
```tsx
<button
  className="h-10 px-6 rounded-md bg-[#FCD535] hover:bg-[#F0B90B] active:bg-[#F0B90B] text-[#181A20] font-semibold text-sm transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:bg-[#3A3A1F] disabled:text-[#707A8A] disabled:cursor-not-allowed"
>
  Săn vé ngay
</button>
```

### B. Price Direction Cells & Ticker (Trading Up / Down)
- **Price Drop (Deal Savings):**
  ```tsx
  <span className="text-[#0ECB81] bg-[#0ECB81]/10 px-2 py-0.5 rounded text-xs font-semibold tabular-nums">
    -34% (Tiết kiệm 1.250.000₫)
  </span>
  ```
- **Price Hike / High Volatility:**
  ```tsx
  <span className="text-[#F6465D] bg-[#F6465D]/10 px-2 py-0.5 rounded text-xs font-semibold tabular-nums">
    +18% (Đang tăng giá)
  </span>
  ```

### C. Financial Deal Table (Binance Markets Pattern)
A tabular view for route intelligence:
- Columns: `Chặng bay (Route)`, `Hãng bay (Airline)`, `Giá hiện tại (Current Fare)`, `24h / vs TB (Trend)`, `Độ tin cậy (Confidence)`, `Hành động (Action)`.
- Background: `#1E2329` card with `#2B3139` hairlines and hover state `#2B3139`/40.

### D. "SAFU" Trust & Verification Band
Binance's iconic "Funds are SAFU" translated into FlyCheap's **"Data Truth Guarantee"**:
- 100% verified provider prices (no scraper hallucinations).
- Explicit separate-ticket & self-transfer risk assessment.
- Clear itemization of baggage fees and airport taxes before redirection.

---

## 6. Implementation Do's and Don'ts

### Do:
- Use `#FCD535` for primary buttons and high-intent actions.
- Keep data tables and deal tickers scannable with high typographic hierarchy and tabular numbers.
- Pair color indicators with text or icons (e.g. arrow icons with green/red percentages) for accessibility.
- Ground all prices in real observation timestamps (`Cập nhật 15 phút trước`).

### Don't:
- Do not introduce arbitrary neon blues or purples that clash with the `#FCD535` + `#0B0E11` financial palette.
- Do not make text low contrast: use `#EAECEF` for body text and `#707A8A` for muted metadata.
- Do not hide critical pricing risks behind obscure clicks.
