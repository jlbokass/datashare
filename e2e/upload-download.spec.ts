import { randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

test('An uploaded TXT file can be downloaded anonymously with identical bytes', async ({ browser, page, request }) => {
  const id = randomUUID();
  const email = `e2e-${id}@example.test`;
  const password = randomBytes(24).toString('base64url');
  const filename = `e2e-${id}.txt`;
  const content = Buffer.from(`DataShare E2E-02 ${id}\n`, 'utf8');

  // Prepare an isolated synthetic account using the real Laravel API.
  let registrationStatus: number;
  try {
    const registration = await request.post('/api/auth/register', { data: { email, password } });
    registrationStatus = registration.status();
    await registration.dispose();
  } catch {
    throw new Error('Synthetic registration setup failed.');
  }
  expect(registrationStatus).toBe(201);

  // Authenticate through Angular: its JWT exists only in application memory.
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(email);
  try {
    await page.getByLabel('Mot de passe', { exact: true }).fill(password);
  } catch {
    throw new Error('Unable to fill login password field.');
  }
  const [login, identity] = await Promise.all([
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
  expect(login.status()).toBe(200);
  expect(identity.status()).toBe(200);
  await expect(page).toHaveURL('http://web/account');

  // Navigate within Angular without reloading (the JWT is stored in memory).
  await page.getByRole('link', { name: 'Ajouter des fichiers' }).click();
  await expect(page).toHaveURL('http://web/upload');
  await page.locator('input[type="file"]').setInputFiles({
    name: filename,
    mimeType: 'text/plain',
    buffer: content,
  });

  const [upload] = await Promise.all([
    page.waitForResponse(response =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname === '/api/transfers',
    ),
    page.getByRole('button', { name: 'Téléverser', exact: true }).click(),
  ]);
  expect(upload.status()).toBe(201);
  await expect(page.getByRole('heading', { name: 'Ajouter un fichier', exact: true })).toBeVisible();
  const shareUrl = await page.getByLabel('Lien unique de partage').inputValue();
  expect(new URL(shareUrl).pathname).toMatch(/^\/share\/[a-f0-9]{64}$/);

  // A separate browser context has no JWT or shared browser session.
  const anonymous = await browser.newContext({ baseURL: 'http://web', acceptDownloads: true });
  try {
    const recipient = await anonymous.newPage();
    await recipient.goto(shareUrl);
    await expect(recipient.getByRole('main').getByText(filename, { exact: true })).toBeVisible();

    const [download] = await Promise.all([
      recipient.waitForEvent('download'),
      recipient.getByRole('link', { name: `Télécharger ${filename}` }).click(),
    ]);
    expect(download.suggestedFilename()).toBe(filename);
    const received = await readFile(await download.path());
    // Compare the actual bytes without printing file contents in test reports.
    expect(received.equals(content)).toBe(true);
  } finally {
    await anonymous.close();
  }
});
