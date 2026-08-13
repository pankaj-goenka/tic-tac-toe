import { act, byTestId } from '../../helpers/dom.helper';

export class HeaderSection {
    get themeToggle() {
        return byTestId('btn-theme');
    }
    get languageSelect() {
        return byTestId('select-language');
    }

    readDocTheme(): Promise<string> {
        return browser.execute(() => document.documentElement.getAttribute('data-theme') ?? '');
    }
    readDocDir(): Promise<string> {
        return browser.execute(() => document.documentElement.dir);
    }
    readDocLang(): Promise<string> {
        return browser.execute(() => document.documentElement.lang);
    }

    readThemeLabel(): Promise<string> {
        return act.text(this.themeToggle);
    }
    switchTheme(): Promise<void> {
        return act.click(this.themeToggle);
    }
    chooseLanguage(lang: 'en' | 'fa'): Promise<void> {
        return act.pick(this.languageSelect, lang);
    }
}

export const header = new HeaderSection();
