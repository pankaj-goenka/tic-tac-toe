import { verify } from '../helpers/assertions.helper';
import { header } from '../pages/sections/header.section';
import { login } from '../pages/login.page';
import { resetState } from '../helpers/browser.helper';

describe('Localization (language / RTL)', () => {
    beforeEach(resetState);

    const readSubmitLabel = () => login.submitBtn.getText();

    it('translates labels and switches document direction to RTL [TEST-38]', async () => {
        await login.waitReady();
        const submitEn = await readSubmitLabel();

        await header.chooseLanguage('fa');

        const [docLang, docDir] = await Promise.all([header.readDocLang(), header.readDocDir()]);
        verify.equals(docLang, 'fa');
        verify.equals(docDir, 'rtl');

        const submitFa = await readSubmitLabel();
        verify.notEquals(submitFa, submitEn);
        verify.greaterThan(submitFa.trim().length, 0);
    });
});
