/**
 * Copies the toolbar icon (same as in-app) to assets/icon.png and runs
 * @capacitor/assets to generate Android (and optionally iOS) launcher icons.
 * Run from repo root: npm run cap:icons:tabata-ai
 * Or from apps/tabata-ai: node scripts/generate-app-icon.mjs
 */

import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, '..');
const srcIcon = join(appRoot, 'src', 'assets', 'icon-256.png');
const assetsDir = join(appRoot, 'assets');
const outIcon = join(assetsDir, 'icon.png');

if (!existsSync(srcIcon)) {
    console.error('Source icon not found:', srcIcon);
    console.error('Ensure apps/tabata-ai/src/assets/icon-256.png exists (same as toolbar icon).');
    process.exit(1);
}

mkdirSync(assetsDir, { recursive: true });
copyFileSync(srcIcon, outIcon);
console.log('Copied', srcIcon, '->', outIcon);

const cmd = 'npx @capacitor/assets generate --android --iconBackgroundColor "#3123ae"';
console.log('Running:', cmd);
execSync(cmd, { cwd: appRoot, stdio: 'inherit' });
console.log('Done. Android launcher icon now matches the toolbar icon.');
