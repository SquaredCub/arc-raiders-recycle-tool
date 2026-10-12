# Arc Raiders Recycle Tool

React + TypeScript web app helping Arc Raiders players manage, search, and
recycle in-game items.

**Stack:** React 19, TypeScript 5.9, Vite 7, TanStack Table/Virtual, Sass,
GitHub Pages

Machine-local rules (gitignored, may not exist on every machine): @CLAUDE.local.md

## Project Structure

```
src/
├── components/          # UI: Navigation, ProfitableItems, FilterModal, MultiSelectDropdown, etc.
├── contexts/            # DataContext.tsx — provides game data globally via useData() hook
├── hooks/               # useData, useDebounce (200ms), useModalBehavior, useLanguage
├── data/
│   ├── itemsData.ts     # formatMaterialName, getItemImage, getItemImageById, COINS_IMAGE_URL, filterBlacklistedItemCategories
│   └── requirementsData.ts  # getItemRequirements() — aggregates outpost/quest/project needs; expedition helpers
├── services/
│   └── dataService.ts   # Data accessors + getImageUrl (import.meta.env.BASE_URL + path into public/)
├── utils/
│   ├── functions.ts     # capitalizeItemId, filterItemsBySearch, createNoResultsItem
│   ├── sortingFunctions.ts  # compareStrings, sortItems (with name-match prioritization)
│   ├── tableCache.ts    # Pre-computed sort keys, material caches, bench name lookups
│   └── itemsTableColumns.tsx  # TanStack Table column definitions
├── constants/
│   ├── itemCategories.ts  # BLACKLISTED_ITEM_CATEGORIES (Key/Blueprint/Design), AMPLIFIED_WEAPON_ID_PATTERN, FILTERABLE_ITEM_CATEGORIES (derived from generated ITEM_TYPES)
│   ├── sortColumns.ts     # SORT_COLUMNS — column id/label/descFirst, used by table columns + mobile sort dropdown
│   └── filterOptions.ts   # ITEM_RARITIES, FOUND_IN_LOCATIONS, NEEDED_FOR_SOURCE_TYPES (imports from generated JSON)
├── localization/
│   ├── uiStrings.ts        # UIStringKey type + UI_STRINGS record (all 20 languages)
│   └── languageUtils.ts    # LanguageCode, getLocalizedText, detectInitialLanguage
├── generated/           # Compiled game data, COMMITTED (written by `bun run update-data`):
│   ├── items.json, hideout.json, quests.json, projects.json  # arctracker.io API data, unwrapped
│   ├── filterOptions.json  # Extracted rarities + locations
│   ├── imageEtags.json     # CDN ETag per item image, for conditional re-downloads
│   └── types.ts         # Auto-generated TypeScript types + runtime arrays (ITEM_TYPES) from data structure
├── App.tsx, ItemsTable.tsx, Table.tsx (virtualized), RecyclingTools.tsx
public/images/
├── items/<id>.png       # Item images, COMMITTED (downloaded by scripts/fetch-images.js)
└── coins.png            # Coins icon (not in the API; maintained by hand)
```

## Data Flow

- Source: the public [arctracker.io API](https://arctracker.io/developers/docs)
  (`/api/items`, `/quests`, `/hideout`, `/projects`; no key, 500 req/hour).
  No other data source; RaidTheory/arcraiders-data and the old fork are no
  longer used.
- `bun run update-data` runs three scripts:
  1. `scripts/fetch-arctracker.js` saves the raw responses to
     `src/arctracker-data/` (gitignored, never committed)
  2. `scripts/generate-files-from-data.js` unwraps them into
     `src/generated/*.json` (sorted by id), extracts `filterOptions.json`
     and generates `types.ts` from the actual data structure
  3. `scripts/fetch-images.js` downloads images of shown items (and their
     recycle/salvage outputs) to `public/images/items/<id>.png`, using stored
     ETags so unchanged images cost a 304 and no download; prunes the rest
- Output is deterministic (no timestamps): an unchanged API means no git diff.
- `.github/workflows/update-data.yml` runs it daily, commits only on a diff,
  then calls `deploy.yml` (`workflow_call`) itself, because a push made with
  the Actions token can't trigger another workflow. It has a keepalive step
  (scheduled workflows are disabled after 60 days without commits).
- The build does NOT regenerate data; it bundles the committed `src/generated/`.
- `src/generated/types.ts` also exports runtime arrays (e.g., `ITEM_TYPES`) for
  values that need to be iterable
- All exports in `src/generated/types.ts` are auto-generated — do not edit
  manually
- Type generation analyzes data to determine required vs optional fields
- `dataService.ts` imports JSON directly — synchronous `get*()` accessors, no
  async
- `DataContext` initializes data synchronously via `useMemo` and provides it
  app-wide via `useData()` hook
- Items hidden from the table: `BLACKLISTED_ITEM_CATEGORIES` and amplified
  weapon variants (`AMPLIFIED_WEAPON_ID_PATTERN`, ids like
  `anvil_amplified_x_rounds`)
- `getItemRequirements()` merges outpost (`hideout` in the data), quest and
  project requirements into `ItemRequirementLookup`
  - Disabled projects and projects past their `endDate` (Unix seconds) are
    skipped — **except expeditions**, which always count: players who skipped
    one can still do it
  - Expeditions (`id` starts with `expedition_project`) are always displayed
    as "Expedition N", numbered by `startDate` (`getProjectDisplayName`); the
    API names them inconsistently
  - Users can untick expeditions in Search Settings; the hidden ids persist in
    `localStorage` (`hiddenExpeditions`) so new expeditions default to shown
- **Game data** localized text (item names, materials) uses
  `getLocalizedText(localized, language)` from `localization/languageUtils.ts`.
  Typed as `keyof LocalizedText`, so property access may be `undefined` — use
  `?? ""` fallback.
- **UI strings** (labels, headings, buttons) use `translateUI(key)` from
  `useLanguage()` hook. Keys defined in `src/localization/uiStrings.ts` — see
  Localization section below.

## Localization

- 20 languages supported. `LanguageContext` provides `language` +
  `translateUI()` via `useLanguage()` hook.
- `src/localization/uiStrings.ts`: `UIStringKey` type union + `UI_STRINGS`
  record. Both must be updated when adding keys.
- Each entry needs `en` (required) + all 19 other language codes. Test enforces
  this.
- **Dynamic key generation** in `FilterModal.tsx` — patterns differ per filter
  type:
  - Categories: `category.${type.toLowerCase().replace(/ /g, "")}` (from
    `ITEM_TYPES`)
  - Rarities: `rarity.${rarity.toLowerCase()}` (from `ITEM_RARITIES`)
  - Locations: `location.${loc.toLowerCase().replace(/ /g, "")}` (from
    `FOUND_IN_LOCATIONS`)
  - Source types: manual keyMap (`"Outpost"` → `"source.outpost"`,
    `"Not Needed"` → `"source.notNeeded"`)
- **Adding new keys**: add to `UIStringKey` type, add entry with all 20
  languages to `UI_STRINGS`, tests will catch missing keys
- **Game terms** (Outpost, Expedition, item categories…): use the game's own
  translation for the 12 languages it ships (de, es, fr, it, ja, ko-KR, pl,
  pt-BR, ru, tr, zh-CN, zh-TW) and note the string-table key in a comment
  (e.g. `ID_OUTPOST_TAB`). The other 7 (da, he, hr, no, pt, sr, uk) aren't in
  the game; translate those by hand. Game data text (item names etc.) comes
  from the API in all 20 languages.
- In-game UI terms: "Outpost" (not hideout — the data still calls it
  `hideout`), "Expedition"
- `uiStrings.test.ts` validates completeness: data-driven keys (game data →
  translation), source scanning (`translateUI()` calls + `as UIStringKey` casts)

## Search Highlighting Architecture

- `SearchResult` in `functions.ts` tracks which sub-elements matched per item
  (not just that a column matched)
- Pattern: add a `matched*: Record<string, Set<string>>` field to
  `SearchResult`, collect matches in `filterItemsBySearch`, pass through
  `ItemsTable` → `createItemsTableColumns` → cell renderer
- Cell renderers apply `--highlighted` CSS class to individual matching elements
  (e.g., `cell-item--highlighted`, `needed-for-source--highlighted`)
- SCSS in `_table-search.scss`: column-level `.grid-cell--search-match` sets
  `box-shadow: none`, then targets only `--highlighted` children for
  underline/accent styling

## Testing

`bun test` for pure utility function testing (no DOM/component tests — those
use Playwright).

```bash
bun run test          # unit tests (bun test src)
bun run update-data   # fetch arctracker.io data + images into src/generated/ and public/images/
bun run generate      # regenerate src/generated/ from the last fetch in src/arctracker-data/
bun run find-crafts   # list crafting recipes whose output sells for more than the inputs
```

Playwright e2e tests live in `tests/*.spec.ts` (separate from unit tests):

```bash
bun x playwright test --project=chromium
```

- Tests live next to source files: `*.test.ts`; import from `"bun:test"`
- `bunfig.toml` preloads `bun-setup.ts`, which swaps `src/services/dataService`
  for `src/services/__mocks__/dataService.ts` (real JSON, stubbed image URLs).
  **The mock must mirror the real module's export names exactly.**
- Tests use real game data from `src/generated/*.json` wherever possible
- Playwright e2e tests: prefer `getByRole`, `getByLabel`, `getByText` selectors
  over CSS class selectors (`.filter-setting__toggle`) — class selectors break
  on refactors
- Playwright mobile tests use `test.use({ viewport: { width: N, height: N } })`
  inside a `test.describe` block — no need to modify `playwright.config.ts`
  projects

## Performance Patterns

- **Virtualization**: `useWindowVirtualizer` (window-level scrolling, no inner
  scroll container). `Table.tsx` measures `scrollMargin` dynamically. Sticky
  header uses `top: $nav-height` to sit below the fixed nav.
- **Memoization**: `React.memo` on `ItemCell`, `useMemo` for expensive
  computations
- **Debouncing**: Search input debounced 200ms
- **Caching**: `tableCache.ts` pre-computes sort keys, formatted materials,
  bench names
- Always consider performance when modifying table rendering or data processing

## Code Conventions

- **Generated types**: `src/generated/types.ts` is auto-generated from data. For
  type changes, modify the generation logic in
  `scripts/generate-files-from-data.js`
- **Optional fields**: When using generated types, handle optional fields with
  `?? defaultValue` (e.g., `item.value ?? 0`)
- **Navigation**: Desktop nav is `position: fixed` with inline
  buttons/dropdown/language picker. On tablet-and-below (≤950px), desktop
  elements are hidden (`navigation__desktop-only`) and a hamburger menu
  (`navigation__hamburger`) is shown instead — separate DOM trees toggled via
  CSS `display`, each with independent React state. Nav height controlled by
  `$nav-height` in `_variables.scss` — `:root padding-top` and
  `.grid-header top` both reference it (both reset at
  `@include tablet-and-below`).
- **New components**: `.tsx` + paired `.scss` in `src/components/`; SCSS imports
  `@use "../styles/breakpoints"`, `@use "../styles/utilities"`, and
  `@use "../styles/variables" as *` when using shared vars
- **SCSS `@use` gotcha**: Component SCSS files need
  `@use "../styles/breakpoints" as *` explicitly if using `@include mobile` —
  it's not re-exported by `_utilities.scss` or `_variables.scss`
- **SCSS nesting**: Use the `&` selector to nest BEM modifiers (`&--variant`)
  and sub-elements (`&__child`) inside their parent block. Nest as deeply as
  possible rather than writing flat top-level rules.
- **SCSS variables**: `src/styles/_variables.scss` — single source of truth for
  layout (`$content-max-width`, `$nav-height`), type scale
  (`$font-2xl`–`$font-2xs`), border radius (`$radius-sm/md/lg`), z-index
  (`$z-nav`, `$z-modal`, etc.). Use these instead of hardcoded values.
- TypeScript strict mode
- **Arrow functions preferred** over `function` declarations
- **DRY**: Export and reuse constants — don't duplicate
- Named exports for utilities, default exports for components
- SCSS for styling
- `bun run dev` (port 5257) / `bun run build` / `bun run deploy` (GitHub Pages;
  CI runs `bun scripts/deploy.js --ci`)
- **Playwright MCP screenshots**: Always save to `.playwright-mcp/` folder
  (e.g., `filename: ".playwright-mcp/desktop-recycling.png"`), not the project
  root
- **CSS shadows**: Use custom properties from `_colors.scss` (`--shadow-card`,
  `--shadow-card-dark`, `--shadow-table-inset`, `--border-table-top`) instead of
  inline `rgba()` values
- **Sorting state**: Owned by `RecyclingTools.tsx`, passed down to `ItemsTable`
  as props. Mobile sort controls (`SortColumnDropdown` + direction toggle) are
  hidden on desktop via `display: none`, shown on mobile via `@include mobile`.
  Desktop uses table header clicks.
- **Filter state**: `FilterSettings` interface (in `FilterModal.tsx`) owns all
  filter state: `includedCategories`, `includedRarities`, `onlyRecyclable`,
  `onlySalvageable`, `includedLocations`, `includedSourceTypes`,
  `includedExpeditions`, `prioritizeNameMatches`. State lives in
  `RecyclingTools.tsx` (`includedExpeditions` is also persisted), applied in
  `ItemsTable.tsx`'s `filteredData` memo. When adding new Set-based filters,
  also update the `React.memo` comparator's `areSetsEqual` checks.
- **Toggle component**: `src/components/Toggle.tsx` — reusable pill-shaped
  toggle switch. Use for boolean filter settings instead of vanilla checkboxes.
- **Game icon inversion**: Game icons are white (designed for dark UI). Add
  `invert-in-light` class (defined in `_colors.scss`) to `<img>` elements so
  icons are visible in light mode.
- **Theme-adaptive dividers**: Use
  `color-mix(in srgb, var(--text-primary) 10%, transparent)` for subtle
  intra-card dividers — resolves to dark in light mode and light in dark mode
  without media queries.
- **Scroll fade overlay**: To hint scrollable overflow, use a wrapper `div` with
  `position: relative` and `::after` gradient (`transparent` → card bg color).
  Control visibility via a JS-toggled `--overflowing` BEM modifier
  (`scrollHeight > clientHeight && not atBottom`). Avoid `mask-image` (clips
  webkit scrollbars) and `overflow: hidden` on the wrapper.

## AI Guidelines

- Avoid sycophancy — prioritize accuracy over validation
- Disagree when necessary; investigate uncertainty rather than confirming
  assumptions
- When modifying requirements, keep the project rules above (ended projects
  hidden, expeditions always shown)
- Type definitions in `src/generated/types.ts` — `Item`, `HideoutBench`,
  `Quest`, `Project`, `ItemRequirementLookup` (auto-generated)
