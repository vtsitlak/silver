import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    // App redirects to login (unauthorized) or tabs/home (authorized); ensure we land on a valid page
    await expect(page).toHaveURL(/\/(auth\/login|tabs\/home)/, { timeout: 10000 });

    // Login page has "Login" heading; home has "Home" tab
    const loginHeading = page.getByRole('heading', { name: 'Login' });
    const homeTab = page.getByRole('tab', { name: 'Home' });
    await expect(loginHeading.or(homeTab)).toBeVisible({ timeout: 5000 });
});
