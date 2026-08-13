import { verify } from '../helpers/assertions.helper';
import { history } from '../pages/history.page';
import { game } from '../pages/board.page';
import { navBar } from '../pages/sections/navBar.section';
import { profile } from '../pages/profile.page';
import { login } from '../pages/login.page';
import { confirmNext, dismissNext, registerAndStart, resetState } from '../helpers/browser.helper';
import { makeUsername, playGame } from '../helpers/util.helper';

describe('History', () => {
    beforeEach(async () => {
        await resetState();
        await registerAndStart();
    });

    it('shows the empty state for a fresh user [TC-HIS-01]', async () => {
        await history.open();

        verify.equals(await history.hasNoRows(), true);
        verify.equals(await history.countRows(), 0);
        await verify.hidden(history.clearBtn);
    });

    it('appends one row when a game finishes [TC-HIS-02]', async () => {
        await playGame('easy');

        await history.open();

        verify.equals(await history.countRows(), 1);
    });

    it('does not duplicate the previous entry on New Game [TC-HIS-03]', async () => {
        await playGame('easy');

        await game.startNewGame();

        await history.open();
        verify.equals(await history.countRows(), 1);
    });

    it('records nothing when Reset is used before game-end [TC-HIS-04]', async () => {
        await game.makeMove(0);
        await game.resetBoard();

        await history.open();
        verify.equals(await history.countRows(), 0);
        verify.equals(await history.hasNoRows(), true);
    });

    it('reflects actual game data in the row columns [TC-HIS-05]', async () => {
        await playGame('medium');
        const finalStatus = await game.readStatus();

        await history.open();

        const row = await history.readRow(0);
        verify.matches(row.difficulty, /medium/i);

        const expectedResult =
            finalStatus === 'human' ? /win/i : finalStatus === 'computer' ? /loss/i : /draw/i;
        verify.matches(row.result, expectedResult);

        // Date formatting tracks the active locale, so this only confirms a value was rendered; exact formats live in the localization spec.
        verify.greaterThan(row.date.trim().length, 0);
    });

    it('lists the newest entry first [TC-HIS-06]', async () => {
        await playGame('easy');

        await game.startNewGame();
        await playGame('hard');

        await history.open();

        verify.equals(await history.countRows(), 2);
        const first = await history.readRow(0);
        const second = await history.readRow(1);
        verify.matches(first.difficulty, /hard/i);
        verify.matches(second.difficulty, /easy/i);
    });

    it('keeps entries on Cancel and clears them on OK [TC-HIS-07]', async () => {
        await playGame('easy');
        await history.open();
        verify.equals(await history.countRows(), 1);

        await dismissNext();
        await history.clearAll();
        verify.equals(await history.countRows(), 1);

        await confirmNext();
        await history.clearAll();
        verify.equals(await history.hasNoRows(), true);
        verify.equals(await history.countRows(), 0);
    });

    it("preserves another user's history and profile when one user clears theirs [TC-HIS-11]", async () => {
        const alice = makeUsername('alice');
        const bob = makeUsername('bob');

        await navBar.signOut();
        await registerAndStart(alice);
        await playGame('easy');
        await profile.open();
        const aliceStats = await profile.readStats();
        verify.equals(aliceStats.wins + aliceStats.losses + aliceStats.draws, 1);

        await navBar.signOut();
        await registerAndStart(bob);
        await playGame('easy');
        await history.open();
        verify.equals(await history.countRows(), 1);

        await confirmNext();
        await history.clearAll();
        verify.equals(await history.hasNoRows(), true);

        await profile.open();
        verify.deepEquals(await profile.readStats(), { wins: 0, losses: 0, draws: 0 });

        await navBar.signOut();
        await login.waitReady();
        await login.signIn(alice);
        await game.waitReady();

        await history.open();
        verify.equals(await history.countRows(), 1);

        await profile.open();
        verify.deepEquals(await profile.readStats(), aliceStats);
    });
});
