import { randomBytes, randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';

test('User registers and signs in through Angular with the same account', async ({ page }) => {
  const email = `e2e-${randomUUID()}@example.test`;
  const password = randomBytes(24).toString('base64url');

  await page.goto('/register');
  const documentTimeOrigin = await page.evaluate(() => performance.timeOrigin);
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

  const main = page.getByRole('main');
  await main.getByRole('link', { name: 'Se connecter', exact: true }).click();
  await expect(page).toHaveURL('http://web/login');
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentTimeOrigin);
  await page.getByLabel('Email', { exact: true }).fill(email);
  try {
    await page.getByLabel('Mot de passe', { exact: true }).fill(password);
  } catch {
    throw new Error('Unable to fill login password field.');
  }

  const [loggedIn, identity] = await Promise.all([
    page.waitForResponse(response =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname === '/api/auth/login',
    ),
    page.waitForResponse(response =>
      response.request().method() === 'GET' &&
      new URL(response.url()).pathname === '/api/auth/me',
    ),
    page.getByRole('button', { name: 'Connexion', exact: true }).click(),
  ]);
  expect(loggedIn.status()).toBe(200);
  expect(identity.status()).toBe(200);
  await expect(page).toHaveURL('http://web/account');
  await expect(main.getByRole('heading', { name: 'Mon espace', exact: true })).toBeVisible();
  await expect(main.getByText(email, { exact: true })).toBeVisible();
  // Both SPA transitions must preserve the document and Angular's in-memory session.
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentTimeOrigin);
});
