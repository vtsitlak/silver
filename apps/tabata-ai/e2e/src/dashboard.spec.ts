import { test, expect } from '@playwright/test';
import { requireAuthEnv, loginAndWaitForDashboard } from './auth-helpers';

requireAuthEnv();

test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await loginAndWaitForDashboard(page);
    });

    test('should show dashboard with greeting and tab bar', async ({ page }) => {
        await expect(page).toHaveURL(/\/tabs\/dashboard/);
        await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible({ timeout: 5000 });
        await expect(page.getByRole('tab', { name: 'Workouts' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'History' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'Dashboard' })).toHaveAttribute('aria-selected', 'true');
        await expect(page.getByRole('heading', { name: /Hello,/ })).toBeVisible({ timeout: 5000 });
    });

    test('should have Dashboard toolbar title', async ({ page }) => {
        await expect(page.locator('tbt-toolbar').filter({ has: page.getByText('Dashboard') })).toBeVisible({ timeout: 5000 });
    });
});
