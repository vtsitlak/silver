import { test, expect } from '@playwright/test';
import { requireAuthEnv, loginAndWaitForDashboard } from './auth-helpers';

requireAuthEnv();

test.describe('Profile', () => {
    test.beforeEach(async ({ page }) => {
        await loginAndWaitForDashboard(page);
        await page.goto('/tabs/profile');
        await page.waitForURL(/\/tabs\/profile/, { timeout: 10000 });
    });

    test('should show Profile page with Profile Settings heading', async ({ page }) => {
        await expect(page).toHaveURL(/\/tabs\/profile/);
        await expect(page.getByRole('heading', { name: 'Profile Settings' })).toBeVisible({ timeout: 5000 });
    });

    test('should show Display Name and Email fields', async ({ page }) => {
        await expect(page.getByLabel('Display Name').or(page.locator('#displayName'))).toBeVisible({ timeout: 5000 });
        await expect(page.getByLabel('Email').or(page.locator('#email'))).toBeVisible();
    });
});
