import { act, byTestId } from '../helpers/dom.helper';

// Locating is `data-testid`-only (via `byTestId`); subclasses never reach for CSS/XPath.
export abstract class BasePage {
    abstract readonly readyTestId: string;

    isShowing(): Promise<boolean> {
        return act.visible(this.anchor);
    }

    waitReady(): Promise<void> {
        return act.waitVisible(this.anchor);
    }

    protected get anchor() {
        return byTestId(this.readyTestId);
    }
}
