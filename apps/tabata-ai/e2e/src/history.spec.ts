import { test, expect } from '@playwright/test';
import { requireAuthEnv, loginAndWaitForDashboard } from './auth-helpers';

requireAuthEnv();

test.describe('History', () => {
    test.beforeEach(async ({ page }) => {
        await loginAndWaitForDashboard(page);
        await page.getByRole('tab', { name: 'History' }).click();
        await page.waitForURL(/\/tabs\/history/, { timeout: 10000 });
    });

    test('should show History page with toolbar', async ({ page }) => {
        await expect(page).toHaveURL(/\/tabs\/history/);
        await expect(page.locator('tbt-toolbar').filter({ has: page.getByText('History') })).toBeVisible({ timeout: 5000 });
    });

    test('should show segment tabs: History, Most Used, Favorites', async ({ page }) => {
        const segment = page.locator('ion-segment');
        await expect(segment.getByText('History')).toBeVisible({ timeout: 5000 });
        await expect(segment.getByText('Most Used')).toBeVisible();
        await expect(segment.getByText('Favorites')).toBeVisible();
    });
});
