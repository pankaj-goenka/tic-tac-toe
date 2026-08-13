/**
 * Each payload tries to flip a `window.__xss` counter to non-zero; if the app
 * escapes the payload into plain text nothing runs and it stays 0. A refresh
 * clears `window` globals, so re-arm the probe after every navigation.
 */

declare global {
    interface Window {
        __xss?: number;
    }
}

export const XSS_PAYLOADS = [
    '<script>window.__xss=1</script>',
    '<img src=x onerror=window.__xss=1>',
    '"><svg onload=window.__xss=1>',
    'javascript:window.__xss=1',
] as const;

export async function armXssProbe(): Promise<void> {
    await browser.execute(() => {
        window.__xss = 0;
    });
}

export async function assertNoXss(): Promise<void> {
    expect(await browser.execute(() => window.__xss)).toBe(0);
}
