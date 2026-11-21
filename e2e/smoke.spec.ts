import { test, expect } from '@playwright/test';

test('Angular home page is displayed', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('app-root')).toBeVisible();
  await expect(page.getByRole('main').getByRole('heading', {
    name: 'Tu veux partager un fichier ?',
    exact: true,
  })).toBeVisible();
});
