import { randomBytes, randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';

test('Anonymous access is refused and logout clears the local session', async ({ browser, page, request }) => {
  await test.step('Refuse anonymous account and API access', async () => {
    const anonymous = await browser.newContext({ baseURL: 'http://web' });
    try {
      const guest = await anonymous.newPage();
      await guest.goto('/account');
      await expect(guest).toHaveURL('http://web/login');
      for (const path of ['/api/auth/me', '/api/transfers']) {
        const response = await anonymous.request.get(path);
        const status = response.status();
        await response.dispose();
        expect(status, `Anonymous GET ${path}`).toBe(401);
      }
    } finally {
      await anonymous.close();
    }
  });

  const email = `e2e-${randomUUID()}@example.test`;
  const password = randomBytes(24).toString('base64url');
  await test.step('Prepare a synthetic user through the real API', async () => {
    let registrationStatus: number;
    try {
      const registered = await request.post('/api/auth/register', { data: { email, password } });
      registrationStatus = registered.status();
      await registered.dispose();
    } catch {
      throw new Error('Registration setup request failed.');
    }
    expect(registrationStatus).toBe(201);
  });

  await page.goto('/login');
  const documentTimeOrigin = await page.evaluate(() => performance.timeOrigin);
  const main = page.getByRole('main');
  await test.step('Sign in through Angular and verify identity', async () => {
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
    await expect(main.getByRole('heading', { name: 'Mes fichiers', exact: true })).toBeVisible();
    await expect(main.getByText(email, { exact: true })).toBeVisible();
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentTimeOrigin);
  });

  await test.step('Log out and refuse browser back access without reloading', async () => {
    await main.getByRole('button', { name: 'Déconnexion', exact: true }).click();
    await expect(page).toHaveURL('http://web/');
    await expect(page.getByRole('navigation').getByRole('link', {
      name: 'Se connecter', exact: true,
    })).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL('http://web/login');
    await expect(main.getByRole('heading', { name: 'Mes fichiers', exact: true })).toHaveCount(0);
    await expect(main.getByText(email, { exact: true })).toHaveCount(0);
    // A reload would hide a broken logout by discarding the in-memory JWT.
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentTimeOrigin);
  });
});
