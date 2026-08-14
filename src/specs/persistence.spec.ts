import { verify } from '../helpers/assertions.helper';
import { game } from '../pages/board.page';
import { header } from '../pages/sections/header.section';
import { login } from '../pages/login.page';
import { navBar } from '../pages/sections/navBar.section';
import { getStorage, registerAndStart, resetState, userKeys } from '../helpers/browser.helper';

describe('State persistence across reload / session', () => {
    beforeEach(resetState);

    it('lands on Play view after reload regardless of prior view [TEST-42]', async () => {
        await registerAndStart();
        await navBar.openHistory();

        await browser.refresh();

        await game.waitReady();
        verify.equals(await game.isShowing(), true);
    });

    it('drops the in-progress game board on reload [TEST-43]', async () => {
        await registerAndStart();
        await game.makeMove(0);

        const boardBefore = await game.readBoard();
        verify.equals(
            boardBefore.some((cell) => cell === 'x'),
            true,
        );

        await browser.refresh();
        await game.waitReady();

        const boardAfter = await game.readBoard();
        verify.equals(
            boardAfter.every((cell) => cell === 'empty'),
            true,
        );
        verify.equals(await game.readStatus(), 'your-turn');
    });

    it('keeps difficulty on the user record across re-login [TEST-44]', async () => {
        const name = await registerAndStart();
        await game.chooseDifficulty('hard');
        verify.equals(await game.readDifficulty(), 'hard');

        await navBar.signOut();
        await login.waitReady();
        await login.signIn(name);
        await game.waitReady();

        verify.equals(await game.readDifficulty(), 'hard');
    });

    it('keeps theme, language, session, and users across reload [TEST-45]', async () => {
        const name = await registerAndStart();
        const handle = name.toLowerCase();
        await header.switchTheme();
        await header.chooseLanguage('fa');

        await browser.refresh();
        await game.waitReady();

        verify.equals(await header.readDocTheme(), 'dark');
        verify.equals(await header.readDocLang(), 'fa');
        verify.equals(await getStorage<string>('session'), handle);

        verify.includes(await userKeys(), handle);
    });
});
