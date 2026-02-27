export default {
    displayName: 'auth',
    preset: '../../../jest.preset.js',
    setupFiles: ['<rootDir>/src/jest-global-setup.ts'],
    setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
    coverageDirectory: '../../../coverage/libs/tabata/auth',
    moduleNameMapper: {
        '^@silver/shared/helpers$': '<rootDir>/src/__mocks__/shared-helpers.ts'
    },
    transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$|(@ionic|@stencil|ionicons)/)'],
    transform: {
        '^.+\\.(ts|mjs|js|html)$': [
            'jest-preset-angular',
            {
                tsconfig: '<rootDir>/tsconfig.spec.json',
                stringifyContentPathRegex: '\\.(html|svg)$'
            }
        ]
    },
    snapshotSerializers: [
        'jest-preset-angular/build/serializers/no-ng-attributes',
        'jest-preset-angular/build/serializers/ng-snapshot',
        'jest-preset-angular/build/serializers/html-comment'
    ]
};
