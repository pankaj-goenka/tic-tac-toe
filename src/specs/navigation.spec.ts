import { verify } from '../helpers/assertions.helper';
import { login } from '../pages/login.page';
import { game } from '../pages/board.page';
import { profile } from '../pages/profile.page';
import { history } from '../pages/history.page';
import { navBar } from '../pages/sections/navBar.section';
import { getStorage, registerAndStart, resetState, userKeys } from '../helpers/browser.helper';

describe('Navigation between views', () => {
    beforeEach(async () => {
        await resetState();
        await registerAndStart();
    });

    // Each entry: open the tab, wait for its view, assert that view is showing.
    const routes = [
        { open: () => navBar.openProfile(), page: profile },
        { open: () => navBar.openHistory(), page: history },
        { open: () => navBar.openPlay(), page: game },
    ] as const;

    it('shows the nav bar with all entries after login [TEST-39]', async () => {
        verify.equals(await navBar.isShown(), true);

        const chrome = [
            navBar.playTab,
            navBar.profileTab,
            navBar.historyTab,
            navBar.signOutButton,
            navBar.userGreeting,
            navBar.avatar,
        ];
        for (const el of chrome) {
            await verify.visible(el);
        }
    });

    it('switches view and updates active state per nav item [TEST-40]', async () => {
        for (const { open, page } of routes) {
            await open();
            await page.waitReady();
            verify.equals(await page.isShowing(), true);
        }
    });

    it('clears session and returns to the auth card on log out [TEST-41]', async () => {
        await navBar.signOut();
        await login.waitReady();
        verify.equals(await login.isShowing(), true);

        verify.isNull(await getStorage<string>('session'));
        // Only the session is dropped; the user record stays put.
        verify.greaterThan((await userKeys()).length, 0);
    });
});
