type El = ReturnType<typeof $>;

export const verify = {
    async visible(el: El): Promise<void> {
        await expect(el).toBeDisplayed();
    },

    async hidden(el: El): Promise<void> {
        await expect(el).not.toBeDisplayed();
    },

    async text(el: El, matcher: string | RegExp): Promise<void> {
        await expect(el).toHaveText(matcher);
    },

    async notText(el: El, matcher: string | RegExp): Promise<void> {
        await expect(el).not.toHaveText(matcher);
    },

    async value(el: El, val: string): Promise<void> {
        await expect(el).toHaveValue(val);
    },

    async enabled(el: El): Promise<void> {
        await expect(el).toBeEnabled();
    },

    async disabled(el: El): Promise<void> {
        await expect(el).toBeDisabled();
    },

    equals<T>(actual: T, expected: T): void {
        expect(actual).toBe(expected);
    },

    notEquals<T>(actual: T, expected: T): void {
        expect(actual).not.toBe(expected);
    },

    deepEquals<T>(actual: T, expected: T): void {
        expect(actual).toEqual(expected);
    },

    matches(actual: string, pattern: string | RegExp): void {
        expect(actual).toMatch(pattern);
    },

    includes(actual: unknown[] | string, item: unknown): void {
        expect(actual).toContain(item);
    },

    excludes(actual: unknown[] | string, item: unknown): void {
        expect(actual).not.toContain(item);
    },

    hasLength(actual: unknown[] | string, length: number): void {
        expect(actual).toHaveLength(length);
    },

    greaterThan(actual: number, min: number): void {
        expect(actual).toBeGreaterThan(min);
    },

    isNull(actual: unknown): void {
        expect(actual).toBeNull();
    },

    notNull(actual: unknown): void {
        expect(actual).not.toBeNull();
    },
};
