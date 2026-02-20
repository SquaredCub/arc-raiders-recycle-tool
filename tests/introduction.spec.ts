import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector(".items-table", { timeout: 15000 });
});

test.describe("Introduction collapse", () => {
  test("introduction content has zero height when collapsed", async ({ page }) => {
    const introduction = page.locator("#introduction");

    // Should start collapsed (no .visible class)
    await expect(introduction).not.toHaveClass(/visible/);

    // Parent container should have 0 rendered height when collapsed.
    // In Chrome, the child's padding/borders leak through (~32px); in Firefox it clips properly.
    const collapsedHeight = await introduction.evaluate(
      (el) => el.getBoundingClientRect().height
    );
    expect(collapsedHeight).toBeLessThan(1);
  });

  test("introduction expands and collapses on toggle", async ({ page }) => {
    const introduction = page.locator("#introduction");
    const toggleButton = page.getByRole("button", { name: "Show tooltip" });

    // Expand and wait for the CSS transition (grid-template-rows 0.3s) to finish
    await toggleButton.click();
    await expect(introduction).toHaveClass(/visible/);
    await introduction.evaluate(
      (el) =>
        new Promise<void>((resolve) => {
          el.addEventListener("transitionend", () => resolve(), { once: true });
        })
    );

    const expandedHeight = await introduction.evaluate(
      (el) => el.getBoundingClientRect().height
    );
    expect(expandedHeight).toBeGreaterThan(0);

    // Collapse
    await page.getByRole("button", { name: "Hide tooltip" }).click();
    await expect(introduction).not.toHaveClass(/visible/);

    // Wait for the CSS transition (grid-template-rows 0.3s) to finish
    await introduction.evaluate(
      (el) =>
        new Promise<void>((resolve) => {
          el.addEventListener("transitionend", () => resolve(), { once: true });
        })
    );

    const collapsedHeight = await introduction.evaluate(
      (el) => el.getBoundingClientRect().height
    );
    expect(collapsedHeight).toBeLessThan(1);
  });
});
