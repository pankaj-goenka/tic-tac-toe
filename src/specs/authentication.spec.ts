import { verify } from '../helpers/assertions.helper';
import { login } from '../pages/login.page';
import { game } from '../pages/board.page';
import { navBar } from '../pages/sections/navBar.section';
import {
    createUser,
    getStorage,
    registerAndStart,
    resetState,
    userKeys,
} from '../helpers/browser.helper';
import { escapeForRegex, makeUsername } from '../helpers/util.helper';
import { armXssProbe, assertNoXss, XSS_PAYLOADS } from '../helpers/injectionData.helper';

describe('Authentication', () => {
    beforeEach(resetState);

    describe('Register', () => {
        it('registers a new player [TC-REG-01]', async () => {
            const name = makeUsername();

            await login.signUp(name);

            await game.waitReady();
            await verify.text(navBar.userGreeting, new RegExp(escapeForRegex(name)));

            verify.includes(await userKeys(), name.toLowerCase());
            verify.equals(await getStorage<string>('session'), name.toLowerCase());
        });

        it('rejects an empty name [TC-REG-02]', async () => {
            await login.signUp('');

            await verify.visible(login.errorText);
            await verify.text(login.errorText, /enter a name/i);
            verify.equals(await login.isShowing(), true);
        });

        it('rejects a whitespace-only name [TC-REG-03]', async () => {
            await login.signUp('   ');

            await verify.visible(login.errorText);
            await verify.text(login.errorText, /enter a name/i);
        });

        it('rejects a 1-character name [TC-REG-04]', async () => {
            await login.signUp('A');

            await verify.visible(login.errorText);
            await verify.text(login.errorText, /at least 2/i);
        });

        it('rejects a duplicate name [TC-REG-05]', async () => {
            const existing = makeUsername();
            await createUser({ name: existing });

            for (const variant of [existing, existing.toUpperCase(), existing.toLowerCase()]) {
                await login.signUp(variant);
                await verify.visible(login.errorText);
                await verify.text(login.errorText, /already taken/i);
            }
        });

        it('renders an injection payload as text, never markup [TC-REG-06]', async () => {
            for (const payload of XSS_PAYLOADS) {
                await browser.execute(() => window.localStorage.clear());
                await browser.refresh();
                await login.waitReady();
                // Re-arm the probe post-refresh; the reload clears window globals.
                await armXssProbe();

                await login.signUp(payload);
                await game.waitReady();

                await assertNoXss();

                await verify.text(navBar.userGreeting, new RegExp(escapeForRegex(payload)));
            }
        });
    });

    describe('Login', () => {
        it('logs in with an existing name [TC-LGN-01]', async () => {
            const name = makeUsername();
            await createUser({ name });

            await login.signIn(name);

            await game.waitReady();
            await verify.text(navBar.userGreeting, new RegExp(escapeForRegex(name)));
        });

        it('matches login case-insensitively, keeping stored casing [TC-LGN-02]', async () => {
            const name = makeUsername('sara');
            await createUser({ name });

            await login.signIn(name.toUpperCase());
            await game.waitReady();

            await verify.text(navBar.userGreeting, new RegExp(escapeForRegex(name)));
            verify.hasLength(await userKeys(), 1);
        });

        it('rejects a non-existent name [TC-LGN-03]', async () => {
            await login.signIn(makeUsername('ghost'));

            await verify.visible(login.errorText);
            await verify.text(login.errorText, /no account/i);
            verify.equals(await login.isShowing(), true);
        });

        it('rejects an empty / whitespace name [TC-LGN-04]', async () => {
            await login.signIn('   ');

            await verify.visible(login.errorText);
            await verify.text(login.errorText, /enter a name/i);
        });

        it('logs out and back in without duplicating the account [TC-LGN-06]', async () => {
            const name = await registerAndStart();

            await navBar.signOut();
            await login.waitReady();
            verify.isNull(await getStorage('session'));

            await login.signIn(name);

            await game.waitReady();
            await verify.text(navBar.userGreeting, new RegExp(escapeForRegex(name)));

            verify.notNull(await getStorage('session'));
            verify.hasLength(await userKeys(), 1);
        });
    });

    describe('Mode switching', () => {
        it('clears the error when switching auth mode [TC-MOD-01]', async () => {
            await login.signUp('');
            await verify.visible(login.errorText);

            await login.switchToMode('login');
            await verify.hidden(login.errorText);
        });
    });
});
