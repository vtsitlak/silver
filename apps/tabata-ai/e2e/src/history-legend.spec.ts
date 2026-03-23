import { test, expect } from '@playwright/test';
import { requireAuthEnv, loginAndWaitForDashboard } from './auth-helpers';

requireAuthEnv();

test.describe('History legend', () => {
    test.beforeEach(async ({ page }) => {
        await loginAndWaitForDashboard(page);
        await page.getByRole('tab', { name: 'History' }).click();
        await page.waitForURL(/\/tabs\/history/, { timeout: 10000 });
    });

    test('should show Completed (green) and Canceled (red) legend', async ({ page }) => {
        const legend = page.locator('div.flex.flex-wrap.gap-3.mb-3');
        await expect(legend.getByText('Completed', { exact: true })).toBeVisible({ timeout: 10000 });
        await expect(legend.getByText('Canceled', { exact: true })).toBeVisible({ timeout: 10000 });
    });
});
