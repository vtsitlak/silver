import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { fillIonInput } from './auth-helpers';

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

        await page.locator('ion-input#email').waitFor({ state: 'visible', timeout: 10000 });
    });

    test('should successfully login with valid credentials', async ({ page }) => {
        await fillIonInput(page, 'email', TEST_USER_EMAIL ?? '');
        await fillIonInput(page, 'password', TEST_USER_PASSWORD ?? '');
        await page.getByRole('button', { name: 'Login' }).click();
        await page.waitForURL(/\/tabs\/dashboard/, { timeout: 30000, waitUntil: 'commit' });
        await page.getByRole('tab', { name: 'Dashboard' }).waitFor({ state: 'visible', timeout: 15000 });

        await expect(page).toHaveURL(/\/tabs\/dashboard/);
        await expect(page.getByRole('tab', { name: 'Dashboard' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'Workouts' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'History' })).toBeVisible();

        await expect(page.getByRole('tab', { name: 'Dashboard' })).toHaveAttribute('aria-selected', 'true');
    });
});
