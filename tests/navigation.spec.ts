import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector(".items-table", { timeout: 15000 });
});

test.describe("Navigation & Page Switching", () => {
  test("loads with Recycling Tool page active by default", async ({ page }) => {
    const recyclingBtn = page.getByRole("button", { name: "Recycling Tool" });
    await expect(recyclingBtn).toHaveClass(/navigation__item--active/);
    await expect(page.getByRole("heading", { name: "Recycling Tool" })).toBeVisible();
  });

  test("switches to Profitable Crafts page", async ({ page }) => {
    await page.getByRole("button", { name: "Profitable Crafts" }).click();

    await expect(page.getByRole("heading", { name: "Profitable Crafting Recipes" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Profitable Crafts" })).toHaveClass(/navigation__item--active/);
    await expect(page.getByRole("button", { name: "Recycling Tool" })).not.toHaveClass(/navigation__item--active/);
  });

  test("switches back to Recycling Tool page", async ({ page }) => {
    await page.getByRole("button", { name: "Profitable Crafts" }).click();
    await page.getByRole("button", { name: "Recycling Tool" }).click();

    await expect(page.getByRole("heading", { name: "Recycling Tool" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Recycling Tool" })).toHaveClass(/navigation__item--active/);
  });

  test("External Links dropdown opens and closes on click", async ({ page }) => {
    const toggle = page.getByLabel("External Links");
    await toggle.click();
    await expect(page.locator(".navigation__dropdown-menu")).toBeVisible();

    await toggle.click();
    await expect(page.locator(".navigation__dropdown-menu")).not.toBeVisible();
  });

  test("External Links dropdown contains all 5 links with correct hrefs", async ({ page }) => {
    await page.getByLabel("External Links").click();
    const menu = page.locator(".navigation__dropdown-menu");

    const expectedLinks = [
      { name: "Github Repository", href: "https://github.com/SquaredCub/arc-raiders-recycle-tool" },
      { name: "Maps", href: "https://arcraidersmaps.app/" },
      { name: "Map Selector", href: "https://wheelofnames.com/stu-fhg" },
      { name: "Damage Calculator", href: "https://arcdamagecalculator.tiiny.site/" },
      { name: "Tracker", href: "https://arctracker.io/" },
    ];

    for (const { name, href } of expectedLinks) {
      const link = menu.getByRole("link", { name });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", href);
      await expect(link).toHaveAttribute("target", "_blank");
    }
  });

  test("clicking outside closes External Links dropdown", async ({ page }) => {
    await page.getByLabel("External Links").click();
    await expect(page.locator(".navigation__dropdown-menu")).toBeVisible();

    await page.locator("h1").click();
    await expect(page.locator(".navigation__dropdown-menu")).not.toBeVisible();
  });
});
