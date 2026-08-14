import { verify } from '../../helpers/assertions.helper';
import { game } from '../../pages/board.page';
import { registerAndStart, resetState } from '../../helpers/browser.helper';

describe('Gameplay — Board interactions', () => {
    const everyCell = Array.from({ length: 9 }, (_, index) => index);

    beforeEach(async () => {
        await resetState();
        await registerAndStart();
    });

    it('places X on an empty cell [TEST-23]', async () => {
        await game.tapCell(0);

        verify.equals(await game.readCell(0), 'x');
    });

    it('disables an occupied cell [TEST-24]', async () => {
        await game.makeMove(0);

        // A filled cell is locked out — that's how "no overwrite" is enforced —
        // so asserting the disabled state beats catching a click error.
        await verify.disabled(game.cell(0));
        verify.equals(await game.readCell(0), 'x');
    });

    it('disables all cells while the computer is thinking [TEST-25]', async () => {
        await game.tapCell(0);
        await game.awaitComputerStart();

        for (const index of everyCell) {
            await verify.disabled(game.cell(index));
        }

        await game.awaitComputerDone();
    });
});
