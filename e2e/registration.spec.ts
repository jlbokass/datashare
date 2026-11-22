import { randomBytes, randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';

test('User registration displays confirmation', async ({ page }) => {
  const email = `e2e-${randomUUID()}@example.test`;
  const password = randomBytes(24).toString('base64url');

  await page.goto('/register');
  await page.getByLabel('Email', { exact: true }).fill(email);
  try {
    await page.getByLabel('Mot de passe', { exact: true }).fill(password);
    await page.getByLabel('Vérification du mot de passe', { exact: true }).fill(password);
  } catch {
    // Do not expose password fill arguments in a failed action's error message.
    throw new Error('Unable to fill registration password fields.');
  }

  const [registered] = await Promise.all([
    page.waitForResponse(response =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname === '/api/auth/register',
    ),
    page.getByRole('button', { name: 'Créer mon compte', exact: true }).click(),
  ]);
  expect(registered.status()).toBe(201);
  const confirmation = page.getByRole('main').getByRole('status');
  await expect(confirmation).toBeVisible();
  await expect(confirmation).toContainText('Ton compte a bien été créé');
});
