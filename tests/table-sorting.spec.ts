import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector(".items-table", { timeout: 15000 });
});

test.describe("Table Sorting", () => {
  test("table renders with expected headers", async ({ page }) => {
    const headers = ["Item", "Recycles Into", "Salvages Into", "Found In", "Needed For", "Value"];

    for (const header of headers) {
      await expect(page.locator(".table-header").getByText(header, { exact: true })).toBeVisible();
    }
  });

  test("clicking a header toggles between ascending and descending", async ({ page }) => {
    // "Found In" column: sortDescFirst=false, starts unsorted
    const foundInHeader = page.locator(".table-header").getByText("Found In", { exact: true });

    // Initially unsorted — next sort would be ascending
    await expect(foundInHeader.locator("..")).toHaveAttribute("title", "Sort ascending");

    // First click — sorted ascending, next would be descending
    await foundInHeader.click();
    await expect(foundInHeader.locator("..")).toHaveAttribute("title", "Sort descending");

    // Second click — sorted descending, next would be ascending (no removal)
    await foundInHeader.click();
    await expect(foundInHeader.locator("..")).toHaveAttribute("title", "Sort ascending");
  });

  test("Item column starts pre-sorted ascending", async ({ page }) => {
    // Item column defaults to ascending sort on load
    const itemHeader = page.locator(".table-header .table-cell.item div");
    await expect(itemHeader).toHaveAttribute("title", "Sort descending");
  });

  test("table rows have alternating row classes", async ({ page }) => {
    const evenRows = page.locator(".table-row--even");
    const oddRows = page.locator(".table-row--odd");

    expect(await evenRows.count()).toBeGreaterThan(0);
    expect(await oddRows.count()).toBeGreaterThan(0);
  });
});
