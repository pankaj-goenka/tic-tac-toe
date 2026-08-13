import { verify } from '../helpers/assertions.helper';
import { game } from '../pages/board.page';
import { confirmNext, dismissNext, registerAndStart, resetState } from '../helpers/browser.helper';
import { assertNoCellOverwrite } from '../helpers/util.helper';

describe('Game Play', () => {
    beforeEach(async () => {
        await resetState();
        await registerAndStart();
    });

    describe('Status pill', () => {
        it('starts on "Your turn (X)" [TC-STAT-01]', async () => {
            verify.equals(await game.readStatus(), 'your-turn');
            await verify.text(game.status, /your turn/i);
        });

        it('transitions human → computer-thinking → human [TC-STAT-02]', async () => {
            await game.tapCell(0);
            await game.awaitComputerStart();
            await game.awaitComputerDone();

            verify.equals(await game.readStatus(), 'your-turn');
        });
    });

    describe('Board', () => {
        it('places X on an empty cell [TC-BRD-01]', async () => {
            await game.tapCell(0);
            verify.equals(await game.readCell(0), 'x');
        });

        it('disables an occupied cell [TC-BRD-02]', async () => {
            await game.makeMove(0);

            // No-overwrite is enforced by disabling filled cells. Checking the
            // disabled state directly is cleaner than catching a click error and
            // diffing board snapshots.
            await verify.disabled(game.cell(0));
            verify.equals(await game.readCell(0), 'x');
        });

        it('disables all cells while the computer is thinking [TC-BRD-03]', async () => {
            await game.tapCell(0);
            await game.awaitComputerStart();

            for (let i = 0; i < 9; i++) {
                await verify.disabled(game.cell(i));
            }
            await game.awaitComputerDone();
        });
    });

    describe('Computer AI', () => {
        it('never plays into an occupied cell (easy & medium) [TC-AI-01]', async () => {
            for (const difficulty of ['easy', 'medium'] as const) {
                await game.startNewGame();
                await game.chooseDifficulty(difficulty);
                await assertNoCellOverwrite();
            }
        });
    });

    describe('Hint', () => {
        it('is disabled while the computer is thinking [TC-HNT-01]', async () => {
            await game.tapCell(0);
            await game.awaitComputerStart();
            await verify.disabled(game.hintBtn);
            await game.awaitComputerDone();
        });

        it('is enabled on the human turn during an active game [TC-HNT-02]', async () => {
            await verify.enabled(game.hintBtn);
        });
    });

    describe('New Game / Reset', () => {
        it('clears the board and resets status on New Game [TC-NEW-01]', async () => {
            await game.chooseDifficulty('easy');
            await game.makeMove(0);

            await game.startNewGame();

            const board = await game.readBoard();
            verify.equals(
                board.every((c) => c === 'empty'),
                true,
            );
            verify.equals(await game.readStatus(), 'your-turn');
            verify.equals(await game.readDifficulty(), 'easy');
        });

        it('resets the board like New Game [TC-RST-01]', async () => {
            await game.chooseDifficulty('medium');
            await game.makeMove(0);

            await game.resetBoard();

            const board = await game.readBoard();
            verify.equals(
                board.every((c) => c === 'empty'),
                true,
            );
            verify.equals(await game.readStatus(), 'your-turn');
            verify.equals(await game.readDifficulty(), 'medium');
        });
    });

    describe('Difficulty selector', () => {
        it('applies a pre-move change immediately [TC-DIF-01]', async () => {
            await game.chooseDifficulty('hard');
            verify.equals(await game.readDifficulty(), 'hard');

            const board = await game.readBoard();
            verify.equals(
                board.every((c) => c === 'empty'),
                true,
            );
            verify.equals(await game.readStatus(), 'your-turn');
        });

        it('clears the board with the new difficulty when a mid-game change is confirmed [TC-DIF-02]', async () => {
            await game.chooseDifficulty('easy');
            await game.makeMove(0);

            await confirmNext();
            await game.chooseDifficulty('medium');

            verify.equals(await game.readDifficulty(), 'medium');
            const board = await game.readBoard();
            verify.equals(
                board.every((c) => c === 'empty'),
                true,
            );
        });

        it('keeps the board and reverts the dropdown when a mid-game change is cancelled [TC-DIF-03]', async () => {
            await game.chooseDifficulty('easy');
            await game.makeMove(0);
            const before = await game.readBoard();

            await dismissNext();
            await game.chooseDifficulty('medium');

            verify.equals(await game.readDifficulty(), 'easy');
            verify.deepEquals(await game.readBoard(), before);
        });

        it('persists a difficulty change to the user record [TC-DIF-04]', async () => {
            await game.chooseDifficulty('medium');

            // Difficulty lives on the account rather than the current game, so a refresh keeps it even though the half-finished board is discarded.
            await browser.refresh();
            await game.waitReady();

            verify.equals(await game.readDifficulty(), 'medium');
        });

        // TC-DIF-01's login-side check — the dropdown showing the saved choice after
        // signing back in — needs a full sign-out/sign-in and lives in persistence.spec.ts.
    });
});
