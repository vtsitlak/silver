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
                primary: 'rgb(var(--color-primary) / <alpha-value>)',
                'primary-dark': 'rgb(var(--color-primary-dark) / <alpha-value>)',
                secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
                'secondary-dark': 'rgb(var(--color-secondary-dark) / <alpha-value>)',
                error: 'rgb(var(--color-error) / <alpha-value>)',
            }
        }
    },
    plugins: []
};
