import { test, expect, type Page } from "@playwright/test";

/** Helper to get the filtered item count from the "X / Y" badge */
const getFilteredCount = async (page: Page): Promise<number> => {
  const text = await page.locator(".item-count").textContent();
  return Number(text?.split("/").shift()?.trim());
};

/** Helper to get total item count */
const getTotalCount = async (page: Page): Promise<number> => {
  const text = await page.locator(".item-count").textContent();
  return Number(text?.split("/").pop()?.trim());
};

/** Open the filter modal */
const openModal = async (page: Page) => {
  await page.getByLabel("Filter settings").click();
  await expect(page.getByRole("heading", { name: "Search Settings" })).toBeVisible();
};

/** Open a specific MultiSelectDropdown by label text */
const openDropdown = async (page: Page, label: string) => {
  await page.locator(".multi-select-dropdown__trigger", { hasText: label }).click();
};

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector(".items-table", { timeout: 15000 });
});

test.describe("Filter Modal — Basic Behavior", () => {
  test("filter button opens the modal", async ({ page }) => {
    await page.getByLabel("Filter settings").click();
    await expect(page.getByRole("heading", { name: "Search Settings" })).toBeVisible();
  });

  test("close button closes the modal", async ({ page }) => {
    await openModal(page);
    await page.getByLabel("Close").click();
    await expect(page.getByRole("heading", { name: "Search Settings" })).not.toBeVisible();
  });

  test("clicking overlay closes the modal", async ({ page }) => {
    await openModal(page);
    await page.locator(".filter-modal-overlay").click({ position: { x: 10, y: 10 } });
    await expect(page.getByRole("heading", { name: "Search Settings" })).not.toBeVisible();
  });

  test("pressing Escape closes the modal", async ({ page }) => {
    await openModal(page);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: "Search Settings" })).not.toBeVisible();
  });
});

test.describe("Filter Modal — Category Filter", () => {
  test("Deselect All categories results in 0 items shown", async ({ page }) => {
    await openModal(page);
    await openDropdown(page, "Item Categories");
    await page.getByRole("button", { name: "Deselect All" }).click();
    await page.getByLabel("Close").click();

    await expect(page.locator(".item-count")).toContainText("0 /");
  });

  test("Select All restores all items", async ({ page }) => {
    const initialCount = await getTotalCount(page);

    await openModal(page);
    await openDropdown(page, "Item Categories");
    await page.getByRole("button", { name: "Deselect All" }).click();
    await page.getByRole("button", { name: "Select All", exact: true }).click();
    await page.getByLabel("Close").click();

    expect(await getFilteredCount(page)).toBe(initialCount);
  });

  test("toggling individual category changes item count", async ({ page }) => {
    const initialCount = await getFilteredCount(page);

    await openModal(page);
    await openDropdown(page, "Item Categories");

    const firstCheckbox = page.locator(".multi-select-dropdown__option input[type='checkbox']").first();
    await firstCheckbox.uncheck();
    await page.getByLabel("Close").click();

    expect(await getFilteredCount(page)).toBeLessThan(initialCount);
  });
});

test.describe("Filter Modal — Rarity Filter", () => {
  test("deselecting all rarities results in 0 items", async ({ page }) => {
    await openModal(page);
    await openDropdown(page, "Rarity");
    await page.getByRole("button", { name: "Deselect All" }).click();
    await page.getByLabel("Close").click();

    await expect(page.locator(".item-count")).toContainText("0 /");
  });

  test("selecting only Epic shows fewer items", async ({ page }) => {
    const initialCount = await getFilteredCount(page);

    await openModal(page);
    await openDropdown(page, "Rarity");
    await page.getByRole("button", { name: "Deselect All" }).click();
    await page.getByRole("checkbox", { name: "Epic" }).check();
    await page.getByLabel("Close").click();

    const epicCount = await getFilteredCount(page);
    expect(epicCount).toBeGreaterThan(0);
    expect(epicCount).toBeLessThan(initialCount);
  });
});

test.describe("Filter Modal — Recycle/Salvage Toggles", () => {
  test("Has Recycle Output toggle filters out items without recycle data", async ({ page }) => {
    const initialCount = await getFilteredCount(page);

    await openModal(page);
    await page.getByText("Has Recycle Output").click();
    await page.getByLabel("Close").click();

    const filteredCount = await getFilteredCount(page);
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(initialCount);
  });

  test("Has Salvage Output toggle filters out items without salvage data", async ({ page }) => {
    const initialCount = await getFilteredCount(page);

    await openModal(page);
    await page.getByText("Has Salvage Output").click();
    await page.getByLabel("Close").click();

    const filteredCount = await getFilteredCount(page);
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(initialCount);
  });
});

test.describe("Filter Modal — Found In Filter", () => {
  test("deselecting all locations results in 0 items", async ({ page }) => {
    await openModal(page);
    await openDropdown(page, "Found In");
    await page.getByRole("button", { name: "Deselect All" }).click();
    await page.getByLabel("Close").click();

    await expect(page.locator(".item-count")).toContainText("0 /");
  });

  test("deselecting 'No Location' removes items without a location", async ({ page }) => {
    const initialCount = await getFilteredCount(page);

    await openModal(page);
    await openDropdown(page, "Found In");
    await page.getByRole("checkbox", { name: "No Location" }).uncheck();
    await page.getByLabel("Close").click();

    const filteredCount = await getFilteredCount(page);
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(initialCount);
  });
});

test.describe("Filter Modal — Needed For Filter", () => {
  test("deselecting all source types results in 0 items", async ({ page }) => {
    await openModal(page);
    await openDropdown(page, "Needed For");
    await page.getByRole("button", { name: "Deselect All" }).click();
    await page.getByLabel("Close").click();

    await expect(page.locator(".item-count")).toContainText("0 /");
  });

  test("deselecting 'Not Needed' removes items with no requirements", async ({ page }) => {
    const initialCount = await getFilteredCount(page);

    await openModal(page);
    await openDropdown(page, "Needed For");
    await page.getByRole("checkbox", { name: "Not Needed" }).uncheck();
    await page.getByLabel("Close").click();

    const filteredCount = await getFilteredCount(page);
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(initialCount);
  });
});

test.describe("Filter Modal — Prioritize Name Matches Toggle", () => {
  test("toggle is checked by default and toggleable", async ({ page }) => {
    await openModal(page);

    const toggle = page.getByRole("checkbox", { name: "Prioritize name matches" });
    await expect(toggle).toBeChecked();

    await page.getByText("Prioritize name matches").click();
    await expect(toggle).not.toBeChecked();

    await page.getByText("Prioritize name matches").click();
    await expect(toggle).toBeChecked();
  });
});

test.describe("Filter Modal — Combined Filters", () => {
  test("multiple filters stack correctly", async ({ page }) => {
    const initialCount = await getFilteredCount(page);

    await openModal(page);

    // Enable "Has Recycle Output"
    await page.getByText("Has Recycle Output").click();

    // Select only Epic rarity
    await openDropdown(page, "Rarity");
    await page.getByRole("button", { name: "Deselect All" }).click();
    await page.getByRole("checkbox", { name: "Epic" }).check();

    // Close the rarity dropdown by clicking the header
    await page.getByRole("heading", { name: "Search Settings" }).click();

    await page.getByLabel("Close").click();

    const combinedCount = await getFilteredCount(page);
    expect(combinedCount).toBeGreaterThan(0);
    expect(combinedCount).toBeLessThan(initialCount);
  });
});
