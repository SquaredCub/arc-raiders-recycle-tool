# Performance Optimization TODO

## Remaining Tasks

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

### 7. Consider Web Workers for Large Operations (Future Enhancement)

**Problem:** Heavy filtering/sorting blocks main thread

**Solution:** Move expensive computations to Web Workers

**Estimated time:** 4-6 hours

---

### 8. Add Loading States for Expensive Operations (Future Enhancement)

**Problem:** No visual feedback during slow operations

**Solution:** Add skeleton loaders or spinner during filtering/sorting

**Estimated time:** 1 hour

---

## Completed Optimizations

1. ✅ **Debounced search** - 300ms delay, reduced filtering by 70-90%
2. ✅ **Memoized ItemCell** - Prevented 3000+ unnecessary re-renders
3. ✅ **Virtual scrolling** - Only renders ~15 visible rows instead of 500+
4. ✅ **Optimized sorting** - Pre-computed sort keys for 20-40% faster sorting
5. ✅ **Fixed alternating row colors** - Uses data index instead of DOM index
6. ✅ **Fixed scroll jittering** - Dynamic row height measurement
7. ✅ **Table max-width** - Capped at 1509px, centered
