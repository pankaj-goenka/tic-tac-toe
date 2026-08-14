import { verify } from '../../helpers/assertions.helper';
import { game } from '../../pages/board.page';
import { registerAndStart, resetState } from '../../helpers/browser.helper';

describe('Gameplay — Status pill', () => {
    beforeEach(async () => {
        await resetState();
        await registerAndStart();
    });

    // Play one human move and let the computer's turn come and go.
    const playRound = async (cell: number) => {
        await game.tapCell(cell);
        await game.awaitComputerStart();
        await game.awaitComputerDone();
    };

    it('starts on "Your turn (X)" [TEST-35]', async () => {
        verify.equals(await game.readStatus(), 'your-turn');
        await verify.text(game.status, /your turn/i);
    });

    it('transitions human → computer-thinking → human [TEST-36]', async () => {
        await playRound(0);

        verify.equals(await game.readStatus(), 'your-turn');
    });
});
