# HTML App Generation Spec

Detailed specification for the single-file HTML ordering app. Generate all CSS and JS inline — zero external dependencies.

## Header

- Restaurant name (prominent)
- Tagline/motto if available
- Contact links: phone numbers as `tel:` links, email as `mailto:` link
- IF: address is available → Google Maps link: `https://www.google.com/maps/search/?api=1&query=<encoded-address>`
- Delivery/service notes (e.g., "Delivery: $1.50/km")

## Search and Filters

- Text search input — searches across item names, translations, descriptions, and details
- Filter buttons auto-generated from tags present in the data (only show filters for tags that exist)
- Category navigation — pill/chip buttons to jump to or filter by category
- Item count display ("Showing X of Y items")
- Sort by price toggle (ascending/descending/default)

## Menu Display

- Items grouped by category with clear section headers
- Each item displayed as a card showing: name, English translation (if applicable), price with unit, details/description, tags as small badges, and an "Add" button
- Items in cart are visually highlighted (border color, subtle background change)
- IF: item has variants → show variant info in the card details
- Responsive grid: 2-3 columns on desktop, single column on mobile

## Cart System

- Floating action button (FAB) showing cart icon and item count badge
- Slide-out cart panel with:
  - Items grouped by category
  - Per-item quantity controls (+/-)
  - Per-item note field (for specifying fillings, preferences, spice level)
  - Remove button per item
  - Global order note textarea (for date, event, dietary needs)
  - Running estimated total
  - Disclaimer for weight-based pricing ("final price depends on actual weight")
- Cart persists via `localStorage` (survives page reload)

## Order Actions

- "Copy order" button — generates clean, readable text and copies to clipboard:
  ```
  Order from [Restaurant Name]:
  ---
  [Category]:
    2 x Item Name ($price/unit) = $subtotal
     ^ note if present
  ---
  Estimated total: $XX.XX
  (final price depends on actual weight)
  Note: [global note if present]
  ```
- "Call" button — `tel:` link to primary phone number
- IF: address available → "Navigate" button with Google Maps link
- "Clear all" button with confirmation prompt
- Toast notification on successful copy

## Technical Requirements

- Mobile-first responsive design (works well on phones where it'll mostly be used)
- Smooth transitions for cart open/close, hover states, toast
- Menu data stored as a JS array of objects in a `<script>` block
- All rendering done client-side from the data array
- No external fonts, CDNs, or API calls — fully offline-capable once opened
