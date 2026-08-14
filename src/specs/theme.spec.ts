import { verify } from '../helpers/assertions.helper';
import { header } from '../pages/sections/header.section';
import { login } from '../pages/login.page';
import { navBar } from '../pages/sections/navBar.section';
import { registerAndStart, resetState } from '../helpers/browser.helper';

describe('Theme (light / dark) switching', () => {
    beforeEach(resetState);

    /** Assert the document currently advertises the given theme. */
    const expectTheme = async (expected: 'light' | 'dark') => {
        verify.equals(await header.readDocTheme(), expected);
    };

    it('updates the active theme synchronously on toggle [TEST-46]', async () => {
        await login.waitReady();
        await expectTheme('light');
        const labelBefore = await header.readThemeLabel();

        await header.switchTheme();
        await expectTheme('dark');
        // The toggle button's own label tracks the active theme.
        verify.notEquals(await header.readThemeLabel(), labelBefore);

        await header.switchTheme();
        await expectTheme('light');
    });

    it('persists across reload, logout, and user switch [TEST-47]', async () => {
        await registerAndStart();
        await header.switchTheme();
        await expectTheme('dark');

        // A hard reload must not lose the chosen theme.
        await browser.refresh();
        await expectTheme('dark');

        // Signing out drops the session but keeps the global preference.
        await navBar.signOut();
        await login.waitReady();
        await expectTheme('dark');

        // A brand-new user still inherits the persisted theme.
        await registerAndStart();
        await expectTheme('dark');
    });
});
