import { BasePage } from './base.page';
import { act, byTestId } from '../helpers/dom.helper';
import { navBar } from './sections/navBar.section';

export interface ProfileStats {
    wins: number;
    losses: number;
    draws: number;
}

export class ProfilePage extends BasePage {
    readonly readyTestId = 'view-profile';

    get drawsStat() {
        return byTestId('profile-draws');
    }
    get lossesStat() {
        return byTestId('profile-losses');
    }
    get winsStat() {
        return byTestId('profile-wins');
    }
    get createdField() {
        return byTestId('profile-created');
    }
    get deleteBtn() {
        return byTestId('btn-delete-account');
    }
    get errorText() {
        return byTestId('profile-error');
    }
    get successText() {
        return byTestId('profile-message');
    }
    get saveBtn() {
        return byTestId('btn-save-profile');
    }
    get nameField() {
        return byTestId('input-profile-name');
    }

    async open(): Promise<void> {
        await navBar.openProfile();
        await this.waitReady();
    }

    async readStats(): Promise<ProfileStats> {
        const [wins, losses, draws] = await Promise.all([
            act.text(this.winsStat),
            act.text(this.lossesStat),
            act.text(this.drawsStat),
        ]);
        return { wins: Number(wins), losses: Number(losses), draws: Number(draws) };
    }

    async changeName(newName: string): Promise<void> {
        await act.fill(this.nameField, newName);
        await act.click(this.saveBtn);
    }

    /**
     * Fire Delete Account. It raises a `window.confirm`, so the caller must
     * stub that dialog around this call.
     */
    removeAccount(): Promise<void> {
        return act.click(this.deleteBtn);
    }
}

export const profile = new ProfilePage();
