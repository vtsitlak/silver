import { expect, Page } from '@playwright/test';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../.env') });

function getAuthCredentials(): { email: string | undefined; password: string | undefined } {
    return {
        email: process.env['TEST_USER_EMAIL'],
        password: process.env['TEST_USER_PASSWORD']
    };
}

export function requireAuthEnv(): void {
    const { email, password } = getAuthCredentials();
    if (!email || !password) {
        throw new Error(
            'Missing required environment variables: TEST_USER_EMAIL and TEST_USER_PASSWORD. ' +
                'Set them in apps/tabata-ai/e2e/.env locally or in your CI environment.'
        );
    }
}

/**
 * Ionic `<ion-input>` hosts a native `<input>` in the shadow DOM; Playwright `fill()` must target
 * that inner input, not the custom element (see https://playwright.dev/docs/locators#locate-in-shadow-dom).
 */
export async function fillIonInput(page: Page, fieldId: string, value: string): Promise<void> {
    const input = page.locator(`ion-input#${fieldId} input`);
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill(value);
    await expect(input).toHaveValue(value);
    await input.blur();
}

/**
 * Log in with test credentials and wait until the app has entered the tabs shell.
 * Call requireAuthEnv() in beforeAll when using this.
 * Do not require a strict `/tabs/dashboard` URL because Ionic may restore the last selected tab
 * (e.g. Workouts/History) from persisted app state in some environments.
 */
export async function loginAndWaitForDashboard(page: Page): Promise<void> {
    const { email, password } = getAuthCredentials();
    await page.goto('/auth/login');
    await page.locator('ion-input#email').waitFor({ state: 'visible', timeout: 10000 });
    await fillIonInput(page, 'email', email ?? '');
    await fillIonInput(page, 'password', password ?? '');

    const loginButton = page.getByRole('button', { name: 'Login' });
    await loginButton.click();

    const submittedAt = Date.now();
    let retriedLogin = false;
    await expect
        .poll(
            async () => {
                const url = page.url();
                // Ionic tab routes are SPA-driven; WebKit/CI can restore a previously selected tab
                // so avoid relying on the exact `/tabs/dashboard` URL or the Dashboard tab visibility.
                if (/\/tabs/.test(url)) return true;

                // Wait for *any* Ion tab button to appear (tabs shell is ready).
                if ((await page.getByRole('tab').count()) > 0) return true;

                // Ionic signal-forms can miss the first submit if native fill hasn't synced yet.
                if (!retriedLogin && Date.now() - submittedAt > 8000 && /\/auth\/login/.test(url)) {
                    retriedLogin = true;
                    const retryButton = page.getByRole('button', { name: 'Login' });
                    if (await retryButton.isVisible().catch(() => false)) {
                        await retryButton.click({ timeout: 3000 }).catch(() => undefined);
                    }
                }

                return false;
            },
            { timeout: 45000 }
        )
        .toBeTruthy();

    // Ensure at least one tab button is visible before returning.
    await page.getByRole('tab').first().waitFor({ state: 'visible', timeout: 20000 });
}
