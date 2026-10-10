---
name: Obsidian Mint Finance
colors:
  surface: '#0e150e'
  surface-dim: '#0e150e'
  surface-bright: '#333b32'
  surface-container-lowest: '#091009'
  surface-container-low: '#161d15'
  surface-container: '#1a2119'
  surface-container-high: '#242c23'
  surface-container-highest: '#2f372e'
  on-surface: '#dde5d8'
  on-surface-variant: '#becab9'
  inverse-surface: '#dde5d8'
  inverse-on-surface: '#2b322a'
  outline: '#889485'
  outline-variant: '#3f4a3d'
  surface-tint: '#70dd7c'
  primary: '#99ff9f'
  on-primary: '#003910'
  primary-container: '#76e381'
  on-primary-container: '#006422'
  inverse-primary: '#006e26'
  secondary: '#b3ceb1'
  on-secondary: '#1f3521'
  secondary-container: '#374f39'
  on-secondary-container: '#a5bfa4'
  tertiary: '#b6f9b6'
  on-tertiary: '#003911'
  tertiary-container: '#9adc9c'
  on-tertiary-container: '#25622f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#8cfa95'
  primary-fixed-dim: '#70dd7c'
  on-primary-fixed: '#002106'
  on-primary-fixed-variant: '#00531b'
  secondary-fixed: '#cfeacc'
  secondary-fixed-dim: '#b3ceb1'
  on-secondary-fixed: '#0a200e'
  on-secondary-fixed-variant: '#354c37'
  tertiary-fixed: '#b0f3b1'
  tertiary-fixed-dim: '#95d696'
  on-tertiary-fixed: '#002107'
  on-tertiary-fixed-variant: '#125221'
  background: '#0e150e'
  on-background: '#dde5d8'
  surface-variant: '#2f372e'
  surface-base: '#050B05'
  surface-card: '#0E1B0F'
  surface-elevated: '#142A17'
  border-subtle: '#1D381F'
  border-selected: '#76E381'
  accent-mint-light: '#89E692'
  accent-mint-muted: '#55A65D'
  text-primary: '#FFFFFF'
  text-secondary: '#A4B8A6'
  text-muted: '#7F9781'
  text-disabled: '#526653'
  status-warning: '#F5C51B'
  status-expense: '#FF4B4B'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 26px
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-numeric:
    fontFamily: JetBrains Mono
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-code:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-caps:
    fontFamily: Manrope
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies a modern, dark neumorphic aesthetic engineered specifically for high-trust multi-currency asset tracking. It pairs an ultra-deep obsidian green void with soft, molded surface elevations and radiant neon mint focal points.

### Personality & Demographics
- **Precision & Authority:** Unyielding financial accuracy, strict non-overdraft logic, and permanent immutable ledgers translated into structured, weighted cards.
- **Sleek Tactility:** Softly extruded dark-green containers simulate custom hardware or high-end trading terminals rather than flat web apps.
- **Controlled Radiance:** Neon mint green accents highlight growth, current active routes, and balance liquidity against dark green atmospheric depth.
- **Audience:** Global digital nomads, cross-border multi-currency holders (USD, EUR, GBP, TRY), and tech-literate professionals who value high-contrast legibility and dark-mode elegance.

## Colors

The palette establishes an ultra-deep, high-contrast dark theme calibrated for prolonged exposure without eye strain.

- **Base Void (`#050B05`):** The primary canvas background; an almost-black canvas infused with deep chloric green.
- **Molded Containers (`#0E1B0F`, `#142A17`):** Recessed and elevated cards structured to emerge from the background through neumorphic dual shadows and faint perimeter borders (`#1D381F`).
- **Luminescent Mint (`#76E381`):** Serves as the primary functional accent for active navigation badges, floating action triggers, selected borders, and positive balances.
- **Semantic Status Signals:**
  - `status-expense` (`#FF4B4B`): Dedicated exclusively to cash withdrawals, negative financial values, and canceled tasks.
  - `status-warning` (`#F5C51B`): Applied strictly to pending tasks and cautionary thresholds.
  - `status-realised` (`#76E381`): Marks settled transactions and completed reminders.
- **Text Layers:** Crisp pure white (`#FFFFFF`) commands headline and monetary numeric hierarchy, while soft sage green (`#A4B8A6`) and moss muted green (`#7F9781`) balance auxiliary labels and ISO currency indicators.

## Typography

The typographic hierarchy bridges technological fintech rigor with rapid numeric scanability.

- **Display & Section Titles (Space Grotesk):** Provides structured geometric angles and distinct terminals. Used for page headings, modal titles, and greeting hero lines.
- **Interface & Narrative Body (Manrope):** Offers clean humanist geometric curves, wide apertures, and balanced reading density for transaction reasons, form inputs, and system notifications.
- **Financial Monospace (JetBrains Mono):** Critical for currency amounts, balances across USD/EUR/GBP/TRY, UUID identifiers, and timestamps. It guarantees tabular alignment without shifting widths across live-updating figures.

## Layout & Spacing

The layout is built around a hybrid fixed-sidebar and fluid-panel grid on desktop, transitioning into an edge-safe stacked view for mobile execution.

### Desktop Architecture
- **Navigation Anchor:** Fixed-width side navigation rail (240px to 280px) on the left containing brand iconography and navigation pills.
- **Data Worksurface:** Fluid multi-column main viewport (12 columns, 24px gutters, 32px safe margins) housing currency balance summaries, transaction ledgers, and context drawers.
- **Floating Controls:** Persistent FAB anchored to the bottom right with a 32px offset from both canvas edges.

### Mobile & Responsive Behavior
- **Breakpoints:** Mobile (`< 768px`), Tablet (`768px - 1024px`), Desktop (`> 1024px`).
- **Reflow:** On mobile screens, the left sidebar transforms into a bottom neumorphic dock or off-canvas drawer. Currency cards reflow from a 4-column horizontal spread to a horizontal swipe reel or a 2x2 grid. Outer margins compress from 32px to 16px.

## Elevation & Depth

Visual hierarchy uses dark neumorphism reinforced with soft-ambient mint backlighting and glassmorphic modal layers.

### Neumorphic Elevation Levels
- **Base Canvas (`Level 0`):** `#050B05` background.
- **Extruded Cards (`Level 1`):** Background `#0E1B0F` framed with a subtle 1px border of `#1D381F`. The illusion of soft lift is achieved through dual ambient shadows:
  - Drop shadow: `0 12px 28px -6px rgba(0, 0, 0, 0.75)`
  - Subtle top-left rim highlight: `inset 0 1px 1px 0 rgba(118, 227, 129, 0.08)`
- **Interactive Depressed States (`Level -1` / Inset):** Form input fields, date pickers, and clicked pills switch from raised to inset neumorphic depths:
  - `box-shadow: inset 0 3px 6px 0 rgba(0, 0, 0, 0.8), inset 0 -1px 2px 0 rgba(29, 56, 31, 0.4)`
- **Luminescent Accent Active Elevation (`Level 2`):** Primary buttons, active sidebar items, and action toggles produce a mint neon atmospheric halo:
  - `box-shadow: 0 0 24px 2px rgba(118, 227, 129, 0.35), 0 4px 12px 0 rgba(0, 0, 0, 0.5)`
- **Glassmorphic Overlays (`Level 3`):** Action modals (Add Budget, Withdraw, Reminders) leverage a translucent surface (`rgba(14, 27, 15, 0.82)`) paired with `backdrop-filter: blur(20px)` and an outer perimeter border of `rgba(118, 227, 129, 0.25)`.

## Shapes

The design system uses a pill-shaped roundedness model (`level 3`), producing organic, pebble-like surfaces that enhance the tactile neumorphic feel.

- **Primary Action Buttons & Status Badges:** Fully rounded capsule pills (`border-radius: 9999px`).
- **Surface Cards & Input Shells:** Generously curved containers using `rounded-xl` (24px to 32px), creating smooth, molded silhouettes.
- **Floating Triggers (FAB):** Circular geometry (diameter 56px to 64px) with full 50% border radius and glowing ambient rims.
- **Modals & Dialogs:** Smooth 28px outer radius creating a natural transition between blurred backdrops and elevated dialog panels.

## Components

### Buttons & Navigation Pills
- **Active Navigation Pill:** Background in radiant neon mint (`#76E381`) with rich dark text (`#050B05`), pill rounded (`9999px`), enhanced by a neon aura (`box-shadow: 0 0 20px rgba(118, 227, 129, 0.4)`).
- **Inactive Navigation Pill:** Transparent background with sage green text (`#A4B8A6`) and low-opacity icons. Hover produces an extruded `#0E1B0F` card contour.
- **Primary Modal Action:** Full-width or inline pill filled with `#76E381`, bold weight, dark label (`#050B05`), depressed on active click.
- **Floating Action Button (FAB):** Fixed circular button holding an icon (plus or cross). Tinted in mint with ambient mint drop blur.

### Cards & Ledger Rows
- **Currency Stat Cards:** Rounded 24px cards featuring currency symbol badges (`$`, `€`, `£`, `TL`), secondary currency title, and JetBrains Mono balance display. Top border features a faint gradient highlight.
- **Transaction History Rows:** Elongated horizontal pill-cards (`#0E1B0F`) with subtle borders (`#1D381F`). The left side contains transaction description and localized date; the right features monetary values formatted in JetBrains Mono. Positive entries are highlighted in `#76E381`, deductions in `#FF4B4B`.

### Status Chips & Badges
- **Capsule Pill Formation:** Height 28px, inner padding `4px 14px`, `border-radius: 9999px`.
- **En Attente (Pending):** Dark gold tinted background (`rgba(245, 197, 27, 0.15)`) with crisp yellow text (`#F5C51B`) and a yellow ambient glow (`box-shadow: 0 0 12px rgba(245, 197, 27, 0.3)`).
- **Réalisé (Realised):** Dark mint tinted background (`rgba(118, 227, 129, 0.15)`) with neon mint text (`#76E381`) and mint glow.
- **Annulé (Canceled):** Dark crimson background (`rgba(255, 75, 75, 0.15)`) with red text (`#FF4B4B`) and red glow.

### Form Inputs & Dropdowns
- **Input Shell:** Inset neumorphic fields using background `#09130A`, 1px border `#1D381F`, rounded 14px to 18px.
- **Text & Placeholder:** Values render in `#FFFFFF` (or monospace for numeric amounts). Placeholder text uses `#7F9781`.
- **Focus State:** 1.5px continuous glow border in `#76E381` with inner shadow depth.
- **Currency Dropdown:** Inset selector revealing a frosted glass panel populated with multi-currency options (USD, EUR, GBP, TRY).

### Glassmorphic Action Modals
- **Backdrop:** Screen-filling backdrop scrim tinted with `#050B05` at 65% opacity and 16px blur.
- **Dialog Surface:** Floating centered modal card (`rgba(14, 27, 15, 0.88)`), framed by a dual highlight border (`1px solid rgba(118, 227, 129, 0.2)`), featuring smooth 28px corners, containing Space Grotesk section titles and action buttons.