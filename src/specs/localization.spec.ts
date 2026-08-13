import { verify } from '../helpers/assertions.helper';
import { login } from '../pages/login.page';
import { header } from '../pages/sections/header.section';
import { resetState } from '../helpers/browser.helper';

describe('Localization', () => {
    beforeEach(resetState);

    it('translates labels and switches document direction to RTL [TC-I18N-01]', async () => {
        await login.waitReady();
        const submitEn = await login.submitBtn.getText();

        await header.chooseLanguage('fa');

        verify.equals(await header.readDocLang(), 'fa');
        verify.equals(await header.readDocDir(), 'rtl');

        const submitFa = await login.submitBtn.getText();
        verify.notEquals(submitFa, submitEn);
        verify.greaterThan(submitFa.trim().length, 0);
    });
});
