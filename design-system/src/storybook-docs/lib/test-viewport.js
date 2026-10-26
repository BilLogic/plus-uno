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
    // `viewport:done` can arrive before the iframe has laid out at the new
    // size (seen in CI, not locally), and a media-query change that lands after
    // the story's next step undoes it. Wait for the page itself to agree.
    const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    const deadline = Date.now() + 5000;
    while (!window.matchMedia(`(width: ${width}px) and (height: ${height}px)`).matches) {
        if (Date.now() > deadline) {
            throw new Error(`setTestViewport: the page is ${window.innerWidth}×${window.innerHeight}, not ${width}×${height}.`);
        }
        await frame();
    }
    // Then two frames for media-query listeners and ResizeObservers to run.
    await frame();
    await frame();
    return true;
};

/**
 * Runs `run` at `width` × `height`, then puts the runner's viewport back
 * whatever `run` did, so the next story starts where it expects.
 * @param {number} width
 * @param {number} height
 * @param {() => Promise<void>} run
 */
export const withTestViewport = async (width, height, run) => {
    const before = { w: window.innerWidth, h: window.innerHeight };
    await setTestViewport(width, height);
    try {
        await run();
    } finally {
        await setTestViewport(before.w, before.h);
    }
};

/**
 * Runs one of the runner-side browser commands registered in vite.config.js
 * (`browser.commands`), for what a page cannot do to itself, such as set the
 * OS's motion, color-scheme or contrast preference. Each calls Playwright's
 * `page.emulateMedia` for the whole page; `null` restores a preference.
 *
 * THIS USES A PRIVATE API. `window.__vitest_browser_runner__.commands` is
 * Vitest's internal handle, checked against Vitest 5.0.4. The documented
 * route, `import { commands } from 'vitest/browser'`, cannot be used here: that
 * module throws when loaded outside Browser Mode, and story files also load in
 * plain Storybook. If a Vitest upgrade moves the handle, the stories that call
 * this fail loudly inside the runner rather than skipping.
 *
 * @param {string} name the command's key in vite.config.js
 * @param {unknown[]} args
 * @returns {Promise<boolean>} false only in plain Storybook, where there is no
 *   runner to ask; inside the runner a missing handle throws.
 */
const runBrowserCommand = async (name, args) => {
    if (!inTestRunner()) return false;
    const commands = window.__vitest_browser_runner__?.commands;
    if (!commands) {
        throw new Error(
            `${name}: the Vitest runner handle (window.__vitest_browser_runner__.commands) `
            + 'is missing. Check it against the installed Vitest version.',
        );
    }
    await commands.triggerCommand(name, args);
    return true;
};

/**
 * Sets the page's `prefers-reduced-motion`; `null` restores no preference.
 * @param {'reduce' | 'no-preference' | null} value
 * @returns {Promise<boolean>} false only in plain Storybook.
 */
export const emulateReducedMotion = (value) => runBrowserCommand('emulateReducedMotion', [value]);

/**
 * Sets the page's `prefers-color-scheme` and `prefers-contrast`; `null`
 * restores each.
 * @param {'light' | 'dark' | null} colorScheme
 * @param {'more' | 'no-preference' | null} contrast
 * @returns {Promise<boolean>} false only in plain Storybook.
 */
export const emulateColorPreferences = (colorScheme, contrast) =>
    runBrowserCommand('emulateColorPreferences', [colorScheme, contrast]);
