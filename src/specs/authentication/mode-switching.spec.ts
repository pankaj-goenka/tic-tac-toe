import { verify } from '../../helpers/assertions.helper';
import { login } from '../../pages/login.page';
import { resetState } from '../../helpers/browser.helper';

describe('Authentication — Mode switching', () => {
    beforeEach(resetState);

    it('clears the error when switching auth mode [TEST-06]', async () => {
        await login.signUp('');
        await verify.visible(login.errorText);

        await login.switchToMode('login');
        await verify.hidden(login.errorText);
    });
});
