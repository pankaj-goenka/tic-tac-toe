/**
 * Prettier configuration (ESM). Mirrors the previous `.prettierrc.json` exactly —
 * same options, expressed as a module.
 *
 * @type {import('prettier').Config}
 */
export default {
    semi: true,
    singleQuote: true,
    trailingComma: 'all',
    arrowParens: 'always',
    printWidth: 100,
    tabWidth: 4,
    useTabs: false,
    endOfLine: 'lf',
};
