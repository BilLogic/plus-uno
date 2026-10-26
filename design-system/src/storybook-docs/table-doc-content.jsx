/**
 * The rows of the tables shared by the table docs pages: the Static table
 * anatomy, the cell presets, the head cell and row options, and the message
 * row types. The prose comes from the Static table, Dynamic table and Tree
 * table docs in Figma; each page passes these rows to `SpecTable`.
 */
import React from 'react';

const c = (text) => <code>{text}</code>;

export const staticAnatomy = [
    ['1', 'Head row', 'The quiet header, with a stronger rule under it. It stays visible in every state.'],
    ['2', 'Head cell', 'A 12px muted label, plus the sort control and an optional help icon.'],
    ['3', 'Row', 'Owns the fill for hover, selected and focus, and the hairline under it.'],
    ['4', 'Title cell', 'One per table: the column that names the record.'],
    ['5', 'Number cell', 'Aligned to the end, so numbers line up on the right.'],
    ['6', 'Summary row', 'One muted calculation per column, with no rule under it.'],
];

export const cellPresets = [
    ['Number', 'Text, aligned to the end. Tabular figures. Put the unit in the header, not in every cell.'],
    ['Date', 'Text, aligned to the start: “Oct 24, 4:30 PM”. Use Today or Yesterday only where the spec allows.'],
    ['Status', 'One Status in the content slot. It is not a button, and it caps at 200 wide.'],
    ['Tags', 'Up to two Tags, then a muted “+n”.'],
    ['Avatar and name', 'An avatar and a name, usually in the title column.'],
    ['People', 'Person Tags, then “+n”. Keep it to one line.'],
    ['Link', 'Text in the link color. The link is the only control in its cell.'],
    ['Checkbox', 'A centered checkbox. It is a data value, not row selection.'],
    ['Icon', 'A centered 16px icon. Give it a tooltip and an accessible label.'],
    ['Progress', 'A progress bar with the number after it.'],
    ['Actions', 'An icon button aligned to the end. Its label names the row: “More actions for Ava Lee”.'],
    ['Empty', 'A muted en dash. It means no value, as opposed to a skeleton, which means not loaded yet.'],
];

export const headCellOptions = [
    ['Align', 'start, center, end', 'Numbers use end. Checkbox and icon columns use center.'],
    ['Sortable', 'on, off', 'Draws the sort control. An unsorted column shows its marker on hover and focus only.'],
    ['Sort', 'none, ascending, descending', 'The 12px arrow. Only one column is sorted at a time.'],
    ['Info', 'on, off', 'A 12px help icon after the label, with a tooltip.'],
    ['Divider, frozen', 'on, off', 'A vertical rule on the end edge, or the stronger edge of a frozen first column.'],
];

export const cellOptions = [
    ['Content', 'text, slot', 'A label, or any cell preset in the content slot.'],
    ['Align', 'start, center, end', 'Matches the column’s head cell.'],
    ['Overflow', 'truncate, wrap', 'Truncate is the default and shows a tooltip on hover and focus. Wrap when the text matters.'],
    ['Lines', '1, 2', 'Adds the muted second line.'],
    ['Emphasis', 'default, title', 'Title marks the one column that names the record.'],
    ['State', 'rest, error', 'Error tints the cell and adds a 12px error icon. The message is in a tooltip.'],
    ['Loading', 'false, true', 'A skeleton bar while the value loads.'],
    ['Leading', 'on, off', 'A slot before the text for an avatar, an icon or a Status.'],
];

export const rowOptions = [
    ['Size', 'sm, md, lg', '32, 40 or 48 minimum height. Two-line cells grow it.'],
    ['Frame', 'framed, plain', 'Plain rows are flush with the section edge. Framed rows inset by the cell pad.'],
    ['State', 'rest, highlighted', 'Highlighted marks a new or changed row. Hover, pressed, focus, selected and disabled belong to the Dynamic table.'],
    ['Divider', 'on, off', 'Turn it off on the last row of the table.'],
];

export const messageRowTypes = [
    ['Empty', 'Nothing exists yet. Say what will show up here, and offer the first action.'],
    ['No results', 'Filters hid everything. Offer to clear them.'],
    ['Error', 'The rows did not load. Offer to try again.'],
    ['Loading', 'Rows are on the way. Show the spinner and one line.'],
    ['Load more', 'The range is partial. Show how many are showing and offer the next batch.'],
];

export const tableTokens = [
    [c('--table-pad-x-cell'), '8', 'Cell padding, start and end'],
    [c('--table-pad-y-cell'), '4', 'Cell padding, top and bottom'],
    [c('--table-indent'), '24', 'The indent of each tree level'],
    [c('--table-radius'), '8', 'Corner radius of a framed table. It clips the header.'],
    [c('--table-pad-x-footer'), '16', 'Footer inset in a framed table: the row padding plus the cell padding, so the range lines up with the cell text'],
    [c('--table-min-width-title'), '224', 'The title column never squeezes below this. Past it, the table scrolls sideways.'],
];
