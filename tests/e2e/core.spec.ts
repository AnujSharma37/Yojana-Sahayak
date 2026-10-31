import { expect, test } from "@playwright/test";

// Run against a seeded local app: npm run dev, then npm run test:e2e
// (first time: npx playwright install chromium)

test("homepage shows heading, search and 8 category tiles", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Find Government Schemes Made for You.");
  await expect(page.getByPlaceholder("Ask anything about government schemes...")).toBeVisible();
  await expect(page.locator('a[href*="category="]')).toHaveCount(8);
});

test("language switch keeps the page and marks the selected language", async ({ page }) => {
  await page.goto("/en/schemes");
  await page.getByRole("link", { name: /हिंदी/ }).click();
  await expect(page).toHaveURL(/\/hi\/schemes/);
  await expect(page.getByRole("link", { name: /हिंदी/ })).toHaveAttribute("aria-current", "true");
});

test("filters show removable chips and Clear all", async ({ page }) => {
  await page.goto("/en/schemes?category=farmers&level=central");
  await expect(page.getByRole("link", { name: /Remove filter Farmers/ })).toBeVisible();
  await page.getByRole("link", { name: "Clear all" }).click();
  await expect(page).toHaveURL(/\/en\/schemes$/);
});

test("save, unsave and undo", async ({ page }) => {
  await page.goto("/en/schemes");
  const save = page.getByRole("button", { name: /^Save:/ }).first();
  test.skip(!(await save.count()), "No verified schemes in the database yet");
  await save.click();
  await page.goto("/en/saved");
  const unsave = page.getByRole("button", { name: /Remove from saved/ }).first();
  await unsave.click();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("button", { name: /Remove from saved/ }).first()).toBeVisible();
});

test("chat falls back gracefully when AI is not configured", async ({ page }) => {
  await page.goto("/en/assistant");
  await page.getByLabel("Your question").fill("schemes for farmers");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(/AI assistant is not available|Assistant|Sources/).first()).toBeVisible({ timeout: 30_000 });
});

test("keyboard: skip link reaches main content", async ({ page }) => {
  await page.goto("/en");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
});
