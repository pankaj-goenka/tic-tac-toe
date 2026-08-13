import { cpus } from 'node:os';

const env = process.env;
const headless = env.HEADED !== '1';

// Chrome flags: shared set, plus the headless trio unless HEADED=1 is set.
const chromeArgs = [
    '--window-size=1280,900',
    '--disable-features=PushMessaging,GCM', // silence GCM PHONE_REGISTRATION_ERROR noise
    ...(headless ? ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage'] : []),
];

const capabilities: WebdriverIO.Capabilities[] = [
    {
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: chromeArgs,
            ...(env.CHROME_BIN ? { binary: env.CHROME_BIN } : {}),
        },
        ...(env.CHROMEDRIVER_BIN
            ? { 'wdio:chromedriverOptions': { binary: env.CHROMEDRIVER_BIN } }
            : {}),
    },
];

// (CPU cores − 1), capped at 4 and floored at 1; overridable via WDIO_MAX_INSTANCES.
const requestedWorkers = Number(env.WDIO_MAX_INSTANCES);
const maxInstances =
    Number.isInteger(requestedWorkers) && requestedWorkers > 0
        ? requestedWorkers
        : Math.min(4, Math.max(1, cpus().length - 1));

export const config: WebdriverIO.Config = {
    runner: 'local',
    framework: 'mocha',

    specs: ['./src/specs/**/*.spec.ts'],
    maxInstances,
    capabilities,

    baseUrl: env.WDIO_BASE_URL ?? 'http://localhost:8080',
    logLevel: 'warn',
    waitforTimeout: 10_000,
    connectionRetryTimeout: 120_000,
    connectionRetryCount: 3,
    specFileRetries: env.CI ? 2 : 0,
    specFileRetriesDeferred: true,

    mochaOpts: {
        ui: 'bdd',
        timeout: 60_000,
    },
    reporters: [
        'spec',
        [
            'allure',
            {
                outputDir: 'allure-results',
                disableWebdriverStepsReporting: true,
                disableWebdriverScreenshotsReporting: false,
            },
        ],
    ],
};
