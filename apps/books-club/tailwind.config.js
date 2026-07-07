const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'), ...createGlobPatternsForDependencies(__dirname)],
    theme: {
        extend: {}
    },
    plugins: [require('daisyui')],
    daisyui: {
        themes: [
            {
                light: {
                    'color-scheme': 'dark',
                    primary: 'oklch(60% 0.118 184.704)',
                    'primary-content': 'oklch(98% 0.014 180.72)',
                    secondary: 'oklch(62% 0.194 149.214)',
                    'secondary-content': 'oklch(98% 0.018 155.826)',
                    accent: 'oklch(44% 0.03 256.802)',
                    'accent-content': 'oklch(98% 0.002 247.839)',
                    neutral: 'oklch(21% 0.006 285.885)',
                    'neutral-content': 'oklch(98% 0 0)',
                    'base-100': 'oklch(14% 0.005 285.823)',
                    'base-200': 'oklch(21% 0.006 285.885)',
                    'base-300': 'oklch(27% 0.006 286.033)',
                    'base-content': 'oklch(96% 0.001 286.375)',
                    info: 'oklch(71% 0.143 215.221)',
                    'info-content': 'oklch(98% 0.019 200.873)',
                    success: 'oklch(69% 0.17 162.48)',
                    'success-content': 'oklch(97% 0.021 166.113)',
                    warning: 'oklch(76% 0.188 70.08)',
                    'warning-content': 'oklch(98% 0.022 95.277)',
                    error: 'oklch(63% 0.237 25.331)',
                    'error-content': 'oklch(97% 0.013 17.38)',
                    '--rounded-box': '0.25rem',
                    '--rounded-btn': '0.5rem',
                    '--rounded-badge': '2rem',
                    '--border-btn': '1.5px'
                }
            },
            'dark'
        ]
    }
};
