import { expect, userEvent, waitFor, within } from 'storybook/test';

/**
 * Play tests shared by the filter stories. Each story's Interactive canvas
 * carries the filter and a `data-testid="applied"` readout of what the table
 * would filter by. The list renders in a portal, so rows are found on the page.
 */

/** A pick-many filter applies its picks once, when the list closes. */
export const playCommitsOnClose = ({ name, picks, before, after }) => async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    const applied = canvas.getByTestId('applied');

    await userEvent.click(canvas.getByRole('combobox', { name }));
    for (const pick of picks) {
        await userEvent.click(await page.findByRole('option', { name: pick }));
    }
    await expect(applied).toHaveTextContent(before);

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(applied).toHaveTextContent(after));
};

/** A pick-one filter applies the pick at once, shows it, and closes. */
export const playPicksOne = ({ name, pick, after }) => async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    const field = canvas.getByRole('combobox', { name });

    await userEvent.click(field);
    await userEvent.click(await page.findByRole('option', { name: pick }));

    await expect(canvas.getByTestId('applied')).toHaveTextContent(after);
    await expect(field).toHaveTextContent(pick);
    await expect(field).toHaveAttribute('aria-expanded', 'false');
};
