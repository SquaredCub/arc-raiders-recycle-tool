import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector(".items-table", { timeout: 15000 });
});

test.describe("Filter Modal & Category Filtering", () => {
  test("filter button opens the modal", async ({ page }) => {
    await page.getByLabel("Filter settings").click();
    await expect(page.getByRole("heading", { name: "Search Settings" })).toBeVisible();
  });

  test("close button closes the modal", async ({ page }) => {
    await page.getByLabel("Filter settings").click();
    await expect(page.getByRole("heading", { name: "Search Settings" })).toBeVisible();

    await page.getByLabel("Close").click();
    await expect(page.getByRole("heading", { name: "Search Settings" })).not.toBeVisible();
  });

  test("clicking overlay closes the modal", async ({ page }) => {
    await page.getByLabel("Filter settings").click();
    await expect(page.getByRole("heading", { name: "Search Settings" })).toBeVisible();

    await page.locator(".filter-modal-overlay").click({ position: { x: 10, y: 10 } });
    await expect(page.getByRole("heading", { name: "Search Settings" })).not.toBeVisible();
  });

  test("pressing Escape closes the modal", async ({ page }) => {
    await page.getByLabel("Filter settings").click();
    await expect(page.getByRole("heading", { name: "Search Settings" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: "Search Settings" })).not.toBeVisible();
  });

  test("Deselect All categories results in 0 items shown", async ({ page }) => {
    await page.getByLabel("Filter settings").click();

    // Open the category dropdown
    await page.locator(".multi-select-dropdown__trigger").click();
    await page.getByRole("button", { name: "Deselect All" }).click();

    // Close modal to see results
    await page.getByLabel("Close").click();
    await page.waitForTimeout(400);

    const itemCountText = await page.locator(".item-count").textContent();
    const filteredCount = itemCountText?.split("/").shift()?.trim();
    expect(Number(filteredCount)).toBe(0);
  });

  test("Select All restores all items", async ({ page }) => {
    const initialText = await page.locator(".item-count").textContent();

    await page.getByLabel("Filter settings").click();
    await page.locator(".multi-select-dropdown__trigger").click();

    // Deselect all first, then select all
    await page.getByRole("button", { name: "Deselect All" }).click();
    await page.getByRole("button", { name: "Select All", exact: true }).click();

    await page.getByLabel("Close").click();
    await page.waitForTimeout(400);

    const restoredText = await page.locator(".item-count").textContent();
    expect(restoredText).toBe(initialText);
  });

  test("toggling individual category changes item count", async ({ page }) => {
    const initialText = await page.locator(".item-count").textContent();
    const initialCount = Number(initialText?.split("/").shift()?.trim());

    await page.getByLabel("Filter settings").click();
    await page.locator(".multi-select-dropdown__trigger").click();

    // Uncheck the first category checkbox
    const firstCheckbox = page.locator(".multi-select-dropdown__option input[type='checkbox']").first();
    await firstCheckbox.uncheck();

    await page.getByLabel("Close").click();
    await page.waitForTimeout(400);

    const newText = await page.locator(".item-count").textContent();
    const newCount = Number(newText?.split("/").shift()?.trim());
    expect(newCount).toBeLessThan(initialCount);
  });

  test("Prioritize name matches checkbox is toggleable", async ({ page }) => {
    await page.getByLabel("Filter settings").click();

    const checkbox = page.locator(".filter-setting__toggle input[type='checkbox']");
    const initialState = await checkbox.isChecked();

    await checkbox.click();
    expect(await checkbox.isChecked()).toBe(!initialState);

    await checkbox.click();
    expect(await checkbox.isChecked()).toBe(initialState);
  });
});
