import { verify } from '../helpers/assertions.helper';
import { profile } from '../pages/profile.page';
import { login } from '../pages/login.page';
import { navBar } from '../pages/sections/navBar.section';
import {
    confirmNext,
    createUser,
    dismissNext,
    registerAndStart,
    resetState,
    userKeys,
} from '../helpers/browser.helper';
import { escapeForRegex, makeUsername } from '../helpers/util.helper';
import { armXssProbe, assertNoXss, XSS_PAYLOADS } from '../helpers/injectionData.helper';

describe('User profile management', () => {
    let currentName: string;

    /** Build a RegExp that matches the given literal greeting name. */
    const greetingFor = (name: string) => new RegExp(escapeForRegex(name));

    beforeEach(async () => {
        await resetState();
        currentName = await registerAndStart();
        await profile.open();
    });

    it('displays the current name, Created date, and zeroed stats [TEST-48]', async () => {
        await verify.value(profile.nameField, currentName);
        await verify.notText(profile.createdField, '');

        const stats = await profile.readStats();
        verify.deepEquals(stats, { wins: 0, losses: 0, draws: 0 });
    });

    it('renames to a new unique name [TEST-49]', async () => {
        const newName = makeUsername('renamed');

        await profile.changeName(newName);

        await verify.visible(profile.successText);
        await verify.text(navBar.userGreeting, greetingFor(newName));

        const keys = await userKeys();
        verify.includes(keys, newName.toLowerCase());
        verify.excludes(keys, currentName.toLowerCase());
    });

    it('renames to its own name in a different case [TEST-50]', async () => {
        const upper = currentName.toUpperCase();

        await profile.changeName(upper);

        await verify.visible(profile.successText);
        await verify.text(navBar.userGreeting, greetingFor(upper));

        const keys = await userKeys();
        verify.hasLength(keys, 1);
        verify.includes(keys, currentName.toLowerCase());
    });

    it('rejects a rename to an existing other user [TEST-51]', async () => {
        const other = makeUsername('other');
        await createUser({ name: other });

        await profile.changeName(other);

        await verify.visible(profile.errorText);
        await verify.text(profile.errorText, /already uses this name/i);
        await verify.text(navBar.userGreeting, greetingFor(currentName));
    });

    it('does not execute injected markup / XSS in a renamed name [TEST-52]', async () => {
        await armXssProbe();

        for (const payload of XSS_PAYLOADS) {
            await profile.changeName(payload);
            await verify.visible(profile.successText);

            await assertNoXss();

            await verify.text(navBar.userGreeting, greetingFor(payload));

            // Move between views to hit other places the name is rendered.
            await navBar.openHistory();
            await profile.open();

            await assertNoXss();
        }
    });

    it('keeps the account on Cancel and removes it on confirmed Delete [TEST-53]', async () => {
        await dismissNext();
        await profile.removeAccount();
        await verify.visible(profile.nameField);

        await confirmNext();
        await profile.removeAccount();

        await login.waitReady();
        await login.signIn(currentName);
        await verify.text(login.errorText, /no account/i);
    });
});
