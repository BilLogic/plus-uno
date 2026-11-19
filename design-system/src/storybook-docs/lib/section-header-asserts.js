import { expect } from 'storybook/test';

/**
 * The Section header's rules as play assertions: every control in the header
 * draws 32 and every Tag 20; `rows` says how many of rows 2 and 3 the example
 * has, so a row with nothing in it is asserted absent.
 *
 * @param {Element} canvasElement
 * @param {number} [rows]  rows 2 and 3 expected under the title row
 */
export const expectSectionHeader = async (canvasElement, rows) => {
    const header = canvasElement.querySelector('.plus-template-section-header');
    await expect(header, 'the Section draws its header').not.toBeNull();
    if (rows !== undefined) {
        await expect(header.querySelectorAll('.plus-section-rows > .plus-section-row'), `${rows} header rows under the title`).toHaveLength(rows);
    }
    const controls = [...header.querySelectorAll('button, input')].filter((el) => {
        const box = el.getBoundingClientRect();
        return box.height > 0 && !el.closest('.plus-section-row__views') && el.type !== 'hidden';
    });
    controls.forEach((el) => {
        const box = (el.closest('.plus-search-field') ?? el).getBoundingClientRect();
        expect(Math.round(box.height), `${el.getAttribute('aria-label') ?? el.textContent} draws 32`).toBe(32);
    });
    header.querySelectorAll('.plus-tag').forEach((tag) => {
        expect(Math.round(tag.getBoundingClientRect().height), 'a Tag draws 20').toBe(20);
    });
};
