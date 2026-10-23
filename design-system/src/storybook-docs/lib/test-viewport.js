/**
 * Resizes the story's viewport from a `play:` function, so a story can assert
 * what a page does at 768, 1024 or 1440 wide. The layout tokens switch on
 * `@media (min-width: …)`, which reads the viewport and nothing else, so a
 * story that only resized its own wrapper would test the wrong width.
 *
 * THIS USES A PRIVATE API. It posts the same message Vitest's own
 * `page.viewport()` posts (`@vitest/browser/context`): `{ event: 'viewport' }`
 * on the `vitest:<sessionId>` BroadcastChannel, answered by
 * `viewport:done` once the orchestrator has resized the test iframe. The
 * documented import cannot be used here, because `vitest/browser` throws when
 * loaded outside Browser Mode and story files also load in plain Storybook.
 * Checked against Vitest 4.1. If an upgrade moves the handle, the stories that
 * call this fail loudly inside the runner rather than skipping.
 */

/**
 * Whether this is the Storybook test runner (Vitest Browser Mode). Vite's
 * `test` mode and Vitest's own browser marker must agree.
 * @returns {boolean}
 */
export const inTestRunner = () => {
    const testMode = import.meta.env.MODE === 'test';
    const marker = typeof window !== 'undefined' && window.__vitest_browser__ === true;
    if (testMode !== marker) {
        throw new Error(
            `test-viewport: the runner signals disagree (Vite mode "${import.meta.env.MODE}", `
            + `window.__vitest_browser__ ${marker ? 'present' : 'absent'}). Check both against the installed Vitest.`,
        );
    }
    return marker;
};

/**
 * Sets the viewport to `width` × `height` and waits for the resize to land.
 * @param {number} width
 * @param {number} height
 * @returns {Promise<boolean>} false only in plain Storybook, where there is no
 *   runner to ask; inside the runner a missing handle throws.
 */
export const setTestViewport = async (width, height) => {
    if (!inTestRunner()) return false;
    const state = window.__vitest_browser_runner__;
    if (!state?.sessionId || !state?.iframeId) {
        throw new Error(
            'setTestViewport: the Vitest runner handle (window.__vitest_browser_runner__.sessionId / iframeId) '
            + 'is missing. Check it against the installed Vitest version.',
        );
    }
    const channel = new BroadcastChannel(`vitest:${state.sessionId}`);
    try {
        await new Promise((resolve, reject) => {
            channel.addEventListener('message', function handler(e) {
                if (e.data?.iframeId !== state.iframeId) return;
                if (e.data.event === 'viewport:done') {
                    channel.removeEventListener('message', handler);
                    resolve();
                }
                if (e.data.event === 'viewport:fail') {
                    channel.removeEventListener('message', handler);
                    reject(new Error(e.data.error));
                }
            });
            channel.postMessage({ event: 'viewport', width, height, iframeId: state.iframeId });
        });
    } finally {
        channel.close();
    }
    // One frame for media queries and ResizeObservers to settle.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return true;
};
