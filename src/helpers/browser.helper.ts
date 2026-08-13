import { login } from '../pages/login.page';
import { game } from '../pages/board.page';
import { makeUsername } from './util.helper';

export type StorageKey = 'theme' | 'lang' | 'session' | 'users';

const withPrefix = (key: StorageKey): string => `ttt:${key}`;

export async function getStorage<T = unknown>(key: StorageKey): Promise<T | null> {
    const raw = await browser.execute(
        (k: string) => window.localStorage.getItem(k),
        withPrefix(key),
    );
    if (raw === null) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return raw as unknown as T;
    }
}

export async function userKeys(): Promise<string[]> {
    const users = await getStorage<Record<string, unknown>>('users');
    return users ? Object.keys(users) : [];
}

export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameResult = 'win' | 'loss' | 'draw';

export interface HistoryEntry {
    finishedAt: number;
    difficulty: Difficulty;
    result: GameResult;
}

export interface StoredUser {
    name: string;
    createdAt: number;
    difficulty: Difficulty;
    history: HistoryEntry[];
}

export interface SeedUserOptions {
    name: string;
    difficulty?: Difficulty;
    history?: HistoryEntry[];
    createdAt?: number;
}

export async function createUser(opts: SeedUserOptions): Promise<void> {
    const record: StoredUser = {
        name: opts.name,
        createdAt: opts.createdAt ?? Date.now(),
        difficulty: opts.difficulty ?? 'easy',
        history: opts.history ?? [],
    };
    await browser.execute(
        (user: StoredUser, key: string) => {
            const raw = window.localStorage.getItem(key);
            let users: Record<string, StoredUser>;
            try {
                users = raw ? (JSON.parse(raw) as Record<string, StoredUser>) : {};
            } catch {
                users = {};
            }
            // Keyed by the lowercased display name, matching the SUT.
            users[user.name.toLowerCase()] = user;
            window.localStorage.setItem(key, JSON.stringify(users));
        },
        record,
        withPrefix('users'),
    );
}

export async function resetState(): Promise<void> {
    await browser.url('/');
    await browser.execute(() => window.localStorage.clear());
    await browser.refresh();
    await login.waitReady();
}

export async function registerAndStart(name = makeUsername()): Promise<string> {
    await login.signUp(name);
    await game.waitReady();
    return name;
}

/**
 * Three flows raise a native `window.confirm` (mid-game difficulty change, Clear
 * History, Delete Account). That prompt freezes the same JS task that opened it,
 * leaving no window for a driver to answer it after the fact. So we shadow
 * `window.confirm` with a function that returns a preset answer, installed just
 * before the triggering click — the dialog is never actually shown.
 */
function stubConfirm(answer: boolean): Promise<void> {
    return browser.execute((a: boolean) => {
        window.confirm = () => a;
    }, answer);
}

export function confirmNext(): Promise<void> {
    return stubConfirm(true);
}

export function dismissNext(): Promise<void> {
    return stubConfirm(false);
}
