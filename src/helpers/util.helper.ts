import { game } from '../pages/board.page';
import { CellState, Difficulty, TerminalStatus, isTerminal } from '../pages/board.page';
import { verify } from './assertions.helper';

const WINNING_LINES: ReadonlyArray<readonly [number, number, number]> = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // horizontals
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // verticals
    [0, 4, 8],
    [2, 4, 6], // both diagonals
];

function findCompletingMove(board: ReadonlyArray<CellState>, symbol: 'x' | 'o'): number {
    for (const [a, b, c] of WINNING_LINES) {
        const trio = [board[a], board[b], board[c]];
        const owned = trio.filter((s) => s === symbol).length;
        const emptyAt = [a, b, c].find((_, k) => trio[k] === 'empty');
        if (owned === 2 && emptyAt !== undefined) return emptyAt;
    }
    return -1;
}

type TargetWinner = 'human' | 'computer';

/**
 * Steer a game toward one specific winner while making sure no unwanted result
 * gets recorded. The human moves first, so the board can only fill up on the
 * human's 9th move — meaning a draw is finalized there. If playing that final
 * move wouldn't yield `winner`, we stop short of it: the game stays in-progress,
 * so the SUT persists nothing and the caller can start over with New Game.
 *
 * - `winner: 'human'` — win immediately when possible, otherwise block, otherwise
 *   fill center → corners → edges. Reliably beats Easy's random moves.
 * - `winner: 'computer'` — play defensively (edges → corners → center) and never
 *   finish a human line, giving a rule-based opponent (Medium) room to win.
 *
 * Returns the terminal status, or `'abandoned'` when we stop before anything records.
 */
async function driveToWinner(winner: TargetWinner): Promise<TerminalStatus | 'abandoned'> {
    const preference =
        winner === 'human'
            ? [4, 0, 2, 6, 8, 1, 3, 5, 7] // middle first, then corners, then sides
            : [1, 3, 5, 7, 0, 2, 6, 8, 4]; // sides first, then corners, then middle

    for (let turn = 0; turn < 9; turn++) {
        const board = await game.readBoard();
        const winIdx = findCompletingMove(board, 'x');
        const emptyLeft = board.filter((s) => s === 'empty').length;

        let next: number;
        if (winner === 'human') {
            const blockIdx = findCompletingMove(board, 'o');
            const fallback = preference.find((i) => board[i] === 'empty') ?? -1;
            next = winIdx >= 0 ? winIdx : blockIdx >= 0 ? blockIdx : fallback;
        } else {
            // Throwing the game: any empty cell except the one that finishes our line.
            next = preference.find((i) => board[i] === 'empty' && i !== winIdx) ?? -1;
        }
        if (next < 0) return 'abandoned';

        // If the final board-filling move wouldn't hand us the target, stop short so
        // neither a draw nor a stray last-move win is recorded.
        const isFinalCell = emptyLeft === 1;
        const securesWin = winner === 'human' && next === winIdx;
        if (isFinalCell && !securesWin) return 'abandoned';

        await game.makeMove(next);

        const status = await game.readStatus();
        if (isTerminal(status)) return status;
    }
    return 'abandoned';
}

export async function playGame(difficulty: Difficulty = 'easy'): Promise<void> {
    await game.chooseDifficulty(difficulty);
    await playToEnd();
}

export async function playToEnd(): Promise<void> {
    for (let played = 0; played < 9; played++) {
        const board = await game.readBoard();
        const idx = board.indexOf('empty');
        if (idx === -1) break;
        await game.makeMove(idx);
        if (isTerminal(await game.readStatus())) return;
    }
    await game.awaitGameEnd();
}

async function tryWin(maxAttempts = 8): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (attempt > 1) await game.startNewGame();
        if ((await driveToWinner('human')) === 'human') return true;
    }
    return false;
}

async function tryLoss(maxAttempts = 8): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (attempt > 1) await game.startNewGame();
        if ((await driveToWinner('computer')) === 'computer') return true;
    }
    return false;
}

export async function playWinningGame(difficulty: Difficulty = 'easy'): Promise<void> {
    await game.chooseDifficulty(difficulty);
    const won = await tryWin();
    if (!won) throw new Error(`playWinningGame: could not win on ${difficulty} within attempt cap`);
}

export async function playLosingGame(difficulty: Difficulty = 'medium'): Promise<void> {
    await game.chooseDifficulty(difficulty);
    const lost = await tryLoss();
    if (!lost) {
        throw new Error(`playLosingGame: could not lose on ${difficulty} within attempt cap`);
    }
}

export async function assertNoCellOverwrite(maxMoves = 4): Promise<void> {
    for (let move = 0; move < maxMoves; move++) {
        const before = await game.readBoard();
        const target = before.indexOf('empty');
        if (target === -1) break;

        await game.makeMove(target);

        const after = await game.readBoard();
        before.forEach((prev, i) => {
            if (prev !== 'empty') verify.equals(after[i], prev);
        });

        if (isTerminal(await game.readStatus())) break;
    }
}

export function makeUsername(prefix = 'user'): string {
    const stamp = Date.now().toString(36);
    const noise = Math.random().toString(36).slice(2, 7);
    return `${prefix}_${stamp}${noise}`;
}

const REGEX_SPECIALS = new Set('\\^$.*+?()[]{}|');

export function escapeForRegex(s: string): string {
    return [...s].map((ch) => (REGEX_SPECIALS.has(ch) ? `\\${ch}` : ch)).join('');
}
