import { verify } from '../helpers/assertions.helper';
import { login } from '../pages/login.page';
import { navBar } from '../pages/sections/navBar.section';
import { header } from '../pages/sections/header.section';
import { registerAndStart, resetState } from '../helpers/browser.helper';

describe('Theme', () => {
    beforeEach(resetState);

    it('updates the active theme synchronously on toggle [TC-THM-01]', async () => {
        await login.waitReady();
        verify.equals(await header.readDocTheme(), 'light');

        await header.switchTheme();
        verify.equals(await header.readDocTheme(), 'dark');

        await header.switchTheme();
        verify.equals(await header.readDocTheme(), 'light');
    });

    it('persists across reload, logout, and user switch [TC-THM-02]', async () => {
        await registerAndStart();
        await header.switchTheme();
        verify.equals(await header.readDocTheme(), 'dark');

        await browser.refresh();
        verify.equals(await header.readDocTheme(), 'dark');

        await navBar.signOut();
        await login.waitReady();
        verify.equals(await header.readDocTheme(), 'dark');

        await registerAndStart();
        verify.equals(await header.readDocTheme(), 'dark');
    });
});
