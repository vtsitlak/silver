export default {
    displayName: 'workouts-editor',
    preset: '../../../jest.preset.js',
    setupFiles: ['<rootDir>/src/jest-global-setup.ts'],
    setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
    coverageDirectory: '../../../coverage/libs/tabata/workouts-editor',
    moduleNameMapper: {
        '^@silver/shared/helpers$': '<rootDir>/../utils/src/testing/shared-helpers.mock.ts'
    },
    transform: {
        '^.+\\.(ts|mjs|js|html)$': [
            'jest-preset-angular',
            {
                tsconfig: '<rootDir>/tsconfig.spec.json',
                stringifyContentPathRegex: '\\.(html|svg)$'
            }
        ]
    },
    transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$|(@ionic|@stencil|ionicons)/)'],
    snapshotSerializers: [
        'jest-preset-angular/build/serializers/no-ng-attributes',
        'jest-preset-angular/build/serializers/ng-snapshot',
        'jest-preset-angular/build/serializers/html-comment'
    ]
};
