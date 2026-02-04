import { test } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("http://localhost:5173/arc-raiders-recycle-tool/");

  await page.pause();
});
