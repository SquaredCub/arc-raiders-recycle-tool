Plan to implement

Mobile Search Highlighting, Salvages Column, and Value Label Fixes

Context

Three mobile UX issues:

1.  When searching (e.g. "wire"), ALL material chips in the recycles column get highlighted, but only the matching ones should (e.g. "2
    x Wire" highlighted, "2 x Canister" not).

Plan

1.  Per-material search highlighting

Problem: filterItemsBySearch only tracks column-level matches (Set<SearchMatchType>), not which specific material IDs matched.

Files to modify:

- src/utils/functions.ts — Extend SearchResult to include matched material IDs:  
  export interface SearchResult {  
   items: Item[];  
   matchTypes: Record<string, Set<SearchMatchType>>;  
   matchedMaterials: Record<string, Set<string>>; // itemId → Set<materialId>  
  }
- In the filterItemsBySearch loop, when checking recycles/salvages, collect the actual matching material IDs into  
  matchedMaterials[item.id].
- src/ItemsTable.tsx — Extract searchResult.matchedMaterials and pass it through to createItemsTableColumns.
- src/utils/itemsTableColumns.tsx — Accept matchedMaterials param. In the recycles and salvages cell renderers, pass a highlighted  
  prop to each ItemCell when matchedMaterials[item.id]?.has(material).
- src/ItemCell.tsx — Add optional highlighted?: boolean prop. When true, add a cell-item--highlighted class to the root div.
- src/styles/\_table-search.scss — Replace the mobile .grid-cell--recycles.grid-cell--search-match rule with a .cell-item--highlighted  
  rule that accents only that specific chip (blue background + border, like current style but per-chip).

Verification

1.  npm run build — SCSS and TypeScript compile
2.  npx playwright test — all e2e tests pass
3.  Manual check: search "wire" on mobile → only "Wire" chips highlighted in recycles, not "Canister"
4.  Manual check: search "wire" → "Fried Motherboard" card shows salvages section with highlighted "Wire" chip
5.  Manual check: value label appears above the number, no horizontal overflow
