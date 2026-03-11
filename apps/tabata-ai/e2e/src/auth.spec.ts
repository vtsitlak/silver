import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../.env') });

const TEST_USER_EMAIL = process.env['TEST_USER_EMAIL'];
const TEST_USER_PASSWORD = process.env['TEST_USER_PASSWORD'];

test.beforeAll(() => {
    if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
        throw new Error(
            'Missing required environment variables: TEST_USER_EMAIL and TEST_USER_PASSWORD. ' +
                'Set them in apps/tabata-ai/e2e/.env locally or in your CI environment.'
        );
    }
});

test.describe('Authentication', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/auth/login');

        // Wait for the login form to be ready (email input by id or label)
        await page.getByLabel('Email').or(page.locator('#email')).first().waitFor({ state: 'visible', timeout: 10000 });
    });

    test('should successfully login with valid credentials', async ({ page }) => {
        await page.getByLabel('Email').or(page.locator('#email')).first().fill(TEST_USER_EMAIL ?? '');
        await page.getByLabel('Password').or(page.locator('#password')).first().fill(TEST_USER_PASSWORD ?? '');

        await Promise.all([page.waitForURL(/\/tabs\/home/, { timeout: 15000 }), page.getByRole('button', { name: 'Login' }).click()]);

        await expect(page).toHaveURL(/\/tabs\/home/, { timeout: 10000 });

        await expect(page.getByRole('tab', { name: 'Home' })).toBeVisible({ timeout: 5000 });
        await expect(page.getByRole('tab', { name: 'Workouts' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'History' })).toBeVisible();

        await expect(page.getByRole('tab', { name: 'Home' })).toHaveAttribute('aria-selected', 'true');
    });
});
