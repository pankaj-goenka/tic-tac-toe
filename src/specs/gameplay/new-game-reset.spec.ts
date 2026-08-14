import { verify } from '../../helpers/assertions.helper';
import { game } from '../../pages/board.page';
import { registerAndStart, resetState } from '../../helpers/browser.helper';

describe('Gameplay — New Game and Reset', () => {
    beforeEach(async () => {
        await resetState();
        await registerAndStart();
    });

    // Assert nothing is left on the board.
    const assertBoardCleared = async () => {
        const filled = (await game.readBoard()).filter((cell) => cell !== 'empty');
        verify.equals(filled.length, 0);
    };

    // Both buttons wipe the board back to a fresh state; only the trigger differs.
    const resetPaths = [
        {
            title: 'clears the board and resets status on New Game [TEST-33]',
            difficulty: 'easy',
            clear: () => game.startNewGame(),
        },
        {
            title: 'resets the board like New Game [TEST-34]',
            difficulty: 'medium',
            clear: () => game.resetBoard(),
        },
    ] as const;

    for (const { title, difficulty, clear } of resetPaths) {
        it(title, async () => {
            await game.chooseDifficulty(difficulty);
            await game.makeMove(0);

            await clear();

            await assertBoardCleared();
            verify.equals(await game.readStatus(), 'your-turn');
            verify.equals(await game.readDifficulty(), difficulty);
        });
    }
});
