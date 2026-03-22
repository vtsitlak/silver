import { test, expect } from '@playwright/test';
import { requireAuthEnv, loginAndWaitForDashboard } from './auth-helpers';

requireAuthEnv();

test.describe('Workouts', () => {
    test.beforeEach(async ({ page }) => {
        await loginAndWaitForDashboard(page);
        await page.getByRole('tab', { name: 'Workouts' }).click();
        await page.waitForURL(/\/tabs\/workouts/, { timeout: 10000 });
    });

    test('should show Workouts page with title and add button', async ({ page }) => {
        await expect(page).toHaveURL(/\/tabs\/workouts/);
        await expect(page.locator('tbt-toolbar').filter({ has: page.getByText('Workouts') })).toBeVisible({ timeout: 5000 });
        await expect(page.getByRole('button', { name: 'Add workout' }).or(page.locator('ion-button[aria-label="Add workout"]'))).toBeVisible();
    });

    test('should show search bar', async ({ page }) => {
        await expect(page.getByRole('search').or(page.locator('ion-searchbar'))).toBeVisible({ timeout: 5000 });
    });

    test('should navigate to create workout when add is clicked', async ({ page }) => {
        await page.getByRole('button', { name: 'Add workout' }).or(page.locator('ion-button[aria-label="Add workout"]')).first().click();
        await expect(page).toHaveURL(/\/tabs\/workout-editor\/create/, { timeout: 10000 });
        await expect(page.locator('ion-input#workout-name')).toBeVisible({ timeout: 5000 });
    });
});
