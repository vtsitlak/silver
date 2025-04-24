import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '../.env') });

const TEST_USER_EMAIL = process.env['TEST_USER_EMAIL'] || 'vtsitlaknl@gmail.com';
const TEST_USER_PASSWORD = process.env['TEST_USER_PASSWORD'] || '123456';

test.describe('Authentication', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the login page before each test
        await page.goto('/auth/login');

        // Wait for the login form to be ready
        await page.waitForSelector('#ion-input-0', { state: 'visible' });
    });

    test('should successfully login with valid credentials', async ({ page }) => {
        // Fill in the email
        await page.locator('#ion-input-0').fill(TEST_USER_EMAIL);

        // Fill in the password
        await page.locator('#ion-input-1').fill(TEST_USER_PASSWORD);

        // Click the login button and wait for navigation
        await Promise.all([
            page.waitForNavigation({ timeout: 10000 }), // Increase timeout and wait for navigation
            page.getByRole('button', { name: 'Login' }).click()
        ]);

        // Verify navigation to home page
        await expect(page).toHaveURL('/tabs/home', { timeout: 10000 });

        // Verify the presence of tab elements
        await expect(page.getByRole('tab', { name: 'Home' })).toBeVisible({ timeout: 5000 });
        await expect(page.getByRole('tab', { name: 'Workouts' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'History' })).toBeVisible();

        // Verify Home tab is selected
        await expect(page.getByRole('tab', { name: 'Home' })).toHaveAttribute('aria-selected', 'true');
    });
});
