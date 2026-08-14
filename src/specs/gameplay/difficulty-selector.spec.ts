import { verify } from '../../helpers/assertions.helper';
import { game, type Difficulty } from '../../pages/board.page';
import {
    confirmNext,
    dismissNext,
    registerAndStart,
    resetState,
} from '../../helpers/browser.helper';

describe('Gameplay — Difficulty selector', () => {
    beforeEach(async () => {
        await resetState();
        await registerAndStart();
    });

    // Assert nothing is left on the board.
    const assertBoardCleared = async () => {
        const filled = (await game.readBoard()).filter((cell) => cell !== 'empty');
        verify.equals(filled.length, 0);
    };

    // Pick a difficulty and play a move, leaving the board mid-game.
    const startMidGameOn = async (difficulty: Difficulty) => {
        await game.chooseDifficulty(difficulty);
        await game.makeMove(0);
    };

    it('applies a pre-move change immediately [TEST-27]', async () => {
        await game.chooseDifficulty('hard');

        verify.equals(await game.readDifficulty(), 'hard');
        await assertBoardCleared();
        verify.equals(await game.readStatus(), 'your-turn');
    });

    it('clears the board with the new difficulty when a mid-game change is confirmed [TEST-28]', async () => {
        await startMidGameOn('easy');

        await confirmNext();
        await game.chooseDifficulty('medium');

        verify.equals(await game.readDifficulty(), 'medium');
        await assertBoardCleared();
    });

    it('keeps the board and reverts the dropdown when a mid-game change is cancelled [TEST-29]', async () => {
        await startMidGameOn('easy');
        const snapshot = await game.readBoard();

        await dismissNext();
        await game.chooseDifficulty('medium');

        verify.equals(await game.readDifficulty(), 'easy');
        verify.deepEquals(await game.readBoard(), snapshot);
    });

    it('persists a difficulty change to the user record [TEST-30]', async () => {
        await game.chooseDifficulty('medium');

        // Difficulty lives on the account, not the game, so a refresh keeps it
        // even though the half-finished board is discarded.
        await browser.refresh();
        await game.waitReady();

        verify.equals(await game.readDifficulty(), 'medium');
    });

    // The login-side check — the dropdown showing the saved choice after signing
    // back in — needs a full sign-out/sign-in and lives in persistence.spec.ts.
});
