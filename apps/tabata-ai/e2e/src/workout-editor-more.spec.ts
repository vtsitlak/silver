import { test, expect } from '@playwright/test';
import { requireAuthEnv, loginAndWaitForDashboard } from './auth-helpers';

requireAuthEnv();

test.describe('Workout editor (create flow)', () => {
    test.beforeEach(async ({ page }) => {
        await loginAndWaitForDashboard(page);
        await page.getByRole('tab', { name: 'Workouts' }).click();
        await page.waitForURL(/\/tabs\/workouts/, { timeout: 10000 });
        await page.getByRole('button', { name: 'Add workout' }).click();
        await expect(page).toHaveURL(/\/tabs\/workout-editor\/create/, { timeout: 10000 });
    });

    test('should show phase tabs and primary info fields', async ({ page }) => {
        // Phase tabs
        await expect(page.locator('ion-segment-button[value="info"]')).toBeVisible();
        await expect(page.locator('ion-segment-button[value="warmup"]')).toBeVisible();
        await expect(page.locator('ion-segment-button[value="main"]')).toBeVisible();
        await expect(page.locator('ion-segment-button[value="cooldown"]')).toBeVisible();

        // Info tab content (create mode)
        await expect(page.getByRole('button', { name: 'Generate with AI' })).toBeVisible();
        await expect(page.locator('ion-input#workout-name')).toBeVisible();
        await expect(page.locator('ion-select#workout-level')).toBeVisible();
        await expect(page.locator('ion-select#workout-primary-goal')).toBeVisible();

        // Warmup tab
        await page.locator('ion-segment-button[value="warmup"]').click();
        await expect(page.getByRole('button', { name: 'Add exercises' })).toBeVisible();

        // Main tab
        await page.locator('ion-segment-button[value="main"]').click();
        await expect(page.getByRole('button', { name: 'Add block' })).toBeVisible();

        // Cooldown tab
        await page.locator('ion-segment-button[value="cooldown"]').click();
        await expect(page.getByRole('button', { name: 'Add exercises' })).toBeVisible();
    });
});

