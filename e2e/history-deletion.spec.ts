import { randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

test('The owner deletes files individually and the last deletion revokes the share', async ({ browser, page, request }) => {
  const id = randomUUID();
  const email = `e2e-${id}@example.test`;
  const password = randomBytes(24).toString('base64url');
  const firstName = `first-${id}.txt`;
  const secondName = `second-${id}.txt`;
  const firstBytes = Buffer.from(`DataShare first ${id}\n`, 'utf8');
  const secondBytes = Buffer.from(`DataShare second ${id}\n`, 'utf8');

  // Prepare a synthetic user via the real API. Authentication itself is covered by E2E-01.
  let registrationStatus: number;
  try {
    const registration = await request.post('/api/auth/register', { data: { email, password } });
    registrationStatus = registration.status();
    await registration.dispose();
  } catch {
    throw new Error('Synthetic account setup failed.');
  }
  expect(registrationStatus).toBe(201);

  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(email);
  try {
    await page.getByLabel('Mot de passe', { exact: true }).fill(password);
  } catch {
    throw new Error('Unable to fill login password field.');
  }
  const [login, identity] = await Promise.all([
    page.waitForResponse(r => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/auth/login'),
    page.waitForResponse(r => r.request().method() === 'GET' && new URL(r.url()).pathname === '/api/auth/me'),
    page.getByRole('button', { name: 'Connexion', exact: true }).click(),
  ]);
  expect(login.status()).toBe(200);
  expect(identity.status()).toBe(200);
  await expect(page).toHaveURL('http://web/account');

  // Create a two-file transfer through the real Angular upload form.
  await page.getByRole('link', { name: 'Ajouter des fichiers' }).click();
  await expect(page).toHaveURL('http://web/upload');
  await page.locator('input[type="file"]').setInputFiles([
    { name: firstName, mimeType: 'text/plain', buffer: firstBytes },
    { name: secondName, mimeType: 'text/plain', buffer: secondBytes },
  ]);
  const [uploaded] = await Promise.all([
    page.waitForResponse(r => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/transfers'),
    page.getByRole('button', { name: 'Téléverser', exact: true }).click(),
  ]);
  expect(uploaded.status()).toBe(201);
  await expect(page.getByRole('heading', { name: 'Ajouter des fichiers', exact: true })).toBeVisible();
  const shareUrl = await page.getByLabel('Lien unique de partage').inputValue();
  const sharePath = new URL(shareUrl).pathname;
  expect(sharePath).toMatch(/^\/share\/[a-f0-9]{64}$/);

  // The recipient stays anonymous; the owner keeps their in-memory JWT.
  const anonymous = await browser.newContext({ baseURL: 'http://web', acceptDownloads: true });
  try {
    const recipient = await anonymous.newPage();
    await recipient.goto(shareUrl);
    await expect(recipient.getByText(firstName, { exact: true })).toBeVisible();
    await expect(recipient.getByText(secondName, { exact: true })).toBeVisible();

    await page.getByRole('navigation').getByRole('link', { name: 'Mon espace' }).click();
    await expect(page).toHaveURL('http://web/account');
    await expect(page.getByRole('heading', { name: firstName, exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: secondName, exact: true })).toBeVisible();

    // Confirm and verify each real owner-authorized DELETE request.
    page.once('dialog', dialog => { void dialog.accept(); });
    const [firstDeletion] = await Promise.all([
      page.waitForResponse(r =>
        r.request().method() === 'DELETE' &&
        /\/api\/transfers\/[^/]+\/files\/[^/]+$/.test(new URL(r.url()).pathname),
      ),
      page.getByRole('button', { name: `Supprimer ${firstName}`, exact: true }).click(),
    ]);
    expect(firstDeletion.status()).toBe(204);
    await expect(page.getByRole('heading', { name: firstName, exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: secondName, exact: true })).toBeVisible();

    // The same public share still serves the remaining file, byte for byte.
    await recipient.reload();
    await expect(recipient.getByText(firstName, { exact: true })).toHaveCount(0);
    await expect(recipient.getByText(secondName, { exact: true })).toBeVisible();
    const [download] = await Promise.all([
      recipient.waitForEvent('download'),
      recipient.getByRole('link', { name: `Télécharger ${secondName}` }).click(),
    ]);
    expect(download.suggestedFilename()).toBe(secondName);
    expect((await readFile(await download.path())).equals(secondBytes)).toBe(true);

    page.once('dialog', dialog => { void dialog.accept(); });
    const [lastDeletion] = await Promise.all([
      page.waitForResponse(r =>
        r.request().method() === 'DELETE' &&
        /\/api\/transfers\/[^/]+\/files\/[^/]+$/.test(new URL(r.url()).pathname),
      ),
      page.getByRole('button', { name: `Supprimer ${secondName}`, exact: true }).click(),
    ]);
    expect(lastDeletion.status()).toBe(204);
    await expect(page.getByText('Aucun transfert actif dans ton historique.', { exact: true })).toBeVisible();

    // Deleting the last file revokes the token, not merely the displayed history.
    const revoked = await anonymous.request.get(`/api/shares/${sharePath.split('/').at(-1)}`);
    const revokedStatus = revoked.status();
    await revoked.dispose();
    expect(revokedStatus).toBe(404);
    await recipient.reload();
    await expect(recipient.getByRole('heading', { name: 'Lien indisponible' })).toBeVisible();
  } finally {
    await anonymous.close();
  }
});
