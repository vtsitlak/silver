import { test, expect } from '@playwright/test';
import { requireAuthEnv, loginAndWaitForDashboard } from './auth-helpers';

requireAuthEnv();

test.describe('Profile', () => {
    test.beforeEach(async ({ page }) => {
        await loginAndWaitForDashboard(page);
        await page.getByRole('tab', { name: 'Profile' }).click();
        await page.waitForURL(/\/tabs\/profile/, { timeout: 10000 });
    });

    test('should show Profile page with Profile Settings heading', async ({ page }) => {
        await expect(page).toHaveURL(/\/tabs\/profile/);
        await expect(page.getByRole('heading', { name: 'Profile Settings' })).toBeVisible({ timeout: 5000 });
    });

    test('should show Display Name and Email fields', async ({ page }) => {
        const profileForm = page.locator('form').filter({ has: page.getByRole('heading', { name: 'Profile Settings' }) });
        // Ionic ion-input: assert host visibility (labels live in shadow DOM; getByLabel is unreliable).
        await expect(profileForm.locator('ion-input#displayName')).toBeVisible({ timeout: 5000 });
        await expect(profileForm.locator('ion-input#email')).toBeVisible({ timeout: 5000 });
    });

    test('should show Logout button', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 5000 });
    });
});
