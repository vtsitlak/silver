import { Page } from '@playwright/test';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../.env') });

const TEST_USER_EMAIL = process.env['TEST_USER_EMAIL'];
const TEST_USER_PASSWORD = process.env['TEST_USER_PASSWORD'];

export function requireAuthEnv(): void {
    if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
        throw new Error(
            'Missing required environment variables: TEST_USER_EMAIL and TEST_USER_PASSWORD. ' +
                'Set them in apps/tabata-ai/e2e/.env locally or in your CI environment.'
        );
    }
}

/**
 * Log in with test credentials and wait until the app has navigated to the dashboard.
 * Call requireAuthEnv() in beforeAll when using this.
 */
export async function loginAndWaitForDashboard(page: Page): Promise<void> {
    await page.goto('/auth/login');
    await page.getByLabel('Email').or(page.locator('#email')).first().waitFor({ state: 'visible', timeout: 10000 });
    await page
        .getByLabel('Email')
        .or(page.locator('#email'))
        .first()
        .fill(TEST_USER_EMAIL ?? '');
    await page
        .getByLabel('Password')
        .or(page.locator('#password'))
        .first()
        .fill(TEST_USER_PASSWORD ?? '');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL(/\/tabs\/dashboard/, { timeout: 30000 });
}
