import { test, expect } from '@playwright/test';
import { requireAuthEnv, loginAndWaitForDashboard } from './auth-helpers';

requireAuthEnv();

test.describe('About modal', () => {
    test.beforeEach(async ({ page }) => {
        await loginAndWaitForDashboard(page);
    });

    test('should open About modal and switch tabs', async ({ page }) => {
        const dashboardToolbar = page.locator('tbt-toolbar').filter({ has: page.getByText('Dashboard') });
        await dashboardToolbar.getByRole('button', { name: 'About this app' }).first().click();

        await expect(page.locator('.about-modal-sheet')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('About Tabata AI')).toBeVisible({ timeout: 5000 });

        // Segment tabs inside the modal
        await expect(page.getByText('Overview')).toBeVisible();
        await expect(page.getByText('How to use')).toBeVisible();

        // Switch to right tab
        await page.locator('ion-segment-button[value="how-to-use"]').click();
        await expect(page.getByRole('heading', { name: /Traditional Tabata/ })).toBeVisible({ timeout: 10000 });

        await page.locator('ion-segment-button[value="overview"]').click();
        // Overview content: "Technologies" section heading
        await expect(page.getByRole('heading', { name: /Technologies/ })).toBeVisible({ timeout: 10000 });
    });
});

