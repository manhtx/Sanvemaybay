# FlyCheap Design System: Suno-inspired visual direction

**Status:** Approved visual direction for future UI work  
**Scope:** Web application surfaces, responsive states, and UI copy  
**Reference:** User-provided Suno/Mobbin screenshots, analyzed as visual inspiration

## Executive summary

The reference uses a dark media workspace: persistent navigation, quiet charcoal surfaces, large image-led content, restrained borders, rounded controls, expressive gradients, and a persistent player/task bar. The visual system creates contrast between a calm shell and vivid content. FlyCheap should adopt that relationship for flight opportunities, destinations, price movement, and evidence while preserving its own travel/data identity.

The key rule is **quiet structure, expressive opportunity, explicit proof**.

## What to carry over

- Dark-first canvas with layered surfaces rather than white cards.
- Left desktop navigation with a strong active state and low-noise inactive states.
- Editorial hero areas with one high-value action.
- Horizontal discovery rails for destinations, deal themes, and travel moods.
- Image-led cards with consistent geometry and compact metadata.
- Warm multi-color gradient for the main action or a promotion surface.
- Low-contrast outlines, restrained shadows, and rounded controls.
- Persistent global utility bar only when it supports an ongoing task.
- Dense information revealed progressively through detail views, drawers, and panels.

## What to adapt for FlyCheap

| Reference pattern | FlyCheap application | Trust constraint |
| --- | --- | --- |
| Song hero/create box | Search or “find an opportunity” hero | Do not imply a result until a provider/source returns one |
| Genre/mood rails | Destination, budget, trip style, or route rails | Labels must come from real taxonomy or be clearly editorial |
| Song metadata | Fare, dates, stops, baggage, source, freshness | Show assumptions next to the price |
| Version/status badge | Live, estimated, historical, unavailable, verified | State label must match backend provenance |
| Player/task bar | Alert status, saved search, or active comparison | Never obscure deal content; support dismissal on mobile |
| Social proof counts | Price history, confidence, source count | Never turn model confidence into popularity proof |

## Page composition standard

1. **Shell:** navigation + content canvas; use a subtle divider, not a heavy frame.
2. **Context:** page title and one sentence explaining the user's current decision.
3. **Primary action:** search, inspect a deal, or create an alert. Only one dominant CTA.
4. **Discovery:** one to three rails/cards with clear section titles and progressive disclosure.
5. **Proof:** source, freshness, price history, total cost, or risk panel near the claim.
6. **Utility:** persistent alert/player/comparison bar only when state exists.

Avoid placing more than two major hero cards before the user sees actionable results. Avoid turning every page into a dashboard of equal-sized widgets.

## Visual QA acceptance

- The first viewport has one obvious action and one obvious content hierarchy.
- At 1280px+, navigation, content, and any persistent utility bar do not overlap.
- At 320px, cards reflow or scroll intentionally; no clipped CTA or unbounded table.
- Text on dark surfaces passes AA contrast; muted text remains readable.
- Every live-looking price has source and timestamp in the same interaction context.
- Loading, stale, unavailable, and error states are visibly distinct.
- Focus, keyboard navigation, reduced motion, and screen-reader names are verified.

Global accessibility defaults are enforced in `src/styles/theme.css`: visible pink focus rings, pointer/touch affordances, disabled states, image sizing, and a reduced-motion fallback. Page-level controls still need semantic labels and state announcements.

## Source of truth

- Reusable AI/code-generation rules: [`guidelines/Guidelines.md`](../guidelines/Guidelines.md)
- Product data/truthfulness principles: [`docs/PRODUCT_OVERVIEW.md`](./PRODUCT_OVERVIEW.md)
- Existing semantic tokens: [`src/styles/theme.css`](../src/styles/theme.css)

Any future UI proposal should reference this document and record deliberate deviations before implementation.
