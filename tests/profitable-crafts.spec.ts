import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector(".items-table", { timeout: 15000 });
  await page.getByRole("button", { name: "Profitable Crafts" }).click();
});

test.describe("Profitable Crafts Page", () => {
  test("shows Profitable Crafting Recipes heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Profitable Crafting Recipes" })).toBeVisible();
  });

  test("profitable cards are rendered with item names and profit amounts", async ({ page }) => {
    const cards = page.locator(".profitable-card");
    expect(await cards.count()).toBeGreaterThan(0);

    const firstCard = cards.first();
    await expect(firstCard.locator(".profitable-card__header")).toBeVisible();
    await expect(firstCard.locator(".profit-amount")).toBeVisible();
    await expect(firstCard.locator(".profit-margin")).toBeVisible();
  });

  test("each card shows Output section and Recipe Materials section", async ({ page }) => {
    const firstCard = page.locator(".profitable-card").first();

    await expect(firstCard.getByRole("heading", { name: "Output" })).toBeVisible();
    await expect(firstCard.getByRole("heading", { name: "Recipe Materials" })).toBeVisible();
  });

  test("summary shows count of profitable recipes", async ({ page }) => {
    const summary = page.locator(".profitable-summary");
    await expect(summary).toBeVisible();
    await expect(summary).toContainText("profitable crafting recipe");
  });

  test("cards are sorted by profit highest first", async ({ page }) => {
    const profitAmounts = page.locator(".profit-amount");
    const count = await profitAmounts.count();

    if (count >= 2) {
      const profits: number[] = [];
      for (let i = 0; i < Math.min(count, 5); i++) {
        const text = await profitAmounts.nth(i).textContent();
        // Parse "+1,234" format
        const num = Number(text?.replace(/[^0-9]/g, ""));
        profits.push(num);
      }

      for (let i = 1; i < profits.length; i++) {
        expect(profits[i]).toBeLessThanOrEqual(profits[i - 1]);
      }
    }
  });
});
