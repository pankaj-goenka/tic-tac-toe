import { verify } from '../../helpers/assertions.helper';
import { login } from '../../pages/login.page';
import { game } from '../../pages/board.page';
import { navBar } from '../../pages/sections/navBar.section';
import { createUser, getStorage, resetState, userKeys } from '../../helpers/browser.helper';
import { escapeForRegex, makeUsername } from '../../helpers/util.helper';
import { armXssProbe, assertNoXss, XSS_PAYLOADS } from '../../helpers/injectionData.helper';

describe('Authentication — Register', () => {
    beforeEach(resetState);

    // Assert the greeting reflects the given (case-preserved) name.
    const expectGreeting = async (name: string) => {
        await verify.text(navBar.userGreeting, new RegExp(escapeForRegex(name)));
    };

    // Assert the inline auth error is visible and matches a message pattern.
    const expectError = async (pattern: RegExp) => {
        await verify.visible(login.errorText);
        await verify.text(login.errorText, pattern);
    };

    // Uniform "bad name is rejected" cases: submit, then assert the error message.
    const rejections: ReadonlyArray<{ title: string; value: string; message: RegExp }> = [
        {
            title: 'rejects a whitespace-only name [TEST-07]',
            value: '   ',
            message: /enter a name/i,
        },
        { title: 'rejects a 1-character name [TEST-08]', value: 'A', message: /at least 2/i },
    ];

    it('registers a new player [TEST-09]', async () => {
        const name = makeUsername();

        await login.signUp(name);

        await game.waitReady();
        await expectGreeting(name);

        verify.includes(await userKeys(), name.toLowerCase());
        verify.equals(await getStorage<string>('session'), name.toLowerCase());
    });

    it('rejects an empty name [TEST-10]', async () => {
        await login.signUp('');

        await expectError(/enter a name/i);
        verify.equals(await login.isShowing(), true);
    });

    for (const { title, value, message } of rejections) {
        it(title, async () => {
            await login.signUp(value);

            await expectError(message);
        });
    }

    it('rejects a duplicate name [TEST-11]', async () => {
        const existing = makeUsername();
        await createUser({ name: existing });

        for (const variant of [existing, existing.toUpperCase(), existing.toLowerCase()]) {
            await login.signUp(variant);
            await expectError(/already taken/i);
        }
    });

    it('renders an injection payload as text, never markup [TEST-12]', async () => {
        for (const payload of XSS_PAYLOADS) {
            await browser.execute(() => window.localStorage.clear());
            await browser.refresh();
            await login.waitReady();
            // Re-arm the probe post-refresh; the reload clears window globals.
            await armXssProbe();

            await login.signUp(payload);
            await game.waitReady();

            await assertNoXss();

            await expectGreeting(payload);
        }
    });
});
