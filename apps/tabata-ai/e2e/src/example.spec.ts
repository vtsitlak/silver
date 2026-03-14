import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    // App redirects to login (unauthorized) or tabs/dashboard (authorized); ensure we land on a valid page
    await expect(page).toHaveURL(/\/(auth\/login|tabs\/dashboard)/, { timeout: 10000 });

    // Login page has "Login" heading; dashboard has "Dashboard" tab
    const loginHeading = page.getByRole('heading', { name: 'Login' });
    const dashboardTab = page.getByRole('tab', { name: 'Dashboard' });
    await expect(loginHeading.or(dashboardTab)).toBeVisible({ timeout: 5000 });
});
