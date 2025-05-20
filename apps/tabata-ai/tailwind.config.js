const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');

module.exports = {
    content: [join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'), ...createGlobPatternsForDependencies(__dirname)],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', 'Roboto', 'sans-serif'],
            },
            backgroundImage: {
                logo: "url('assets/logo-background.png')"
            },
            colors: {
                primary: 'var(--color-primary)',
                'primary-dark': 'var(--color-primary-dark)',
                secondary: 'var(--color-secondary)',
                'secondary-dark': 'var(--color-secondary-dark)',
                error: 'var(--color-error)',
            }
        }
    },
    plugins: []
};
