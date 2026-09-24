# FlyCheap UI Guidelines — Suno-inspired

These guidelines define the default visual language for FlyCheap. They are inspired by the supplied Suno screenshots: dark-first, media-rich, spacious, expressive, and focused on one clear primary action. They are not a pixel-for-pixel copy of Suno and must not reuse Suno's logo, copy, illustrations, or proprietary assets.

## Product character

- Make the interface feel like a calm command center for discovering travel opportunities.
- Prefer visual confidence and hierarchy over dense dashboards.
- Use expressive color for opportunities, destinations, trends, and calls to action; keep the surrounding chrome quiet.
- Every important number must retain FlyCheap's truthfulness rules: show source, freshness, currency, and whether data is live, historical, estimated, or unavailable.
- Every screen has one dominant user intent. The primary action must be visually obvious without making every control loud.

## Design tokens

Use existing CSS variables where available. New UI should use semantic tokens, not page-specific hex values.

### Color

- Canvas: near-black `#0d0d0f`; elevated surface `#171719`; raised surface `#202023`.
- Text: primary warm white `#f5f3ef`; secondary `#a6a3aa`; muted `#6f6c74`.
- Divider: white at 8–12% opacity. Avoid bright borders on every element.
- Brand gradient: warm orange → pink → violet. Use it for the primary CTA, selected state, or a small promotional surface; never as a full-page background.
- Positive: emerald/green for verified savings or a healthy live signal.
- Warning: amber for uncertainty, transfer risk, hidden cost, or stale data.
- Danger: red for booking failure, unavailable fare, or destructive action.
- Information: cyan/blue for source, route, or explanatory metadata.
- Colored text and badges must never be the only status signal; pair with an icon, label, or shape.

### Typography

- Use a clean sans-serif for product UI. Use a restrained editorial serif only for an occasional hero statement or destination feature, never for dense data.
- Page title: 32–48px, weight 600–700, tight line-height.
- Section title: 20–24px, weight 600–700.
- Card title: 15–18px, weight 600.
- Body: 14–16px; metadata: 12–13px.
- Use sentence case. Do not use all caps except compact status labels, and keep them short.
- Use tabular numerals for prices, dates, scores, and counts.
- Keep line length around 55–75 characters for explanatory copy.

### Shape and depth

- Default radius: 16px for cards and panels, 12px for controls, full-round for pills and icon buttons.
- Use one radius family per composition; do not mix sharp cards with many oversized rounded controls.
- Prefer low-contrast surfaces over heavy shadows. Use glow only to identify the current focus or a primary action.
- Glass treatment is reserved for overlays and media surfaces: translucent fill, 1px white border at low opacity, and backdrop blur. Do not make every card glass.

### Spacing and layout

- Use a 4px base spacing scale; common gaps are 8, 12, 16, 24, 32, and 48px.
- Keep a persistent left navigation only on desktop. Target width: 240–256px; separate it from content with a subtle divider.
- Desktop content uses a generous max-width and 24–32px gutters. Let media cards breathe.
- Use horizontal rails for discovery collections: cards should be visually scannable, with a clear `Xem tất cả`/`See all` affordance.
- Use CSS grid/flexbox for layout. Avoid absolute positioning for core content.
- Reserve a persistent bottom player/action bar only when playback or a global task genuinely exists; it must not cover content and must respect safe areas.

## Component rules

### Navigation

- Show product identity, account context, primary destinations, and one upgrade/benefit area.
- Active navigation uses bright text plus a restrained indicator; inactive items are quiet but readable.
- Use icons consistently (one icon family, 20–22px). Always provide an accessible label.
- On mobile, collapse to a drawer or bottom navigation; do not shrink desktop navigation until labels become illegible.

### Buttons

- One primary button per meaningful region. Use a warm gradient only for the main conversion/action.
- Secondary buttons use an elevated dark surface or quiet outline.
- Tertiary actions are text or icon buttons with clear hover/focus states.
- Button labels are verbs: `Xem deal`, `Theo dõi giá`, `Mở nguồn`, `Lưu deal`.
- Minimum hit area is 44×44px. Icon-only buttons require a tooltip or accessible name.
- Destructive or irreversible actions require explicit confirmation.

### Search and filters

- Search is a rounded, low-contrast field with a visible search icon and a useful placeholder.
- Put filters and sorting in a compact control row; show active filter count.
- Use chips for a small set of active criteria, not as decoration. Chips must be removable when they represent state.
- Preserve filter state when the user navigates back from a detail page.

### Cards and discovery rails

- Image-first cards use a consistent aspect ratio, `object-fit: cover`, and a readable gradient overlay when text sits on media.
- Card anatomy: visual → title → supporting context → compact proof/metadata → one action.
- Use badges sparingly for live state, verified status, savings, or model/source labels.
- A rail needs a clear section title, optional supporting sentence, and a `See all` action.
- Empty, loading, and unavailable states must preserve the same layout rhythm; never silently show fabricated placeholder deals.

### Deal card and price presentation

- Show route and dates before secondary attributes.
- Make the total payable price the dominant numeric element; show currency and passenger/baggage assumptions nearby.
- Pair every price with `Cập nhật lúc`, source/provider, and a state label such as `Đang có dữ liệu`, `Đã cũ`, `Lịch sử`, or `Chưa xác minh`.
- Savings badges require a comparison baseline and period. Do not call a historical row a live deal.
- The primary CTA must open a valid source/booking URL or clearly state why booking is unavailable.

### AI insight and trust panels

- AI explanations sit beside evidence, not instead of evidence.
- Use a compact panel with: conclusion, confidence, evidence links, data freshness, assumptions, and risks.
- Separate observed facts, model estimates, and recommendations through labels and visual grouping.
- Use amber warning styling for uncertainty; never use a celebratory gradient for low-confidence output.

### Charts

- Prefer one clear story per chart. Highlight the selected period and current value.
- Use color plus labels/markers for meaningful events; do not rely on a rainbow palette.
- Include units, currency, time zone/period, source, and missing-data treatment.
- Tooltips must be keyboard reachable or have an accessible tabular alternative.

### Loading, errors, and empty states

- Use skeletons that match the final geometry. Do not show a spinner as the only feedback for a long operation.
- Errors explain what happened, whether data may be stale, and the next safe action.
- Empty states are instructional and honest: explain why there is no result and offer one relevant next action.
- Never use fake prices, fake provider logos, or fake availability to make a page look populated.

## Interaction and accessibility

- Keyboard focus is visible against the dark canvas; never remove the focus ring without a replacement.
- Maintain WCAG AA contrast for text and controls. Test muted text on every surface.
- Respect `prefers-reduced-motion`; gradients and glows must not be required to understand state.
- Hover is enhancement, not the only way to reveal an action.
- Dialogs, drawers, menus, and players must trap/restore focus correctly.
- Use semantic headings in visual order and announce async results to assistive technology.
- Responsive acceptance targets: 320px mobile, 768px tablet, 1280px desktop, and wide desktop.

## Content and localization

- Vietnamese is the default product language unless a screen explicitly supports a locale switch.
- Keep labels short and action-oriented. Avoid unexplained AI or aviation jargon.
- Localize currency, dates, time zones, pluralization, and number separators; never concatenate translated fragments in code.
- Preserve source/provider names exactly, but explain their role in Vietnamese.

## Review checklist

Before approving a UI, verify:

1. Is the primary intent obvious in three seconds?
2. Does the visual hierarchy use quiet chrome and expressive content?
3. Are all prices and availability states truthful and fresh enough for the claim?
4. Does every important action have a clear hover, focus, loading, success, and error state?
5. Does the composition work at 320px without horizontal overflow?
6. Are contrast, keyboard access, labels, and reduced motion covered?
7. Does the screen reuse existing components and tokens instead of inventing a new pattern?

## Explicit anti-patterns

- Do not copy Suno branding, logo, copy, page names, or proprietary artwork.
- Do not use neon gradients, glass panels, pills, or oversized rounded corners everywhere.
- Do not make every card equal visual weight; hierarchy is part of the design.
- Do not hide source, freshness, assumptions, or risk behind an AI-generated summary.
- Do not claim `live`, `available`, `cheapest`, or `book now` without current source-backed evidence.
