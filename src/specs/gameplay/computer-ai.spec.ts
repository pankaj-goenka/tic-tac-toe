import { game } from '../../pages/board.page';
import { registerAndStart, resetState } from '../../helpers/browser.helper';
import { assertNoCellOverwrite } from '../../helpers/util.helper';

// The difficulties whose move handling is trustworthy (Hard is broken — see docs).
const RULE_ABIDING_LEVELS = ['easy', 'medium'] as const;

describe('Gameplay — Computer opponent', () => {
    beforeEach(async () => {
        await resetState();
        await registerAndStart();
    });

    it('never plays into an occupied cell (easy & medium) [TEST-26]', async () => {
        for (const difficulty of RULE_ABIDING_LEVELS) {
            await game.startNewGame();
            await game.chooseDifficulty(difficulty);
            await assertNoCellOverwrite();
        }
    });
});
