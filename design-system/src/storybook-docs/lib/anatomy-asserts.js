import { expect, waitFor } from 'storybook/test';

/**
 * The anatomy figures' play assertions, shared by every template page: each
 * marker's part exists and the marker sits beside it, and no leader line runs
 * through a part other than its own. `parts` is the same list the figure's
 * `LiveAnatomy` reads.
 */

const rect = (el) => el.getBoundingClientRect();

/** Every marker's part exists and the marker sits level with it (above it for a top marker): its center within the part's top and bottom. */
export const markersLevelWithParts = async (canvasElement, parts) => {
    await waitFor(() => expect(canvasElement.querySelectorAll('[data-anatomy-marker]'), 'a marker for each part').toHaveLength(parts.length));
    parts.forEach(({ selector, label, side }, i) => {
        const target = canvasElement.querySelector(selector);
        expect(target, `${label}: its element exists`).not.toBeNull();
        const marker = canvasElement.querySelector(`[data-anatomy-marker="${i + 1}"]`);
        const box = rect(target);
        if (side === 'top') {
            expect(rect(marker).bottom, `marker ${i + 1} (${label}) sits above its part`).toBeLessThanOrEqual(box.top);
            return;
        }
        const middle = rect(marker).top + rect(marker).height / 2;
        expect(middle, `marker ${i + 1} (${label}) sits level with its part`).toBeGreaterThanOrEqual(box.top - 1);
        expect(middle, `marker ${i + 1} (${label}) sits level with its part`).toBeLessThanOrEqual(box.bottom + 1);
    });
};

/** No leader line passes through a part other than its own: the line's box against every other part's box, ignoring a 1px touch. */
export const leadersCrossNoOtherPart = (canvasElement, parts) => {
    parts.forEach(({ label }, i) => {
        const leader = canvasElement.querySelector(`[data-anatomy-leader="${i + 1}"]`);
        expect(leader, `${label}: its leader exists`).not.toBeNull();
        const line = rect(leader);
        parts.forEach((other, j) => {
            if (j === i) return;
            const box = rect(canvasElement.querySelector(other.selector));
            const inside = line.right > box.left + 1 && line.left < box.right - 1 && line.bottom > box.top + 1 && line.top < box.bottom - 1;
            expect(inside, `leader ${i + 1} (${label}) does not cross ${other.label}`).toBe(false);
        });
    });
};
