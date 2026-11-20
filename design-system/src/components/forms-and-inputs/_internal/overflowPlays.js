/**
 * Play-function checks for the Overflow stories, shared by the stories of every
 * form and input component. Each asserts one clause of the overflow rule
 * (Patterns › States › Overflow): nothing is clipped without an ellipsis, a
 * growing field has no blank line, nothing escapes its well, and the full value
 * stays reachable.
 */
import { expect, userEvent, waitFor, within } from 'storybook/test';

/** Long content in the PLUS voice: a tutor with a double-barrelled name, a school, a lesson topic. */
export const LONG_TUTOR = 'Dr. Alexandria Montgomery-Featherstonehaugh Rodriguez-Villanueva';
export const LONG_SCHOOL = 'Thomas Jefferson Preparatory Academy of Mathematics, Science and Engineering at Lincoln Park';
export const LONG_TOPIC = 'Two-step linear equations with variables on both sides, word problems and graphing';
export const LONG_FILE = 'Lincoln-Park-Preparatory-Middle-School-week-12-session-reflection-and-supervisor-feedback-final.pdf';
export const LONG_SENTENCE = 'Maya keeps rushing through the check-for-understanding step, so I would like the tutor to slow down and ask her to explain each step back in her own words before moving on to the next problem.';
export const MANY_TAGS = [
    'Fractions', 'Decimals', 'Ratios and proportions', 'Linear equations', 'Word problems', 'Geometry',
    'Reading comprehension', 'Test prep', 'Study skills', 'Homework help', 'Algebra readiness', 'Graphing',
];

/** Elements whose own text is clipped by overflow: hidden/clip. */
const hasOwnText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
const clips = (style) => ['hidden', 'clip'].includes(style.overflowX);

/**
 * Nothing is cut without an ellipsis: every element under `root` whose text
 * is wider than its box either ends in an ellipsis or scrolls, and a native
 * input does the same. Returns the clipped elements so a story can go on to
 * assert how the full text is reached.
 */
export const expectNoSilentClip = async (root) => {
    const clipped = [];
    for (const el of root.querySelectorAll('*')) {
        const style = getComputedStyle(el);
        const isInput = el.matches('input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=hidden])');
        if (!isInput && !(clips(style) && hasOwnText(el))) continue;
        if (el.getBoundingClientRect().width <= 1) continue; // visually hidden text
        if (el.scrollWidth <= el.clientWidth + 1) continue;
        clipped.push(el);
        await expect(style.textOverflow, `${el.className || el.tagName} is cut with no ellipsis`).toBe('ellipsis');
    }
    return clipped;
};

/** Nothing leaves its well: the well does not scroll sideways and `el` sits inside it. */
export const expectInsideWell = async (el, well = el.parentElement) => {
    const w = well.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    await expect(well.scrollWidth, 'the well scrolls sideways').toBeLessThanOrEqual(well.clientWidth + 1);
    await expect(r.left).toBeGreaterThanOrEqual(w.left - 1);
    await expect(r.right).toBeLessThanOrEqual(w.right + 1);
};

/**
 * A box that grows by whole rows has no blank line: the room under its last
 * row is no more than the room above its first, so no empty row is drawn.
 */
export const expectNoBlankLine = async (box, selector = '*') => {
    const edge = box.getBoundingClientRect();
    const kids = [...box.querySelectorAll(selector)].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
    });
    const top = Math.min(...kids.map((el) => el.getBoundingClientRect().top));
    const bottom = Math.max(...kids.map((el) => el.getBoundingClientRect().bottom));
    await expect(edge.bottom - bottom, 'a blank line under the last row').toBeLessThanOrEqual(top - edge.top + 2);
};

/** The trailing control (icon, chevron, button) stays inside the box and visible at the end. */
export const expectTrailingKept = async (box, trailing) => {
    const edge = box.getBoundingClientRect();
    const r = trailing.getBoundingClientRect();
    await expect(r.width).toBeGreaterThan(0);
    await expect(r.right).toBeLessThanOrEqual(edge.right + 1);
    await expect(r.left).toBeGreaterThanOrEqual(edge.left - 1);
};

/**
 * The full text of a clipped control opens in a Tooltip on hover and again on
 * focus, and closes when the pointer or focus leaves.
 */
export const expectFullTextReachable = async (canvasElement, control, text) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.hover(control);
    await waitFor(() => expect(body.getByRole('tooltip')).toHaveTextContent(text));
    await userEvent.unhover(control);
    await waitFor(() => expect(body.queryByRole('tooltip')).toBeNull());
    // A menu moves focus to the hovered row; start from none so focus is what opens the Tooltip.
    control.blur();
    control.focus();
    await waitFor(() => expect(body.getByRole('tooltip')).toHaveTextContent(text));
    control.blur();
    await waitFor(() => expect(body.queryByRole('tooltip')).toBeNull());
};

/**
 * A field the person types in has no Tooltip: its value is whole, and focus
 * reaches the end of it, because the caret walks there and the field scrolls.
 */
export const expectReachableByFocus = async (canvasElement, input, text) => {
    await expect(input.value).toBe(text);
    input.scrollLeft = 0;
    input.focus();
    await userEvent.keyboard('{End}');
    await expect(input.scrollLeft).toBeGreaterThan(0);
    await expect(within(canvasElement.ownerDocument.body).queryByRole('tooltip')).toBeNull();
    input.blur();
};
