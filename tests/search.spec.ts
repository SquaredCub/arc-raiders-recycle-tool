import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector(".items-table", { timeout: 15000 });
  // Wait for item count to appear (set by ItemsTable after data loads)
  await page.waitForSelector(".item-count", { timeout: 10000 });
});

test.describe("Search Functionality", () => {
  test("search input is visible with correct placeholder", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search items...");
    await expect(searchInput).toBeVisible();
  });

  test("typing in search filters the table", async ({ page }) => {
    const itemCountEl = page.locator(".item-count");
    const initialText = await itemCountEl.textContent();
    const totalCount = Number(initialText?.split("/").pop()?.trim());

    await page.getByPlaceholder("Search items...").fill("guitar");

    // Wait for the count to change (debounced search)
    await expect(itemCountEl).not.toHaveText(initialText!, { timeout: 5000 });

    const filteredText = await itemCountEl.textContent();
    const filteredCount = Number(filteredText?.split("/").shift()?.trim());

    expect(filteredCount).toBeLessThan(totalCount);
    expect(filteredCount).toBeGreaterThan(0);
  });

  test("clear button resets search and restores full item list", async ({ page }) => {
    const initialText = await page.locator(".item-count").textContent();

    await page.getByPlaceholder("Search items...").fill("guitar");
    await expect(page.locator(".item-count")).not.toHaveText(initialText!, { timeout: 5000 });

    await page.locator(".search-input__clear-button").click();
    await expect(page.locator(".item-count")).toHaveText(initialText!, { timeout: 5000 });
    await expect(page.getByPlaceholder("Search items...")).toHaveValue("");
  });

  test("search matches highlight relevant cells", async ({ page }) => {
    const initialText = await page.locator(".item-count").textContent();

    await page.getByPlaceholder("Search items...").fill("guitar");
    await expect(page.locator(".item-count")).not.toHaveText(initialText!, { timeout: 5000 });

    const matchCells = page.locator(".grid-cell--search-match");
    await expect(matchCells.first()).toBeVisible({ timeout: 5000 });
    expect(await matchCells.count()).toBeGreaterThan(0);
  });

  test("no results shows appropriate empty state", async ({ page }) => {
    const nonsense = "xyznonexistent123";
    await page.getByPlaceholder("Search items...").fill(nonsense);

    await expect(page.getByText(`No items found matching "${nonsense}"`)).toBeVisible({ timeout: 5000 });
  });
});
