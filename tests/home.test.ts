import { expect, test } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Tableur/);

  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL('/login');

  await page.getByLabel('Email').fill('test@example.com');
  await page.getByRole('button', { name: 'Log In' }).click();

  await expect(page).toHaveURL('/login/verify');
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page).toHaveURL('/login/verify');
});
