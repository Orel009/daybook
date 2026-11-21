# Daybook

A personal habit tracker and scrapbook journal. Installable web app (PWA), tablet-first, works offline, stores everything on the device.

## Run it

```bash
npm install
npm run dev        # local development
npm test           # streak and schedule rules
npm run build      # production build in dist/
```

## Put it on the tablet

The repo includes `.github/workflows/deploy.yml`, which builds the app and publishes it to **GitHub Pages** (free) on every push to `main`.

1. Push the repo to GitHub (public repo; Pages is free for public repos).
2. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Wait for the "Deploy to GitHub Pages" run under **Actions** to turn green. The site is at `https://<username>.github.io/daybook/`.
4. On the Android tablet, open that address in Chrome, then menu → **Add to Home screen** → **Install**. It then opens full-screen and works offline.

Prefer a private repo? Vercel, Netlify and Cloudflare Pages host private repos for free: import the repo, build command `npm run build`, output folder `dist`. No other settings are needed (the build uses relative paths and hash routes).

Data lives in that browser's storage on the tablet. Use **Settings → Save a backup** now and then; the file restores everything, photos included, on any device.

## How it is put together

```
src/
  domain/          pure logic, no React
    types.ts       TrackerDefinition, TrackerEntry, Schedule, Settings
    dates.ts       local calendar-day helpers
    stats.ts       day summaries, streaks, schedule rules (tested)
  data/
    db.ts          IndexedDB layer
    store.ts       in-memory state + write-through persistence, backup
    assets.ts      photo compression and storage
    defaults.ts    categories, presets, dashboard defaults
  visualizations/
    registry.ts    registerVisualization / getVisualization
    CalendarViz.tsx, PixelViz.tsx, GardenViz.tsx, ProgressViz.tsx
    pages.ts       Page and PageElement types, element factories
  ui/              shared components (sheet, inputs, layout, PageCanvas)
  screens/         Home, Trackers, TrackerDetail, TrackerForm, Journal, PageScreen, Settings
  styles.css       themes are CSS variables at the top of the file
```

Key rules:

- **Definitions, entries and looks are separate.** A tracker stores a `visualizationId`; entries never reference it. Switching looks cannot touch history.
- **One source of truth for numbers.** Every widget and visualization reads `DaySummary` and `streaks()` from `domain/stats.ts`.
- **Streak rule.** A missed scheduled day resets the streak to zero. Rest days never break it. Today doesn't count as missed until it is over.
- **Garden rule.** The plant grows with the current streak and starts from a seed after a miss. Plants that reached full size are derived from past streak runs (`streakRuns()`), so they stay on the shelf and nothing extra is stored.
- **Per-look settings.** `visualizationConfig` is keyed by look id, so switching looks and back keeps each look's settings.
- **Value colours.** "Pick one" and rating trackers store a colour per answer (`valueColors`); Pixels and Calendar draw each day in that colour (`domain/colors.ts`).
- **Pages.** A page is a fixed-size sheet in page units (900×1200 or 1200×900) that is scaled to the screen, so a layout looks the same on every device. Elements store position, size, rotation and their own content; order in the array is the layer order. Tracker elements hold only a `trackerId` and always draw live data.
- **Book.** `screens/Book.tsx` binds every journal page, in `sortOrder`, between two covers: a two-page spread on wide screens, one page on narrow ones, with a rotating-leaf page turn. It is read-only; "Open" goes to the page.
- **Stickers.** Three kinds share one element type: emoji, built-in drawn stickers (`src/stickers/drawn.tsx`, recolourable vector drawings), and the user's own pictures ("My stickers", kept in `settings.customStickers` and stored as photos).
- **Photos.** Compressed to at most 1600px, stored once in their own IndexedDB store and referenced by id. Backups include them. Photos no page uses are removed on start-up.
- **Sync-ready records.** Every record has a UUID and `updatedAt`; deleted entries are kept as tombstones (`deletedAt`).

## Adding a visualization

Create a component that takes `VisualizationProps`, call `registerVisualization({...})` in the same file, and import that file in `visualizations/index.ts`. A look picker appears on the tracker page as soon as more than one look supports the tracker's value type.

## Roadmap

- [x] Phase 1: foundation, trackers, logging, history, dashboard, themes, backup
- [x] Phase 2: pixel, growing garden and progress looks; per-look settings; tracker widgets on Home
- [x] Phase 3: scrapbook page editor (text, photos, stickers, tape, live trackers; move, resize, rotate, layers, undo; paper colour, pattern and picture; duplicate pages; save and use templates)
- [x] Phase 4: fillable page parts (checklist, table, writing area, month, box) and 46 ready-made templates in 12 subjects (`src/templates/builtin.ts`), including a bookshelf part
- [ ] Phase 5: insights, more themes, sharing, optional sync
