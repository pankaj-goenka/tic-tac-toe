import { verify } from '../helpers/assertions.helper';
import { game } from '../pages/board.page';
import { header } from '../pages/sections/header.section';
import { history } from '../pages/history.page';
import { profile } from '../pages/profile.page';
import { registerAndStart, resetState } from '../helpers/browser.helper';

describe('Header controls on every view', () => {
    beforeEach(resetState);

    // Both header controls must be rendered on the current view.
    const expectHeaderControls = async () => {
        await verify.visible(header.languageSelect);
        await verify.visible(header.themeToggle);
    };

    it('shows header controls on every authenticated view [TEST-37]', async () => {
        await registerAndStart();
        await expectHeaderControls();

        for (const view of [profile, history, game]) {
            await view.open();
            await expectHeaderControls();
        }
    });
});
