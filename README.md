# Arc Raiders Recycle Tool

## Overview

Arc Raiders Recycle Tool is a web application built with React, TypeScript, and Vite. It helps players of the game **Arc Raiders** efficiently manage, search, and recycle in-game items. The tool provides a searchable database of items, crafting requirements, and other useful data to assist with gameplay and resource management.

## Features

- Search and filter in-game items
- View item details and crafting requirements

## Data Sources & Credits

The app uses JSON data files located in the `src/arcraiders-data/` directory, including:

- Items, trades, bots, maps, quests, and more
- Images and assets for visual reference

### Data Attribution

The data in `src/arcraiders-data/` is sourced from a fork of the [RaidTheory/arcraiders-data](https://github.com/RaidTheory/arcraiders-data) repository. This project uses the fork maintained at [SquaredCub/arcraiders-data](https://github.com/SquaredCub/arcraiders-data), which may include additional modifications and updates.

Special thanks to the original authors and contributors for collecting and maintaining the Arc Raiders game data.

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Run the development server:**
   ```bash
   npm run dev
   ```
3. **Open the app:**
   Visit [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

- `src/` — Main source code
- `src/arcraiders-data/` — Game data files (items, maps, bots, etc.)
- `src/components/` — Reusable UI components
- `src/contexts/` — React context providers
- `src/data/` — Data loading utilities
- `src/hooks/` — Custom React hooks
- `src/services/` — Data service logic
- `src/utils/` — Utility functions

## Contributing

This project is primarily developed for personal use, but community contributions are welcome! Feel free to open issues or submit pull requests with suggestions or improvements. Please note that while all contributions will be considered, responses and reviews may not be immediate due to the project's personal nature.

## License

See the `src/arcraiders-data/LICENSE` file for license information regarding the data files.
