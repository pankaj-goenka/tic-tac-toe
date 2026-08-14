import { verify } from '../helpers/assertions.helper';
import { history } from '../pages/history.page';
import { game, type Difficulty } from '../pages/board.page';
import { navBar } from '../pages/sections/navBar.section';
import { profile } from '../pages/profile.page';
import { login } from '../pages/login.page';
import { confirmNext, dismissNext, registerAndStart, resetState } from '../helpers/browser.helper';
import { makeUsername, playGame } from '../helpers/util.helper';

describe('Game history table', () => {
    /** Finish a game on the given difficulty, then land on the History view. */
    const playThenOpenHistory = async (difficulty: Difficulty) => {
        await playGame(difficulty);
        await history.open();
    };

    /** Assert the History view is currently in its empty state. */
    const expectEmptyHistory = async () => {
        verify.equals(await history.hasNoRows(), true);
        verify.equals(await history.countRows(), 0);
    };

    beforeEach(async () => {
        await resetState();
        await registerAndStart();
    });

    it('shows the empty state for a fresh user [TEST-15]', async () => {
        await history.open();

        await expectEmptyHistory();
        await verify.hidden(history.clearBtn);
    });

    it('records nothing when Reset is used before game-end [TEST-16]', async () => {
        await game.makeMove(0);
        await game.resetBoard();

        await history.open();
        await expectEmptyHistory();
    });

    it('appends one row when a game finishes [TEST-17]', async () => {
        await playThenOpenHistory('easy');

        verify.equals(await history.countRows(), 1);
    });

    it('does not duplicate the previous entry on New Game [TEST-18]', async () => {
        await playGame('easy');

        await game.startNewGame();

        await history.open();
        verify.equals(await history.countRows(), 1);
    });

    it('reflects actual game data in the row columns [TEST-19]', async () => {
        await playGame('medium');
        const finalStatus = await game.readStatus();

        await history.open();

        const { difficulty, result, date } = await history.readRow(0);
        verify.matches(difficulty, /medium/i);

        const expectedResult =
            finalStatus === 'human' ? /win/i : finalStatus === 'computer' ? /loss/i : /draw/i;
        verify.matches(result, expectedResult);

        // Date formatting tracks the active locale, so this only confirms a value was rendered; exact formats live in the localization spec.
        verify.greaterThan(date.trim().length, 0);
    });

    it('lists the newest entry first [TEST-20]', async () => {
        await playGame('easy');

        await game.startNewGame();
        await playGame('hard');

        await history.open();

        verify.equals(await history.countRows(), 2);
        const [newest, oldest] = [await history.readRow(0), await history.readRow(1)];
        verify.matches(newest.difficulty, /hard/i);
        verify.matches(oldest.difficulty, /easy/i);
    });

    it('keeps entries on Cancel and clears them on OK [TEST-21]', async () => {
        await playThenOpenHistory('easy');
        verify.equals(await history.countRows(), 1);

        await dismissNext();
        await history.clearAll();
        verify.equals(await history.countRows(), 1);

        await confirmNext();
        await history.clearAll();
        await expectEmptyHistory();
    });

    it("preserves another user's history and profile when one user clears theirs [TEST-22]", async () => {
        const [alice, bob] = [makeUsername('alice'), makeUsername('bob')];

        await navBar.signOut();
        await registerAndStart(alice);
        await playGame('easy');
        await profile.open();
        const aliceStats = await profile.readStats();
        verify.equals(aliceStats.wins + aliceStats.losses + aliceStats.draws, 1);

        await navBar.signOut();
        await registerAndStart(bob);
        await playThenOpenHistory('easy');
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
