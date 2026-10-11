# Arc Raiders Recycle Tool

## Overview

Arc Raiders Recycle Tool is a web application built with React, TypeScript, and Vite. It helps players of the game **Arc Raiders** decide what to keep and what to recycle: a searchable table of items with what each one recycles and salvages into, its value, and what it is still needed for (Outpost upgrades, quests, projects and expeditions).

## Features

- Search and filter in-game items by category, rarity, location and usage
- See recycle and salvage outputs, sell value and where items are found
- "Needed for" column tracking Outpost upgrades, quests, projects and expeditions
- Available in 20 languages

## Data Sources & Credits

Game data and item images come from the public [arctracker.io API](https://arctracker.io/developers/docs). Many thanks to the [arctracker.io](https://arctracker.io) team for collecting the game data and making it freely available.

A scheduled GitHub Action checks the API daily. When the data changes, it updates the compiled data in `src/generated/` and the images in `public/images/items/`, commits them and redeploys the site.

All game content, including names, items, mechanics and imagery, is copyright © Embark Studios AB. This project is a community resource and is not affiliated with or endorsed by Embark Studios.

## Getting Started

The project uses [Bun](https://bun.sh).

1. **Install dependencies:**
   ```bash
   bun install
   ```
2. **Run the development server:**
   ```bash
   bun run dev
   ```
3. **Open the app:**
   Visit [http://localhost:5257/arc-raiders-recycle-tool/](http://localhost:5257/arc-raiders-recycle-tool/) in your browser.

Other commands:

```bash
bun run update-data   # fetch the latest data and changed images from arctracker.io
bun run test          # unit tests
bun run test:e2e      # Playwright end-to-end tests
bun run find-crafts   # list crafting recipes worth more than their ingredients
```

## Project Structure

- `src/components/` — UI components
- `src/contexts/`, `src/hooks/` — React context providers and hooks
- `src/data/` — Item and requirement helpers (what each item is needed for)
- `src/generated/` — Compiled game data and generated TypeScript types (do not edit by hand)
- `src/localization/` — UI strings in 20 languages
- `src/utils/` — Search, sorting and table helpers
- `public/images/` — Item images
- `scripts/` — Data update, deployment and analysis scripts

## Contributing

This project is primarily developed for personal use, but community contributions are welcome! Feel free to open issues or submit pull requests with suggestions or improvements. Please note that while all contributions will be considered, responses and reviews may not be immediate due to the project's personal nature.
