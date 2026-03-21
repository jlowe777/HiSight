# Design System — HiSight

## Product Context

- **What this is:** Map-first real estate search with topographic elevation intelligence for the Colorado Front Range
- **Who it's for:** Home buyers who care about views, terrain, and high-ground properties — specifically the Wheat Ridge / Applewood / Golden area
- **Space/industry:** Real estate search, mapping tools
- **Project type:** Full-screen web app, responsive (desktop split-view + mobile bottom sheet)

## Aesthetic Direction

- **Direction:** Brutally Minimal — the map IS the decoration. Every UI element exists to serve the map. Zero chrome for its own sake.
- **Decoration level:** Minimal — typography and whitespace do the work. The terrain heatmap provides all the visual richness.
- **Mood:** Premium outdoor mapping tool wearing real estate clothes. Crisp, grounded, confident. Feels like the land it's showing.

## Typography

- **Display / Prices:** Instrument Serif — warmth, editorial weight, premium feel. Used for property prices, the HiSight logo, and hero text. `$689,000` in Instrument Serif at 28–32px feels substantial, not like a database readout.
- **Body / UI:** Geist — clean, modern, excellent tabular-nums support for prices and sqft figures. Used for all labels, specs, descriptions, and navigation.
- **Data / Elevation:** Geist Mono — precision readouts. Used exclusively for elevation values (`5,820 ft`), prominence scores (`+42 ft`), coordinates, and API/code references.
- **Loading:** Google Fonts CDN
  ```html
  <link
    href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap"
    rel="stylesheet"
  />
  ```
- **Scale:**
  | Role | Font | Size | Weight |
  |---|---|---|---|
  | Logo / hero | Instrument Serif | 22–48px | regular / italic |
  | Property price | Instrument Serif | 28–32px | regular |
  | UI body | Geist | 14–15px | 400 |
  | UI label | Geist | 12px | 500 |
  | UI small | Geist | 11–13px | 400 |
  | Elevation data | Geist Mono | 11–13px | 400–500 |

## Color

- **Approach:** Restrained — one strong accent, neutrals carry the UI weight

### Light Mode

| Token           | Hex       | Usage                                                                  |
| --------------- | --------- | ---------------------------------------------------------------------- |
| `--bg`          | `#FAFAF8` | Page background — warm off-white, earthy                               |
| `--surface`     | `#FFFFFF` | Cards, sidebar, overlays                                               |
| `--surface-2`   | `#F4F4F0` | Input backgrounds, secondary surfaces                                  |
| `--border`      | `#E8E8E4` | Default borders — warm light gray                                      |
| `--border-mid`  | `#D4D4CE` | Hover/focus borders                                                    |
| `--text-hi`     | `#1A1A18` | Primary text — warm near-black                                         |
| `--text-mid`    | `#4A4A46` | Secondary text                                                         |
| `--text-lo`     | `#6B6B67` | Labels, placeholders                                                   |
| `--text-xlo`    | `#9B9B96` | Timestamps, metadata                                                   |
| `--accent`      | `#2D6A4F` | Forest green — primary accent. All CTAs, active states, elevation data |
| `--accent-lit`  | `#52B788` | Hover / active lighter green                                           |
| `--accent-bg`   | `#EBF5EE` | Accent tint backgrounds (chips, badges)                                |
| `--accent-dark` | `#1B4332` | Pressed / dark accent states                                           |

### Dark Mode

| Token         | Hex                         |
| ------------- | --------------------------- |
| `--bg`        | `#111110`                   |
| `--surface`   | `#1C1C1A`                   |
| `--surface-2` | `#252522`                   |
| `--border`    | `#2E2E2A`                   |
| `--text-hi`   | `#F5F5F2`                   |
| `--accent`    | `#52B788` (lighter in dark) |
| `--accent-bg` | `#1B3329`                   |

### Elevation Color Ramp (topographic — natural, not neon)

```
Low (5,200 ft)  #6BAA75  ──→  #A8C970  ──→  #D4A84B  ──→  #8B5E3C  ──→  #4A2C17  Ridge (6,500+ ft)
```

Applied to the Mapbox terrain-rgb DEM layer as a `raster-color` expression. This is the ambient "where should I look" layer visible across the whole map.

### Semantic Colors

|         | Light                    | Dark                     |
| ------- | ------------------------ | ------------------------ |
| Success | `#2D6A4F` / bg `#F0FBF4` | `#86EFAC` / bg `#0F2419` |
| Warning | `#B45309` / bg `#FFFBEB` | `#FCD34D` / bg `#1C1506` |
| Error   | `#B91C1C` / bg `#FEF2F2` | `#FCA5A5` / bg `#1C0606` |

## Spacing

- **Base unit:** 8px
- **Density:** Comfortable — map overlays breathe, list cards are scannable
- **Scale:** `2px · 4px · 8px · 16px · 24px · 32px · 48px · 64px`

## Layout

- **Approach:** Grid-disciplined for overlays, full-bleed for the map

### Desktop (≥1024px)

- Full-viewport map (right side, flex: 1)
- Left rail: 380px fixed, scrollable property list
- Property detail sidebar: 400px, slides in from right over the map
- Floating search bar: top-left of map, max-width 420px
- Elevation slider: bottom-center of map, max-width 360px

### Mobile (<768px)

- Full-screen map
- Bottom sheet: 30% height (single card) → 70% (scrollable list, swipe up) → full (property detail)
- Elevation filter: FAB bottom-right → opens slider sheet
- Search: top floating bar, pill shape

### Border Radius

| Element          | Radius          |
| ---------------- | --------------- |
| Buttons          | `6px`           |
| Inputs           | `8px`           |
| Cards            | `12px`          |
| Sidebar / modals | `16px`          |
| Chips / badges   | `9999px` (pill) |
| Logo mark        | `8px`           |

**Rule:** Never apply the same radius to everything. Buttons are tighter than cards. Pills are only for tags/chips.

## Motion

- **Approach:** Intentional — every animation aids comprehension, nothing decorative
- **Easing:** enter `ease-out` · exit `ease-in` · move `ease-in-out`

| Interaction                 | Duration | Easing                          |
| --------------------------- | -------- | ------------------------------- |
| Sidebar enter               | 250ms    | ease-out                        |
| Sidebar exit                | 200ms    | ease-in                         |
| Property pin appear         | 150ms    | ease-out + 20ms stagger per pin |
| Bottom sheet expand         | 300ms    | ease-out                        |
| Elevation profile draw      | 400ms    | ease-out                        |
| Map camera pitch (on click) | 600ms    | ease-in-out                     |
| Map elevation filter        | instant  | GPU — no JS rerender            |
| Tooltip / hover             | 100ms    | ease-out                        |

## Component Specs

### Property Card (list view)

```
[120px photo]  $689,000                          ← Instrument Serif 22px
               3 bd · 2 ba · 1,840 sqft · 0.31 ac lot  ← Geist 13px text-mid
               123 Lookout Dr, Golden, CO         ← Geist 12px text-lo, truncate
               ● 5,820 ft · +42 ft prominence    8 days  ← Geist Mono 11px accent + text-xlo
```

- Elevation dot color-coded to the ramp (low=green, mid=amber, high=brown)
- Active state: `border-color: accent`, `box-shadow: 0 0 0 2px accent-bg`
- Hover: `box-shadow: shadow-md`, `border-color: border-mid`

### Map Pin

- Pill shape, white background, price label in Geist 13px/600
- Left border 3px colored to elevation band
- Active / hover: filled accent green, white text, `scale(1.05)`

### Elevation Slider (floating)

- White card, `border-radius: 16px`, `shadow-md`
- Dual-thumb range slider, accent-filled track between thumbs
- Header: label left, current range right in Geist Mono

### Property Detail Sidebar

- Photo area: 220px height, frosted-glass badges for photo count + elevation
- Price: Instrument Serif 30px
- Specs: 3-column grid (beds / baths / sqft / lot / year / $/sqft)
- Terrain section: elevation chips + profile chart (Recharts AreaChart)
- Profile chart: Geist Mono axis labels, accent fill gradient, draws on 400ms
- CTAs: "View on Zillow" primary, "Save home" secondary

### Elevation Profile Chart

- Library: Recharts `AreaChart`
- X axis: distance from property in km (0 → 30km heading west)
- Y axis: elevation in meters
- Fill: accent gradient top-to-transparent
- Stroke: `--accent` 1.5px
- Vertical dashed line at x=0 (the clicked property)
- "Rockies" label at right edge
- Entrance animation: path draws left-to-right over 400ms

## Decisions Log

| Date       | Decision                                      | Rationale                                                                                                                                                                   |
| ---------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-03-21 | Forest green `#2D6A4F` accent instead of blue | Every real estate app uses blue for "trust." HiSight's differentiator is the land — green signals terrain, nature, the outdoors. Immediate visual identity in the category. |
| 2026-03-21 | Instrument Serif for prices                   | `$689,000` in a warm serif at 30px feels substantial and premium. Contrast with Geist creates visual hierarchy without additional complexity.                               |
| 2026-03-21 | Warm `#FAFAF8` background                     | Earthier than cold `#FFFFFF`. Belongs to the Colorado outdoors context. Subtle but meaningful.                                                                              |
| 2026-03-21 | Elevation + lot size on every list card       | Elevation is the product's USP. Lot size is critical for Colorado buyers. Both surface before beds/baths in visual hierarchy.                                               |
| 2026-03-21 | Topographic ramp green→amber→brown→ridge      | Natural cartographic palette. Feels like a real topo map, not a neon heatmap.                                                                                               |
| 2026-03-21 | No true viewshed on MVP                       | Ray-casting over 30km terrain mesh is backend-compute. MVP: elevation cross-section chart heading west + local prominence score. True viewshed is V2.                       |
