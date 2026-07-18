import { test, expect } from '@playwright/test';
import { loginAndWaitForDashboard, requireAuthEnv } from './auth-helpers';

test.describe('Authentication', () => {
    test.beforeAll(requireAuthEnv);

    test('should successfully login with valid credentials', async ({ page }) => {
        await loginAndWaitForDashboard(page);

        await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('tab', { name: 'Workouts' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'History' })).toBeVisible();
    });
});
