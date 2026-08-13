import { verify } from '../helpers/assertions.helper';
import { login } from '../pages/login.page';
import { game } from '../pages/board.page';
import { profile } from '../pages/profile.page';
import { history } from '../pages/history.page';
import { navBar } from '../pages/sections/navBar.section';
import { header } from '../pages/sections/header.section';
import { getStorage, registerAndStart, resetState, userKeys } from '../helpers/browser.helper';
import { escapeForRegex, playLosingGame, playToEnd, playWinningGame } from '../helpers/util.helper';

describe('End-to-end flows', () => {
    beforeEach(resetState);

    it('registers, wins on Easy, loses on Medium, reviews history, logs out [E2E-01]', async () => {
        const name = await registerAndStart();

        await playWinningGame('easy');
        verify.equals(await game.readStatus(), 'human');

        await game.startNewGame();
        await playLosingGame('medium');
        verify.equals(await game.readStatus(), 'computer');

        await history.open();
        verify.equals(await history.countRows(), 2);

        const newest = await history.readRow(0);
        const older = await history.readRow(1);
        verify.matches(newest.result, /loss/i);
        verify.matches(newest.difficulty, /medium/i);
        verify.matches(older.result, /win/i);
        verify.matches(older.difficulty, /easy/i);

        await profile.open();
        const stats = await profile.readStats();
        verify.deepEquals(stats, { wins: 1, losses: 1, draws: 0 });
        await verify.value(profile.nameField, name);

        await navBar.signOut();
        await login.waitReady();
        verify.equals(await login.isShowing(), true);
        verify.isNull(await getStorage<string>('session'));
        verify.includes(await userKeys(), name.toLowerCase());
    });

    it('persists preferences and account across a logout [E2E-02]', async () => {
        const name = await registerAndStart();

        await header.switchTheme();
        await header.chooseLanguage('fa');
        await game.chooseDifficulty('medium');

        await playToEnd();

        await navBar.signOut();
        await login.waitReady();
        verify.equals(await header.readDocTheme(), 'dark');
        verify.equals(await header.readDocLang(), 'fa');

        await login.signIn(name);
        await game.waitReady();

        verify.equals(await game.readDifficulty(), 'medium');
        await verify.text(navBar.userGreeting, new RegExp(escapeForRegex(name)));

        await history.open();
        verify.equals(await history.countRows(), 1);

        await profile.open();
        const stats = await profile.readStats();
        verify.equals(stats.wins + stats.losses + stats.draws, 1);
    });
});
