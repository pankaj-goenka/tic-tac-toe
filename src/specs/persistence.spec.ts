import { verify } from '../helpers/assertions.helper';
import { login } from '../pages/login.page';
import { game } from '../pages/board.page';
import { navBar } from '../pages/sections/navBar.section';
import { header } from '../pages/sections/header.section';
import { getStorage, registerAndStart, resetState, userKeys } from '../helpers/browser.helper';

describe('Persistence', () => {
    beforeEach(resetState);

    it('keeps theme, language, session, and users across reload [TC-PRS-01]', async () => {
        const name = await registerAndStart();
        await header.switchTheme();
        await header.chooseLanguage('fa');

        await browser.refresh();
        await game.waitReady();

        verify.equals(await header.readDocTheme(), 'dark');
        verify.equals(await header.readDocLang(), 'fa');
        verify.equals(await getStorage<string>('session'), name.toLowerCase());

        verify.includes(await userKeys(), name.toLowerCase());
    });

    it('drops the in-progress game board on reload [TC-PRS-02]', async () => {
        await registerAndStart();
        await game.makeMove(0);

        const boardBefore = await game.readBoard();
        verify.equals(
            boardBefore.some((c) => c === 'x'),
            true,
        );

        await browser.refresh();
        await game.waitReady();

        const boardAfter = await game.readBoard();
        verify.equals(
            boardAfter.every((c) => c === 'empty'),
            true,
        );
        verify.equals(await game.readStatus(), 'your-turn');
    });

    it('lands on Play view after reload regardless of prior view [TC-PRS-03]', async () => {
        await registerAndStart();
        await navBar.openHistory();

        await browser.refresh();

        await game.waitReady();
        verify.equals(await game.isShowing(), true);
    });

    it('keeps difficulty on the user record across re-login [TC-DIF-01 / TC-PRS-04]', async () => {
        const name = await registerAndStart();
        await game.chooseDifficulty('hard');
        verify.equals(await game.readDifficulty(), 'hard');

        await navBar.signOut();
        await login.waitReady();
        await login.signIn(name);
        await game.waitReady();

        verify.equals(await game.readDifficulty(), 'hard');
    });
});
