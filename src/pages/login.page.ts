import { BasePage } from './base.page';
import { act, byTestId } from '../helpers/dom.helper';

type AuthMode = 'register' | 'login';

export class LoginPage extends BasePage {
    readonly readyTestId = 'auth-form';

    get errorText() {
        return byTestId('auth-error');
    }
    get toggleModeLink() {
        return byTestId('btn-switch-mode');
    }
    /** Submit control; its testid differs per mode, so match the button type. */
    get submitBtn() {
        return $('[data-testid="auth-form"] button[type="submit"]');
    }
    get nameField() {
        return byTestId('input-name');
    }

    signIn(name: string): Promise<void> {
        return this.enterName('login', name);
    }

    signUp(name: string): Promise<void> {
        return this.enterName('register', name);
    }

    async switchToMode(mode: AuthMode): Promise<void> {
        if ((await this.readMode()) !== mode) {
            await act.click(this.toggleModeLink);
        }
    }

    async readMode(): Promise<AuthMode> {
        return (await act.attr(this.anchor, 'data-mode')) === 'login' ? 'login' : 'register';
    }

    private async enterName(mode: AuthMode, name: string): Promise<void> {
        await this.switchToMode(mode);
        await act.fill(this.nameField, name);
        await act.click(this.submitBtn);
    }
}

export const login = new LoginPage();
