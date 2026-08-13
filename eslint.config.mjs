import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierCompat from 'eslint-config-prettier';

// Ambient globals injected at runtime by WDIO + Mocha (typed via @wdio/globals/types).
const runtimeGlobals = Object.fromEntries(
    [
        'browser',
        '$',
        '$$',
        'expect',
        'describe',
        'it',
        'before',
        'beforeEach',
        'after',
        'afterEach',
    ].map((name) => [name, 'readonly']),
);

export default [
    {
        ignores: [
            'node_modules/**',
            'app/**', // SUT — not ours to lint
            'allure-report/**',
            'allure-results/**',
            '.idea/**',
            '.claude/**',
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    prettierCompat,
    {
        files: ['src/**/*.ts', 'wdio.conf.ts'],
        languageOptions: { globals: runtimeGlobals },
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
        },
    },
];
