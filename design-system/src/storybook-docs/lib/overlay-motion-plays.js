import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';
import { emulateReducedMotion } from './test-viewport';

export const reducedMotionSetup = async () => {
    await emulateReducedMotion('reduce');
    return async () => { await emulateReducedMotion(null); };
};

/** Assert the public surface stays for its exit, then leaves the document. */
export async function expectOverlayExit(surface, close, reduced) {
    if (!reduced) await expect(getComputedStyle(surface).animationName).not.toBe('none');
    await waitFor(() => expect(surface).toBeVisible());
    close();
    if (!reduced) await expect(surface.isConnected).toBe(true);
    await waitFor(() => expect(surface.isConnected).toBe(false));
}

export const selectMotionPlay = (reduced = false) => async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('combobox');
    await userEvent.click(field);
    const list = await within(canvasElement.ownerDocument.body).findByRole('listbox');
    const surface = list.closest('.plus-listbox');
    if (reduced) await expect(getComputedStyle(surface).animationName).toBe('none');
    await expectOverlayExit(surface, () => fireEvent.keyDown(field, { key: 'Escape' }), reduced);
    await expect(field).toHaveAttribute('aria-expanded', 'false');
};

/** Geometry and hit testing read a settled surface rather than an entrance frame. */
export async function settleAnimations(element) {
    const animations = element.getAnimations({ subtree: true })
        .filter((animation) => animation.effect.getComputedTiming().iterations !== Infinity);
    await Promise.allSettled(animations.map((animation) => animation.finished));
}
