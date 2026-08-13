type El = ReturnType<typeof $>;

export function byTestId(id: string): El {
    return $(`[data-testid="${id}"]`);
}

export const act = {
    async click(el: El): Promise<void> {
        await el.click();
    },

    async fill(el: El, text: string): Promise<void> {
        await el.clearValue();
        await el.addValue(text);
    },

    async pick(el: El, value: string): Promise<void> {
        await el.selectByAttribute('value', value);
    },

    text(el: El): Promise<string> {
        return el.getText();
    },

    value(el: El): Promise<string> {
        return el.getValue();
    },

    attr(el: El, name: string): Promise<string | null> {
        return el.getAttribute(name);
    },

    visible(el: El): Promise<boolean> {
        return el.isDisplayed();
    },

    async waitVisible(el: El, timeout = 5000): Promise<void> {
        await el.waitForDisplayed({ timeout });
    },
};
