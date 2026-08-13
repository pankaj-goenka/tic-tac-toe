import { verify } from '../helpers/assertions.helper';
import { login } from '../pages/login.page';
import { game } from '../pages/board.page';
import { profile } from '../pages/profile.page';
import { history } from '../pages/history.page';
import { navBar } from '../pages/sections/navBar.section';
import { getStorage, registerAndStart, resetState, userKeys } from '../helpers/browser.helper';

describe('Navigation', () => {
    beforeEach(async () => {
        await resetState();
        await registerAndStart();
    });

    it('shows the nav bar with all entries after login [TC-NAV-01]', async () => {
        verify.equals(await navBar.isShown(), true);
        await verify.visible(navBar.playTab);
        await verify.visible(navBar.profileTab);
        await verify.visible(navBar.historyTab);
        await verify.visible(navBar.signOutButton);
        await verify.visible(navBar.userGreeting);
        await verify.visible(navBar.avatar);
    });

    it('switches view and updates active state per nav item [TC-NAV-02]', async () => {
        await navBar.openProfile();
        await profile.waitReady();
        verify.equals(await profile.isShowing(), true);

        await navBar.openHistory();
        await history.waitReady();
        verify.equals(await history.isShowing(), true);

        await navBar.openPlay();
        await game.waitReady();
        verify.equals(await game.isShowing(), true);
    });

    it('clears session and returns to the auth card on log out [TC-NAV-03]', async () => {
        await navBar.signOut();
        await login.waitReady();
        verify.equals(await login.isShowing(), true);

        verify.isNull(await getStorage<string>('session'));
        // Only the session is dropped; the user record stays put.
        verify.greaterThan((await userKeys()).length, 0);
    });
});
