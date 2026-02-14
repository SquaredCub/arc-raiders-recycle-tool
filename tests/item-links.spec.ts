import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector(".items-table", { timeout: 15000 });
});

test.describe("Item Wiki Links", () => {
  test("item names in the table are links to the wiki", async ({ page }) => {
    const itemLinks = page.locator(".cell-item__name a");
    const firstLink = itemLinks.first();

    await expect(firstLink).toBeVisible();
    const href = await firstLink.getAttribute("href");
    expect(href).toContain("arcraiders.wiki/wiki/");
  });

  test("item links open in new tab", async ({ page }) => {
    const itemLinks = page.locator(".cell-item__name a");
    const firstLink = itemLinks.first();

    await expect(firstLink).toHaveAttribute("target", "_blank");
    await expect(firstLink).toHaveAttribute("rel", /noopener/);
  });
});
