import { test, expect } from '@playwright/test';
import { fillIonInput, requireAuthEnv } from './auth-helpers';

test.describe('Authentication', () => {
    test.beforeAll(requireAuthEnv);
    test.beforeEach(async ({ page }) => {
        await page.goto('/auth/login');

        await page.locator('ion-input#email').waitFor({ state: 'visible', timeout: 10000 });
    });

    test('should successfully login with valid credentials', async ({ page }) => {
        await fillIonInput(page, 'email', process.env['TEST_USER_EMAIL'] ?? '');
        await fillIonInput(page, 'password', process.env['TEST_USER_PASSWORD'] ?? '');
        await page.getByRole('button', { name: 'Login' }).click();
        await page.waitForURL(/\/tabs\/dashboard/, { timeout: 30000, waitUntil: 'commit' });
        await page.getByRole('tab', { name: 'Dashboard' }).waitFor({ state: 'visible', timeout: 15000 });

        await expect(page).toHaveURL(/\/tabs\/dashboard/);
        await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'Workouts' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'History' })).toBeVisible();

        await expect(page.getByRole('tab', { name: 'Dashboard' })).toHaveAttribute('aria-selected', 'true');
    });
});
