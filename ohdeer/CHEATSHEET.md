# ohdeer cheat sheet

Where to change things yourself. All paths are inside the `ohdeer/` folder.
Run `npm run dev` while you edit, and changes show up in the browser as soon as you save.

## 🎨 Colors
**File: [src/styles/tokens.css](src/styles/tokens.css)**

| To change… | Edit |
|---|---|
| Page background | `--c-moss` (currently `#56703F`) |
| Cream cards | `--c-cream` (and `--paper-white` for the inner cards and inputs) |
| Main text and outlines | `--c-forest` |
| Accent (today, delete, current month) | `--c-rust` |
| Type colors | `--c-moss`, `--c-olive`, `--c-forest`, `--c-sage`, `--c-bark`, `--c-fawn`, `--c-teal`, `--c-rust` |

- To **add a new type color**, add a token in `tokens.css`, then add a line to [src/lib/palette.ts](src/lib/palette.ts).
- ⚠️ If you change the **background green**, also update `#56703F` in three other places, so the phone's status bar and app icon match:
  - `theme-color` in `index.html`
  - [public/manifest.webmanifest](public/manifest.webmanifest)
  - the app icon (see App icon below)

## 🔤 Fonts
- The fonts are loaded in [index.html](index.html) (the Google Fonts `<link>`) and named in `tokens.css`:
  - `--font-display` is Gaegu, for headings, month names and nav buttons.
  - `--font-body` is Nunito, for everything else.
- **To swap one:** pick a font on [fonts.google.com](https://fonts.google.com), replace its name in the `<link>` URL, then update the token.

## ✏️ Hand-drawn texture
| Effect | Where | Setting |
|---|---|---|
| Paper grain over everything | `tokens.css` | `--grain-opacity` (0 = off, 0.3 = heavy) |
| Wobbly borders | `index.html`, the `<filter id="wobble">` | `scale="5"` sets wobble strength; `baseFrequency` sets how bumpy it is |
| Leaf pattern on the background | [src/index.css](src/index.css), `body::before` | `opacity: 0.55` and the size `120px` |
| Lopsided corners | `tokens.css` | `--radius-wobbly`, `--radius-wobbly-soft` |
| Border thickness | `tokens.css` | `--border-width` |

## 🦌 Artwork (swap in your own drawings)
All art is in [src/assets/doodles/](src/assets/doodles/). **To replace any drawing, save your file over the old one with the exact same name.** You don't need to change any code.

| Folder | What it is | Notes |
|---|---|---|
| `icons/` | The 20 type icons | Draw them as **dark lines on a transparent background**, because the app tints them. **A new file automatically appears in the icon picker.** Don't rename files your types already use. |
| `deer/` | The 3 mascot poses | Full color. Used on the login screen and in empty states. |
| `scenes/` | The 12 month scenes | Named `01-january.svg` … `12-december.svg`. Shape is about 800×300. **Keep the animal between x=200 and x=600** so it shows on phones, and keep the top of the sky calm for the month name. PNG or JPG files work too if you update the extension in [src/lib/scenes.ts](src/lib/scenes.ts). |
| `decor/` | `squiggle.svg` (heading underline), `torn-edge.svg`, `leaf-pattern.svg`, and the unused `tiles/` | |

## 📐 Sizes and spacing
**File: [src/index.css](src/index.css)** (sections are labeled with `/* ---------- ... ---------- */` headings)

| To change… | Find | Setting |
|---|---|---|
| Months per row in the year view | `.year-grid` | `repeat(2…)`, `repeat(3…)`, `repeat(4…)` and the widths (`600px`, `860px`) where they switch |
| Scene strip on each month block | `.mini-scene` | `height: 52px`; `object-position` (lower % shows more sky) |
| Height of the month-view scene | `.scene` | `clamp(210px, 32vw, 520px)` = minimum, preferred, maximum |
| Day boxes in the month view | `.month-day` | `min-height` and `padding` (phone and laptop versions) |
| Scene strip on the day card | `.day-band` | `height: 100px`, `object-position: center 62%` |
| Dots in the year view | `.dot` | `width` and `height` |
| Spacing scale | `tokens.css` | `--space-1` … `--space-6` |

**How many dots or icons show per day:**
- Dots in the year view: `MAX_DOTS = 3` in [src/views/YearView.tsx](src/views/YearView.tsx).
- Icons in the month view: `MAX_ICONS = 3` in [src/views/MonthView.tsx](src/views/MonthView.tsx).

## ✨ Animations
All in `index.css`:
- **Button squish when tapped:** `button:active`, which uses `scale(0.97) rotate(-0.5deg)`.
- **Nav button tilt on hover:** `.top-nav .nav-button:hover`, which uses `rotate(-2deg)`.
- **Month block tilt on hover:** `.mini-month:hover`.
- **Speed:** the `transition: transform 0.12s ease` lines. A bigger number makes it slower.

## 💬 Words
- **Empty-day messages** ("Nothing logged today.", "A quiet day.") are in [src/views/DayView.tsx](src/views/DayView.tsx).
- **The empty types and empty stats messages** are in [src/views/TypesView.tsx](src/views/TypesView.tsx) and [src/views/StatsView.tsx](src/views/StatsView.tsx).

## 📱 App icon
- The source drawings are [public/icons/icon.svg](public/icons/icon.svg) and `icon-maskable.svg`. The maskable one keeps the art smaller for Android's circle crop.
- The phone actually uses the **PNG** files next to them, so after editing the SVG, regenerate the PNGs (or export 512, 192 and 180px versions yourself).

## 🚀 Publishing a change
1. Run `npm run dev` and check it at **phone width** too: press Cmd+Option+I in Chrome, then the phone icon.
2. Commit and push to `main`.
3. Vercel rebuilds automatically within about a minute.
4. The installed iPhone app picks up the change after you close and reopen it.
