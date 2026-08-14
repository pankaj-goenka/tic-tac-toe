import { verify } from '../../helpers/assertions.helper';
import { game } from '../../pages/board.page';
import { registerAndStart, resetState } from '../../helpers/browser.helper';

// Sign a new player in on a fresh board.
const startFreshGame = async () => {
    await resetState();
    await registerAndStart();
};

describe('Gameplay — Hint button', () => {
    beforeEach(startFreshGame);

    it('is disabled while the computer is thinking [TEST-31]', async () => {
        await game.tapCell(0);
        await game.awaitComputerStart();

        await verify.disabled(game.hintBtn);

        await game.awaitComputerDone();
    });

    it('is enabled on the human turn during an active game [TEST-32]', async () => {
        await verify.enabled(game.hintBtn);
    });
});
