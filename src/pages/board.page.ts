import { BasePage } from './base.page';
import { act, byTestId } from '../helpers/dom.helper';
import { navBar } from './sections/navBar.section';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type CellState = 'empty' | 'x' | 'o';

export type TerminalStatus = 'human' | 'computer' | 'draw';
export type PlayStatus = TerminalStatus | 'your-turn' | 'computer-thinking';

const TERMINAL: readonly TerminalStatus[] = ['human', 'computer', 'draw'];
export const isTerminal = (s: string): s is TerminalStatus =>
    (TERMINAL as readonly string[]).includes(s);

/**
 * Timing model: the status pill's `data-status` (`[data-testid="status"]`) is the
 * only turn-order signal we trust. After a human move the engine takes roughly a
 * second and a half to reply, so every wait watches that attribute through the
 * helpers here — a fixed `browser.pause` would just be guessing.
 */
export class BoardPage extends BasePage {
    readonly readyTestId = 'view-play';

    get status() {
        return byTestId('status');
    }
    get board() {
        return byTestId('board');
    }
    get difficultyDropdown() {
        return byTestId('select-difficulty');
    }
    get resetBtn() {
        return byTestId('btn-reset');
    }
    get hintBtn() {
        return byTestId('btn-hint');
    }
    get newGameBtn() {
        return byTestId('btn-new');
    }

    cell(index: number) {
        return byTestId(`cell-${index}`);
    }

    async open(): Promise<void> {
        await navBar.openPlay();
        await this.waitReady();
    }

    async readStatus(): Promise<PlayStatus> {
        return ((await act.attr(this.status, 'data-status')) ?? '') as PlayStatus;
    }

    async readCell(index: number): Promise<CellState> {
        return ((await act.attr(this.cell(index), 'data-state')) ?? 'empty') as CellState;
    }

    readBoard(): Promise<CellState[]> {
        return browser.execute(() => {
            const out: string[] = Array(9).fill('empty');
            for (const el of document.querySelectorAll('[data-testid^="cell-"]')) {
                const i = Number((el.getAttribute('data-testid') ?? '').slice('cell-'.length));
                if (Number.isInteger(i) && i >= 0 && i < 9) {
                    out[i] = el.getAttribute('data-state') ?? 'empty';
                }
            }
            return out;
        }) as Promise<CellState[]>;
    }

    tapCell(index: number): Promise<void> {
        return act.click(this.cell(index));
    }

    async makeMove(index: number): Promise<void> {
        await this.tapCell(index);
        await this.awaitComputerDone();
    }

    chooseDifficulty(level: Difficulty): Promise<void> {
        return act.pick(this.difficultyDropdown, level);
    }
    async readDifficulty(): Promise<Difficulty> {
        return (await act.value(this.difficultyDropdown)) as Difficulty;
    }

    resetBoard(): Promise<void> {
        return act.click(this.resetBtn);
    }
    startNewGame(): Promise<void> {
        return act.click(this.newGameBtn);
    }

    awaitGameEnd(): Promise<void> {
        return this.untilStatus(isTerminal, 'no terminal state reached', 10000);
    }
    awaitComputerDone(): Promise<void> {
        return this.untilStatus((s) => s !== 'computer-thinking', 'stuck on computer-thinking');
    }
    awaitComputerStart(): Promise<void> {
        return this.untilStatus(
            (s) => s === 'computer-thinking',
            'never entered computer-thinking',
        );
    }

    // The default is generous (10 s) so the async computer move — normally ~1.5 s
    // — doesn't time out under parallel-worker CPU contention.
    private untilStatus(
        pred: (s: PlayStatus) => boolean,
        why: string,
        timeout = 10000,
    ): Promise<void> {
        return browser.waitUntil(async () => pred(await this.readStatus()), {
            timeout,
            timeoutMsg: `Status ${why}`,
        }) as unknown as Promise<void>;
    }
}

export const game = new BoardPage();
