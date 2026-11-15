# FlyCheap UI Guidelines — Binance Financial Platform Language

These guidelines define the financial-grade interface standard for FlyCheap (Farely), inspired by Binance's design language: deep near-black surfaces, iconic high-voltage yellow (`#FCD535`) CTAs, crisp hairlines, tabular data fidelity, and trading green/red price trend indicators.

---

## 1. Core Principles

1. **Airfare as an Asset Class:** Treat flight deals, route price fluctuations, and historical fare volatility with the rigor of a financial terminal.
2. **Deterministic Data Truth:** Every number is anchored in actual observation evidence. Price drops are marked in green (`#0ECB81`), price spikes or elevated risk in red (`#F6465D`).
3. **High-Voltage Focus:** Binance Yellow (`#FCD535`) is reserved for primary CTAs and critical conversion points. Never overuse it as background fill.
4. **Restrained, Confident Shell:** Backgrounds stay quiet (`#0B0E11` on dark, `#FFFFFF` on light). Content and data carry the contrast.

---

## 2. Token Registry

### Colors
- **Primary Yellow:** `#FCD535` (`--color-binance-primary`)
- **Primary Hover/Active:** `#F0B90B` (`--color-binance-primary-active`)
- **Canvas Dark:** `#0B0E11` (`--color-binance-canvas-dark`)
- **Card Dark Surface:** `#1E2329` (`--color-binance-card-dark`)
- **Elevated Dark:** `#2B3139` (`--color-binance-elevated-dark`)
- **Dark Hairline Divider:** `#2B3139` (`--color-binance-hairline-dark`)
- **Dark Body Text:** `#EAECEF` (`--color-binance-body`)
- **Muted Text:** `#707A8A` (`--color-binance-muted`)
- **Trading Up (Price Drop / Savings):** `#0ECB81` (`--color-trading-up`)
- **Trading Down (Price Increase / Risk):** `#F6465D` (`--color-trading-down`)
- **Canvas Light:** `#FFFFFF` (`--color-binance-canvas-light`)
- **Light Surface Strong:** `#F5F5F5` (`--color-binance-strong-light`)
- **Ink Text (Light):** `#181A20` (`--color-binance-ink`)

### Typography
- **Font Stack:** Inter, system-ui, -apple-system, sans-serif
- **Numbers:** Always use `.tabular-nums` for prices, dates, times, and percentages.
- **Weights:** 400 (Body), 500 (Medium/Labels), 600 (Semibold/Headers), 700 (Bold/Numbers/Display).

---

## 3. Component Implementation Rules

### Primary CTA Button
- Height: 40px (`h-10`)
- Padding: `px-6 py-2.5`
- Radius: `rounded-md` (6px) or `rounded-full` (for pill variants)
- Background: `#FCD535`
- Text: `#181A20` (Bold/Semibold)
- Hover: `#F0B90B`
- Disabled: `#3A3A1F` background, `#707A8A` text.

### Markets & Deals Table Card
- Card Container: `bg-[#1E2329] border border-[#2B3139] rounded-xl p-6`
- Table Header: Text `#707A8A` text-xs font-medium uppercase tracking-wider
- Table Row: Border bottom `border-[#2B3139]/50`, hover `hover:bg-[#2B3139]/30`
- Route: Route title in `#EAECEF` font-semibold, IATA codes in `#707A8A`
- Price: Large bold price in `#EAECEF`, tabular-nums
- Trend Pill: Green badge `#0ECB81`/15 text `#0ECB81` for price drop; Red badge `#F6465D`/15 text `#F6465D` for surge.

### Trust & "SAFU" Band
- Display badge: `bg-[#1E2329] border border-[#2B3139] rounded-lg px-4 py-3 text-xs text-[#EAECEF]`
- Highlight bullet: Verified provider, zero hidden booking markups, explicit separate-ticket warning.

---

## 4. Verification Check

Before merging any UI change based on this design system:
1. Run `npm run check` (typecheck, lint, vitest, build).
2. Check color contrast (ensure body `#EAECEF` and yellow button on dark text `#181A20` have high contrast).
3. Ensure no unauthorized API keys or fake flight data are rendered.
