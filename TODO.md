# Performance Optimization TODO

## Overview

This document outlines performance bottlenecks identified in the Arc Raiders Recycle Tool and provides detailed tasks for optimization. The main issues are with table sorting and search functionality causing UI lag.

---

## Priority 1: Quick Wins (High Impact, Low Effort)

### 1. Implement Debounced Search Input

**Problem:**
- Every keystroke triggers immediate re-filtering of the entire dataset
- Search in `filterItemsBySearch()` runs on every character typed
- Causes cascading re-renders of the entire table (potentially 500+ rows)
- User typing "scrap metal" triggers 11 separate filter operations

**Solution:**
Implement a debounced search with ~300ms delay using `useDeferredValue` or custom debounce hook.

**Implementation Steps:**
1. Create a custom `useDebounce` hook in `src/hooks/useDebounce.ts`
2. Update `RecyclingTools.tsx` to use debounced search term
3. Keep input value immediate for responsive typing UX
4. Only trigger filtering after user stops typing for 300ms

**Files to modify:**
- Create: `src/hooks/useDebounce.ts`
- Modify: `src/RecyclingTools.tsx`

**Expected impact:** 70-90% reduction in unnecessary filtering operations

**Estimated time:** 15 minutes

---

### 2. Memoize ItemCell Component

**Problem:**
- `ItemCell` component re-renders on every table update
- With 500 items × 6 columns = 3000 potential cell renders per update
- Each cell includes image elements and link calculations
- No memoization means cells re-render even when their data hasn't changed

**Solution:**
Wrap `ItemCell` with `React.memo()` to prevent re-renders when props haven't changed.

**Implementation Steps:**
1. Import `memo` from React in `src/ItemCell.tsx`
2. Wrap component export with `memo(ItemCell)`
3. Optionally add custom comparison function for deep prop equality

**Files to modify:**
- `src/ItemCell.tsx`

**Expected impact:** 60-80% reduction in cell re-renders during sorting/filtering

**Estimated time:** 5 minutes

---

## Priority 2: Medium Effort Optimizations (High Impact, Moderate Effort)

### 3. Implement Virtual Scrolling

**Problem:**
- Table renders ALL rows in the DOM at once (500+ rows)
- Each row has 6 cells with images, links, and formatted content
- Browser must paint and maintain 3000+ DOM nodes
- Scrolling and sorting require repainting all nodes

**Solution:**
Use `@tanstack/react-virtual` to only render visible rows + buffer.

**Implementation Steps:**
1. Install dependency: `npm install @tanstack/react-virtual`
2. Create virtualized table wrapper component `src/components/VirtualizedTable.tsx`
3. Update `Table.tsx` to use virtual row rendering
4. Configure overscan for smooth scrolling (render ~10 extra rows above/below viewport)
5. Calculate row heights (estimated or measured)

**Files to modify:**
- Create: `src/components/VirtualizedTable.tsx` (or modify existing `Table.tsx`)
- Update: `src/Table.tsx`
- Update: `package.json`

**Challenges:**
- Need to set fixed or estimated row heights
- May need to adjust CSS for virtual scrolling container
- Sorting must reset scroll position

**Expected impact:** 80-95% reduction in rendered DOM nodes (only render ~20 visible rows instead of 500)

**Estimated time:** 1-2 hours

---

## Priority 3: Advanced Optimizations (Medium Impact, Higher Effort)

### 4. Optimize Sorting Functions

**Problem:**
- `localeCompare()` is called repeatedly during sort operations
- Custom sorting functions in column definitions run on every comparison
- No caching of computed sort values

**Solution:**
Pre-compute sort keys for expensive operations.

**Implementation Steps:**
1. Create sort key cache in `useMemo` for name sorting
2. Store pre-computed lowercase names for faster comparison
3. Consider simple string comparison instead of `localeCompare` for ASCII-only names
4. Cache requirement totals for "Needed For" column

**Files to modify:**
- `src/utils/itemsTableColumns.tsx`
- `src/ItemsTable.tsx`

**Expected impact:** 20-40% faster sorting operations

**Estimated time:** 1 hour

---

### 5. Optimize FilteredData Calculation

**Problem:**
- `filteredData` useMemo runs entire filter pipeline on every search/filter change
- `filterItemsBySearch()` iterates through ALL items twice (name matches + material matches)
- Category filtering happens after search filtering (second iteration)

**Solution:**
Combine filtering operations into single pass.

**Implementation Steps:**
1. Refactor `filterItemsBySearch()` to accept category filter
2. Combine name/material/category checks in single iteration
3. Use early returns to skip unnecessary checks
4. Consider indexed search for very large datasets

**Files to modify:**
- `src/utils/functions.ts`
- `src/ItemsTable.tsx`

**Expected impact:** 30-50% faster filtering on large datasets

**Estimated time:** 45 minutes

---

### 6. Memoize Column Cell Renderers

**Problem:**
- Cell renderer functions are recreated on every render
- Complex cells (Recycles Into, Crafting Materials, Needed For) do expensive calculations

**Solution:**
Extract cell renderers to memoized components.

**Implementation Steps:**
1. Create separate memoized components:
   - `RecyclesIntoCell.tsx`
   - `CraftingMaterialsCell.tsx`
   - `NeededForCell.tsx`
   - `ValueCell.tsx`
2. Pass only necessary props to each cell component
3. Use `memo()` with custom comparison functions

**Files to modify:**
- Create: `src/components/cells/RecyclesIntoCell.tsx`
- Create: `src/components/cells/CraftingMaterialsCell.tsx`
- Create: `src/components/cells/NeededForCell.tsx`
- Create: `src/components/cells/ValueCell.tsx`
- Modify: `src/utils/itemsTableColumns.tsx`

**Expected impact:** 40-60% reduction in cell render time

**Estimated time:** 2 hours

---

## Priority 4: Future Enhancements (Lower Priority)

### 7. Consider Web Workers for Large Operations

**Problem:**
- Heavy filtering/sorting blocks main thread
- UI becomes unresponsive during large operations

**Solution:**
Move expensive computations to Web Workers.

**Estimated time:** 4-6 hours

---

### 8. Add Loading States for Expensive Operations

**Problem:**
- No visual feedback during slow operations
- Users don't know if app is working or frozen

**Solution:**
Add skeleton loaders or spinner during filtering/sorting.

**Estimated time:** 1 hour

---

## Measurement & Testing

### Before implementing optimizations:
1. Measure current performance with React DevTools Profiler
2. Record time for:
   - Typing 10-character search term
   - Sorting by each column
   - Filtering categories
3. Test with full dataset (500+ items)

### After each optimization:
1. Re-measure same operations
2. Document improvements
3. Check for regressions

### Performance targets:
- Search input should feel instant (< 100ms perceived delay)
- Sorting should complete in < 200ms
- Table should handle 1000+ items smoothly

---

## Implementation Order

**Recommended sequence:**
1. ✅ **COMPLETED** - Debounced search (15 min) - Immediate UX improvement
   - Created `useDebounce` hook with 300ms delay
   - Memoized `ItemsTable` with custom comparison for Set equality
   - Memoized `SearchInput` to prevent cascade re-renders
   - Input remains responsive while filtering is debounced
2. ✅ **COMPLETED** - Memoize ItemCell (5 min) - Easy win
   - Wrapped `ItemCell` component with `React.memo()`
   - Uses default shallow comparison (all props are primitives)
   - Prevents unnecessary re-renders of 3000+ cells during sorting/filtering
3. ✅ Virtual scrolling (1-2 hours) - Biggest impact for large datasets
4. Optimize sorting functions (1 hour)
5. Optimize filtered data calculation (45 min)
6. Memoize cell renderers (2 hours)

**Total estimated time for priorities 1-3:** ~3-4 hours

---

## Notes

- All optimizations maintain current functionality
- No breaking changes to component APIs
- Focus on user-perceived performance first
- Consider adding performance monitoring in production
- Test with realistic data volumes (500-1000 items)
