import { randomBytes, randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';

test('User signs in through Angular and sees their account', async ({ page, request }) => {
  const email = `e2e-${randomUUID()}@example.test`;
  const password = randomBytes(24).toString('base64url');

  let registrationStatus: number;
  try {
    const registered = await request.post('/api/auth/register', { data: { email, password } });
    registrationStatus = registered.status();
    await registered.dispose();
  } catch {
    // Do not expose request data or headers in transport errors.
    throw new Error('Registration setup request failed.');
  }
  expect(registrationStatus).toBe(201);

  await page.goto('/login');
  const documentTimeOrigin = await page.evaluate(() => performance.timeOrigin);
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
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { name: 'Mon espace', exact: true })).toBeVisible();
  await expect(main.getByText(email, { exact: true })).toBeVisible();
  // A SPA transition keeps the same document; never reload the in-memory session.
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentTimeOrigin);
});
