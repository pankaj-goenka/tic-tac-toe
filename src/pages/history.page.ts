import { BasePage } from './base.page';
import { act, byTestId } from '../helpers/dom.helper';
import { navBar } from './sections/navBar.section';

export interface HistoryRow {
    date: string;
    difficulty: string;
    result: string;
}

// Rows are zero-indexed, newest first.
export class HistoryPage extends BasePage {
    readonly readyTestId = 'view-history';

    get clearBtn() {
        return byTestId('btn-clear-history');
    }
    get emptyBanner() {
        return byTestId('history-empty');
    }

    async open(): Promise<void> {
        await navBar.openHistory();
        await this.waitReady();
    }

    async readRow(index: number): Promise<HistoryRow> {
        const [date, difficulty, result] = await Promise.all([
            act.text(byTestId(`history-date-${index}`)),
            act.text(byTestId(`history-difficulty-${index}`)),
            act.text(byTestId(`history-result-${index}`)),
        ]);
        return { date, difficulty, result };
    }

    async countRows(): Promise<number> {
        return (await $$('[data-testid^="history-row-"]')).length;
    }

    hasNoRows(): Promise<boolean> {
        return act.visible(this.emptyBanner);
    }

    /**
     * Fire Clear History. It raises a `window.confirm`, so the caller must
     * stub that dialog around this call.
     */
    clearAll(): Promise<void> {
        return act.click(this.clearBtn);
    }
}

export const history = new HistoryPage();
