import { verify } from '../../helpers/assertions.helper';
import { login } from '../../pages/login.page';
import { game } from '../../pages/board.page';
import { navBar } from '../../pages/sections/navBar.section';
import {
    createUser,
    getStorage,
    registerAndStart,
    resetState,
    userKeys,
} from '../../helpers/browser.helper';
import { escapeForRegex, makeUsername } from '../../helpers/util.helper';

describe('Authentication — Sign in', () => {
    beforeEach(resetState);

    const expectGreeting = async (name: string) => {
        await verify.text(navBar.userGreeting, new RegExp(escapeForRegex(name)));
    };

    const expectError = async (pattern: RegExp) => {
        await verify.visible(login.errorText);
        await verify.text(login.errorText, pattern);
    };

    it('logs in with an existing name [TEST-01]', async () => {
        const name = makeUsername();
        await createUser({ name });

        await login.signIn(name);

        await game.waitReady();
        await expectGreeting(name);
    });

    it('matches login case-insensitively, keeping stored casing [TEST-02]', async () => {
        const name = makeUsername('sara');
        await createUser({ name });

        await login.signIn(name.toUpperCase());
        await game.waitReady();

        await expectGreeting(name);
        verify.hasLength(await userKeys(), 1);
    });

    it('rejects a non-existent name [TEST-03]', async () => {
        await login.signIn(makeUsername('ghost'));

        await expectError(/no account/i);
        verify.equals(await login.isShowing(), true);
    });

    it('rejects an empty / whitespace name [TEST-04]', async () => {
        await login.signIn('   ');

        await expectError(/enter a name/i);
    });

    it('logs out and back in without duplicating the account [TEST-05]', async () => {
        const name = await registerAndStart();

        await navBar.signOut();
        await login.waitReady();
        verify.isNull(await getStorage('session'));

        await login.signIn(name);

        await game.waitReady();
        await expectGreeting(name);

        verify.notNull(await getStorage('session'));
        verify.hasLength(await userKeys(), 1);
    });
});
