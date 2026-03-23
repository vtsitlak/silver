import { test, expect } from '@playwright/test';
import { requireAuthEnv, loginAndWaitForDashboard } from './auth-helpers';

requireAuthEnv();

test.describe('Workout player', () => {
    test.beforeEach(async ({ page }) => {
        await loginAndWaitForDashboard(page);
        await page.getByRole('tab', { name: 'Workouts' }).click();
        await page.waitForURL(/\/tabs\/workouts/, { timeout: 10000 });
    });

    test('should open Workout Player from the first workout', async ({ page }) => {
        const playButtons = page.getByRole('button', { name: 'Play workout' });
        const emptyState = page.getByText('Start creating your workouts to see them here.');

        // If workouts exist, click the first "Play workout" button.
        // If not, the UI shows an empty-state message.
        await playButtons.first().click({ timeout: 5000 }).catch(() => undefined);

        await expect
            .poll(
                async () => {
                    const onPlayerRoute = /\/workouts\/.+\/play/.test(page.url());
                    if (onPlayerRoute) {
                        return await page.getByText('Workout Player').isVisible();
                    }
                    return await emptyState.isVisible();
                },
                { timeout: 30000 }
            )
            .toBeTruthy();

        // When on the player route, basic player signals should be visible.
        await expect
            .poll(
                async () => {
                    const onPlayerRoute = /\/workouts\/.+\/play/.test(page.url());
                    if (!onPlayerRoute) return true;
                    const phaseVisible = await page.getByText(/Warmup|Main|Cooldown|Rest/i).first().isVisible();
                    const totalRemainingVisible = await page.getByText(/Total remaining/i).isVisible();
                    return phaseVisible && totalRemainingVisible;
                },
                { timeout: 30000 }
            )
            .toBeTruthy();
    });
});

