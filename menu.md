Here’s a focused plan to build a mobile-first “Swiggy/Zomato–style” QR menu that is directly powered by your existing dishes/categories (multi-category duplication supported).

## What to build (mobile-first UX)
- **Home (QR menu landing)**: Hero with restaurant name, status (open/closed), delivery/pickup toggle (optional), search bar.
- **Sticky top controls**: Tiny filter chips (Veg/Vegan/Allergens) + sort (Price, Popularity, Prep time).
- **Category sections**: “Bestsellers”, “Pizza”, “Burgers”, etc. If a dish belongs to 2 categories, it appears in both sections.
- **Floating category navigator**: Circular FAB bottom-right → opens a sheet/grid of category pills; tap to scroll/jump to section.
- **Dish cards**: Image, name, short desc, price/variants, badges (veg/non-veg, bestseller, spicy), “Add” CTA.
- **Cart mini-bar (optional v2)**: Sticky bottom bar showing items count + total; tap → cart drawer.
- **Allergens & dietary tags**: Chips on cards and filter options.
- **Offline-friendly skeletons**: Shimmer placeholders while loading.

## Data/API reuse (already available)
- Categories: `GET /api/categories` (now working)
- Dishes: `GET /api/dishes` (now working, supports category filter)
- Dish schema already has: variants, toppings, allergens, dietary_tags, is_bestseller, is_available.

## Implementation steps (sequence)
1) **Create QR menu app route** (Next.js):
   - New route: `/qr/[tenant]/menu` (SSR or ISR) to be accessed via QR code.
   - Fetch categories + dishes on the server (SSR) for first paint; fallback to client fetch for interactivity.
2) **Layout & theming (mobile-first)**:
   - Use CSS grid/list with responsive breakpoints (1-col mobile, 2-col tablet).
   - Sticky top bar with search + filter/sort.
3) **Category sections**:
   - Build an in-page index (map of categoryId → section ref).
   - Render dishes under each category; duplicate card per category membership (from `category_ids`).
4) **Floating category navigator (FAB)**:
   - Bottom-right circular button; opens a bottom sheet with category chips.
   - On chip click: smooth-scroll to that category section.
5) **Filters & sort**:
   - Filters: veg-only, vegan, allergen exclusion (milk/peanut/gluten), availability.
   - Sort: price low→high, price high→low, popularity (bestseller first), prep time.
   - Apply filters client-side on fetched dishes.
6) **Badges and variants**:
   - Show badges: Veg/Non-veg, Bestseller, New, Spicy (if tagged), Contains allergens list.
   - If variants exist: show dropdown or pills for price; default to base_price if no variants.
7) **Cart mini-bar (Phase 2)**:
   - Keep a simple client-side cart state; sticky bar with count + total; drawer for line items.
8) **Performance & polish**:
   - Image optimization via Next/Image with proper sizes.
   - Skeleton loaders for cards and category sections.
   - Debounced search; memoized filter/sort.

## Swiggy/Zomato feature analysis → adaptation
- **Category quick-jump FAB**: Mirrors Swiggy’s cuisine scroller; we’ll use bottom-sheet + smooth-scroll.
- **Bestsellers first**: A “Bestsellers” category section populated by `is_bestseller=true`.
- **Dietary filters**: Veg/Vegan toggle always visible.
- **Sort bar**: Price and popularity sorts.
- **Badges on cards**: Veg/Non-veg dot, Bestseller, New.
- **Sticky CTA**: Cart mini-bar (later).
- **Reviews/ratings**: (Optional later) mock stars or real ratings if added.
- **Prep time & availability**: Show minutes, grey-out unavailable items.

## Minimal file touchpoints (proposed)
- Frontend:
  - Add new route: page.tsx
  - Shared UI components: category FAB, bottom sheet, filter chips, dish card.
  - Styles: leverage existing Tailwind (if present) or minimal CSS modules.
- Backend:
  - No backend change needed; reuse `/api/categories` and `/api/dishes`.
  - (Optional) Add `GET /api/dishes?bestseller=true` shortcut; otherwise filter client-side.

## Data shaping for rendering
- Fetch all dishes + categories once.
- Build a map: `categoryId -> dishes[]` where each dish may appear in multiple arrays (duplicate card per category).
- Create a synthetic “Bestsellers” category from `is_bestseller`.
- Filters/sorts run on the client over the fetched dataset.

## Visual layout sketch (mobile)
- Top bar: Search input + filter/sort icon buttons.
- Small chip row: Veg | Vegan | No Milk | No Gluten | Sort.
- Category sections stacked; each section title sticky while scrolling (optional).
- Card: 16:9 image, name, price/variant, badges row, short desc, Add button.
- FAB bottom-right: category selector; bottom-sheet list of categories.

## Next actions (pick one to start)
1) Scaffold `/qr/[tenant]/menu` page with SSR fetch of categories+dishes.
2) Build dish card + badges + variant selector.
3) Add filter/sort chips and apply client-side.
4) Add FAB + bottom-sheet category navigator with smooth scroll.
5) (Optional) Add cart mini-bar drawer.

Tell me which step to start with, and I’ll implement it.