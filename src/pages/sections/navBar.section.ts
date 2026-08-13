import { act, byTestId } from '../../helpers/dom.helper';

export class NavBarSection {
    get signOutButton() {
        return byTestId('btn-logout');
    }
    get historyTab() {
        return byTestId('nav-history');
    }
    get profileTab() {
        return byTestId('nav-profile');
    }
    get playTab() {
        return byTestId('nav-play');
    }
    get avatar() {
        return byTestId('avatar');
    }
    get userGreeting() {
        return byTestId('hello-user');
    }
    get root() {
        return byTestId('nav');
    }

    signOut(): Promise<void> {
        return act.click(this.signOutButton);
    }
    openHistory(): Promise<void> {
        return act.click(this.historyTab);
    }
    openProfile(): Promise<void> {
        return act.click(this.profileTab);
    }
    openPlay(): Promise<void> {
        return act.click(this.playTab);
    }
    isShown(): Promise<boolean> {
        return act.visible(this.root);
    }
}

export const navBar = new NavBarSection();
