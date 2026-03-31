import { test, expect } from "@playwright/test";

const expectedLinks = [
  { name: "Maps", href: "https://arcraidersmaps.app/" },
  { name: "Map Selector", href: "https://wheelofnames.com/stu-fhg" },
  { name: "Damage Calculator", href: "https://arcdamagecalculator.tiiny.site/" },
  { name: "Tracker", href: "https://arctracker.io/" },
  { name: "Github Repository", href: "https://github.com/SquaredCub/arc-raiders-recycle-tool" },
  { name: "Donate", href: "https://paypal.me/SquaredCub" },
];

test.describe("Navigation & Page Switching", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".items-table", { timeout: 15000 });
  });
  test("loads with Recycling Tool page active by default", async ({ page }) => {
    const recyclingBtn = page.getByRole("button", { name: "Recycling Tool" });
    await expect(recyclingBtn).toHaveClass(/navigation__item--active/);
    await expect(page.getByRole("heading", { name: "Recycling Tool" })).toBeVisible();
  });

  test("switches to Map Events page and back", async ({ page }) => {
    await page.getByRole("button", { name: "Map Events" }).click();
    await expect(page.getByRole("button", { name: "Map Events" })).toHaveClass(/navigation__item--active/);
    await expect(page.getByRole("button", { name: "Recycling Tool" })).not.toHaveClass(/navigation__item--active/);

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

  test("External Links dropdown contains all 6 links with correct hrefs", async ({ page }) => {
    await page.getByLabel("External Links").click();
    const menu = page.locator(".navigation__dropdown-menu");

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

test.describe("Navigation — tablet", () => {
  test.use({ viewport: { width: 900, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".items-table", { timeout: 15000 });
  });

  test("hamburger is visible at 900px", async ({ page }) => {
    await expect(page.getByLabel("Menu")).toBeVisible();
    await expect(page.getByLabel("External Links")).not.toBeVisible();
  });

  test("hamburger opens and navigates", async ({ page }) => {
    await page.getByLabel("Menu").click();
    const panel = page.locator(".navigation__hamburger-panel");
    await expect(panel).toBeVisible();

    await panel.getByRole("button", { name: "Map Events" }).click();
    await expect(panel).not.toBeVisible();
  });
});

test.describe("Navigation — mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".items-table", { timeout: 15000 });
  });

  test("hamburger button is visible", async ({ page }) => {
    await expect(page.getByLabel("Menu")).toBeVisible();
  });

  test("desktop nav is hidden on mobile", async ({ page }) => {
    await expect(page.getByLabel("External Links")).not.toBeVisible();
  });

  test("app title is visible in nav bar", async ({ page }) => {
    await expect(page.locator(".navigation__hamburger-title")).toHaveText("SquaredTools");
  });

  test("hamburger opens panel with page links", async ({ page }) => {
    await page.getByLabel("Menu").click();
    const panel = page.locator(".navigation__hamburger-panel");
    await expect(panel).toBeVisible();

    const recycling = panel.getByRole("button", { name: "Recycling Tool" });
    await expect(recycling).toBeVisible();
    await expect(recycling).toHaveClass(/navigation__hamburger-page--active/);
    await expect(panel.getByRole("button", { name: "Map Events" })).toBeVisible();
  });

  test("page navigation works and closes panel", async ({ page }) => {
    await page.getByLabel("Menu").click();
    const panel = page.locator(".navigation__hamburger-panel");
    await panel.getByRole("button", { name: "Map Events" }).click();

    await expect(panel).not.toBeVisible();
  });

  test("hamburger has language picker", async ({ page }) => {
    await page.getByLabel("Menu").click();
    const panel = page.locator(".navigation__hamburger-panel");
    await expect(panel.getByLabel("Language")).toBeVisible();
  });

  test("hamburger has all external links", async ({ page }) => {
    await page.getByLabel("Menu").click();
    const panel = page.locator(".navigation__hamburger-panel");

    for (const { name, href } of expectedLinks) {
      const link = panel.getByRole("link", { name });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", href);
      await expect(link).toHaveAttribute("target", "_blank");
    }
  });

  test("hamburger toggle closes panel", async ({ page }) => {
    const hamburger = page.getByLabel("Menu");
    await hamburger.click();
    await expect(page.locator(".navigation__hamburger-panel")).toBeVisible();

    await hamburger.click();
    await expect(page.locator(".navigation__hamburger-panel")).not.toBeVisible();
  });

  test("pressing Escape closes hamburger panel", async ({ page }) => {
    await page.getByLabel("Menu").click();
    await expect(page.locator(".navigation__hamburger-panel")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator(".navigation__hamburger-panel")).not.toBeVisible();
  });
});
