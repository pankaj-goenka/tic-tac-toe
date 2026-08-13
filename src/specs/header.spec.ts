import { verify } from '../helpers/assertions.helper';
import { login } from '../pages/login.page';
import { profile } from '../pages/profile.page';
import { history } from '../pages/history.page';
import { game } from '../pages/board.page';
import { header } from '../pages/sections/header.section';
import { registerAndStart, resetState } from '../helpers/browser.helper';

describe('Header', () => {
    beforeEach(resetState);

    it('translates labels and flips RTL when language changes [TC-HDR-01]', async () => {
        await login.waitReady();
        const submitBefore = await login.submitBtn.getText();

        await header.chooseLanguage('fa');

        const submitAfter = await login.submitBtn.getText();
        verify.notEquals(submitAfter, submitBefore);
        verify.equals(await header.readDocLang(), 'fa');
        verify.equals(await header.readDocDir(), 'rtl');
    });

    it('flips data-theme and updates the button label [TC-HDR-02]', async () => {
        await login.waitReady();
        verify.equals(await header.readDocTheme(), 'light');
        const labelBefore = await header.readThemeLabel();

        await header.switchTheme();

        verify.equals(await header.readDocTheme(), 'dark');
        const labelAfter = await header.readThemeLabel();
        verify.notEquals(labelAfter, labelBefore);
    });

    it('persists language and theme across reload [TC-HDR-03]', async () => {
        await login.waitReady();
        await header.chooseLanguage('fa');
        await header.switchTheme();

        await browser.refresh();
        await login.waitReady();

        verify.equals(await header.readDocLang(), 'fa');
        verify.equals(await header.readDocDir(), 'rtl');
        verify.equals(await header.readDocTheme(), 'dark');
    });

    it('shows header controls on every authenticated view [TC-HDR-04]', async () => {
        await registerAndStart();

        await verify.visible(header.languageSelect);
        await verify.visible(header.themeToggle);

        await profile.open();
        await verify.visible(header.languageSelect);
        await verify.visible(header.themeToggle);

        await history.open();
        await verify.visible(header.languageSelect);
        await verify.visible(header.themeToggle);

        await game.open();
        await verify.visible(header.languageSelect);
        await verify.visible(header.themeToggle);
    });
});
