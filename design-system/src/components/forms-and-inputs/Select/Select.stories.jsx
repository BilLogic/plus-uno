import { withReducedMotion, selectMotionPlay } from '@/storybook-docs/lib/overlay-motion-plays';
import React, { useEffect, useState } from 'react';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { expectRest, expectHovered, expectFocused, expectDisabled, expectInvalid, expectReadOnly } from '../_internal/fieldStatePlays';
import { computedShadow } from '@/storybook-docs/lib/style-probes.js';
import Select from './Select';

/**
 * Select — pick one value, or several, from a list. The field is `_Field`
 * and the list is the internal Listbox; typing in the field filters it, and
 * isSearchable={false} turns that off for a short list.
 */
export default {
    title: 'Components/Forms and inputs/Select/Select',
    component: Select,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Pick one value, or several, from a list. Type in the field to filter it.'
            }
        }
    },
    argTypes: {
        children: {
            storyOnly: true,
            table: { disable: true },
        },
        onClick: {
            storyOnly: true,
            table: { disable: true },
        },
        style: { table: { disable: true } },
        isMulti: {
            control: 'boolean',
            table: { category: 'Design' }
        },
        marker: {
            control: { type: 'inline-radio' },
            options: ['check', 'radio'],
            table: { category: 'Design' }
        },
        spacing: {
            control: { type: 'inline-radio' },
            options: ['default', 'compact'],
            table: { category: 'Design' }
        },
        displayMode: {
            control: { type: 'select' },
            options: ['tags', 'text'],
            table: { category: 'Design' }
        },
        label: {
            control: 'text',
            table: { category: 'Content' }
        },
        placeholder: {
            control: 'text',
            table: { category: 'Content' }
        },
        caption: {
            control: 'text',
            table: { category: 'Content' }
        },
        isSearchable: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        isCreatable: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        isInvalid: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        isDisabled: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        isReadOnly: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        isRequired: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        commitOnClose: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        clearable: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        selectAll: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        maxSelections: {
            control: 'number',
            table: { category: 'Behavior' }
        },
        options: { table: { disable: true, category: 'Development' } },
        value: { control: false, table: { disable: true, category: 'Development' } },
        defaultValue: { control: false, table: { disable: true, category: 'Development' } },
        onChange: { control: false, table: { disable: true, category: 'Development' } },
        onCreate: { control: false, table: { disable: true, category: 'Development' } },
        onFocus: { control: false, table: { disable: true, category: 'Development' } },
        onBlur: { control: false, table: { disable: true, category: 'Development' } },
        loadOptions: { control: false, table: { disable: true, category: 'Development' } },
        dependsOn: { control: false, table: { disable: true, category: 'Development' } },
        recent: { control: false, table: { disable: true, category: 'Development' } },
        suggested: { control: false, table: { disable: true, category: 'Development' } },
        isLoading: { table: { disable: true, category: 'Development' } },
        defaultOpen: { table: { disable: true, category: 'Development' } },
        defaultSearchTerm: { table: { disable: true, category: 'Development' } },
        lineWrap: { table: { disable: true, category: 'Development' } },
        truncate: { table: { disable: true, category: 'Development' } },
        isOpen: { table: { disable: true, category: 'Development' } },
        isValid: { table: { disable: true, category: 'Development' } },
        successMessage: { table: { disable: true, category: 'Development' } },
        errorMessage: { table: { disable: true, category: 'Development' } },
        info: { table: { disable: true, category: 'Development' } },
        id: { control: false, table: { disable: true, category: 'Development' } },
        name: { control: false, table: { disable: true, category: 'Development' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
    }
};

const sampleOptions = [
    { value: 'lincoln', label: 'Lincoln Middle' },
    { value: 'roosevelt', label: 'Roosevelt K-8' },
    { value: 'north', label: 'North High' },
    { value: 'oak-creek', label: 'Oak Creek Elementary' },
    { value: 'westview', label: 'Westview Academy' },
];

const statusOptions = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'completed', label: 'Completed' },
    { value: 'canceled', label: 'Canceled' },
];

const grid = { pointerEvents: 'auto', display: 'grid', gap: '20px' /* token gap: 20px */, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' };

const field = { maxWidth: '400px' /* demo frame */ };

/** One story per value, for the Examples tab. */
export const Empty = {
    render: () => <div style={field}><Select label="Site" options={sampleOptions} placeholder="Select a site" /></div>,
};

export const Filled = {
    render: () => <div style={field}><Select label="Site" defaultValue="lincoln" options={sampleOptions} placeholder="Select a site" /></div>,
};

/* ---- Multi: measuring the field against its tags ---- */

const half = (rect) => rect.top + rect.height / 2;
const boxOf = (canvasElement, name) => within(canvasElement).getByRole('combobox', { name }).closest('.plus-field');
const tagsIn = (box) => [...box.querySelectorAll('.plus-tag-group__item:not(.plus-tag-group__item--hidden)')];

/** The field's rows: one tag row's height plus the wrap gap, from the tags themselves. */
const rowStep = (box) => {
    const gap = parseFloat(getComputedStyle(box.querySelector('.plus-field__content')).rowGap);
    return tagsIn(box)[0].getBoundingClientRect().height + gap;
};

/** The clear × and the caret sit on the first row's center, as TextField's trailing slot does. */
const expectTrailingOnFirstRow = async (box) => {
    const first = tagsIn(box)[0].getBoundingClientRect();
    const clear = box.querySelector('.plus-field-clear').getBoundingClientRect();
    const caret = box.querySelector('.plus-select-caret').getBoundingClientRect();
    await expect(Math.abs(half(clear) - half(first))).toBeLessThanOrEqual(1);
    await expect(Math.abs(half(caret) - half(first))).toBeLessThanOrEqual(1);
};

export const Multi = {
    render: () => (
        <div style={field}>
            <Select label="Site" options={sampleOptions} defaultValue="lincoln" />
            <Select label="Sites" isMulti options={sampleOptions} defaultValue={['lincoln', 'roosevelt']} placeholder="Select sites" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const single = boxOf(canvasElement, 'Site');
        const box = boxOf(canvasElement, 'Sites');
        // Two short tags are one row: the field is as tall as a single select, with no blank line under them.
        await expect(box.getBoundingClientRect().height).toBe(single.getBoundingClientRect().height);
        const input = box.querySelector('.plus-select-input').getBoundingClientRect();
        const last = tagsIn(box).at(-1).getBoundingClientRect();
        await expect(Math.abs(input.top - last.top)).toBeLessThanOrEqual(1);
        await expectTrailingOnFirstRow(box);
    },
};

const longTags = sampleOptions.map((o) => o.value);
const narrow = { width: '320px' /* demo frame */ };

/** A set of tags that does not fit one row: the field grows by whole tag rows and the typing input shares the last one. */
export const MultiRows = {
    render: () => (
        <div style={narrow}>
            <Select label="One site" options={sampleOptions} defaultValue="lincoln" />
            <Select label="Many sites" isMulti options={sampleOptions} defaultValue={longTags} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const single = within(canvasElement).getByRole('combobox', { name: 'One site' }).closest('.plus-field').getBoundingClientRect().height;
        const box = boxOf(canvasElement, 'Many sites');
        const height = box.getBoundingClientRect().height;
        const step = rowStep(box);
        // Whole tag rows past the first, never a blank trailing row.
        await expect(height).toBeGreaterThan(single);
        const rows = (height - single) / step;
        await expect(Math.abs(Math.round(rows) * step - (height - single))).toBeLessThanOrEqual(1);
        const input = box.querySelector('.plus-select-input').getBoundingClientRect();
        const last = tagsIn(box).at(-1).getBoundingClientRect();
        const content = box.querySelector('.plus-field__content').getBoundingClientRect();
        const room = content.right - last.right;
        // The input joins the last tag row when 4ch or more is left on it; otherwise it starts the next one.
        const joined = Math.abs(input.top - last.top) <= 1;
        const fourCh = parseFloat(getComputedStyle(box.querySelector('.plus-select-input')).minWidth);
        await expect(joined || room < fourCh + parseFloat(getComputedStyle(box.querySelector('.plus-field__content')).columnGap)).toBe(true);
        // The box ends where its last row does: the same pad under the content as above it.
        const edge = box.getBoundingClientRect();
        await expect(Math.abs((edge.bottom - Math.max(input.bottom, last.bottom)) - (tagsIn(box)[0].getBoundingClientRect().top - edge.top))).toBeLessThanOrEqual(1);
        await expectTrailingOnFirstRow(box);
    },
};

/** The same long tag set in each overflow mode, for the Behavior › Multi examples. */
const OverflowSet = (props) => (
    <div style={narrow}>
        <Select label="Many sites" isMulti options={sampleOptions} defaultValue={longTags} {...props} />
    </div>
);

/** Wrap, the default: every tag shows and the field grows by rows. Pick it when the picks matter at a glance. */
export const OverflowWrap = {
    name: 'Overflow: wrap',
    render: () => <OverflowSet />,
    play: async ({ canvasElement }) => {
        const box = boxOf(canvasElement, 'Many sites');
        await expect(tagsIn(box)).toHaveLength(longTags.length);
        await expect(box.querySelector('.plus-tag-group__overflow')).toBeNull();
        await expect(box.getBoundingClientRect().height).toBeGreaterThan(40);
        // The group stays a labeled list in the accessibility tree though its box is display: contents.
        const list = within(box).getByRole('list', { name: 'Many sites' });
        await expect(getComputedStyle(list).display).toBe('contents');
        await expect(within(list).getAllByRole('listitem')).toHaveLength(longTags.length);
        await expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
    },
};

/** No wrap: one row that scrolls sideways. Pick it when the field must stay one line and the picks are still all reachable. */
export const OverflowNowrap = {
    name: 'Overflow: nowrap',
    render: () => <OverflowSet lineWrap={false} />,
    play: async ({ canvasElement }) => {
        const box = boxOf(canvasElement, 'Many sites');
        const content = box.querySelector('.plus-field__content');
        await expect(box.getBoundingClientRect().height).toBe(40);
        await expect(tagsIn(box)).toHaveLength(longTags.length);
        await expect(getComputedStyle(content).overflowX).toBe('auto');
        await expect(content.scrollWidth).toBeGreaterThan(content.clientWidth);
        const tops = new Set(tagsIn(box).map((t) => Math.round(t.getBoundingClientRect().top)));
        await expect(tops.size).toBe(1);
    },
};

/** Truncate: one row with a "+n" count until the field is focused, then every tag. Pick it for dense forms and filter bars. */
export const OverflowTruncate = {
    name: 'Overflow: truncate',
    render: () => <OverflowSet truncate />,
    play: async ({ canvasElement }) => {
        const box = boxOf(canvasElement, 'Many sites');
        await expect(box.getBoundingClientRect().height).toBe(40);
        const count = box.querySelector('.plus-tag-group__overflow');
        await expect(count).not.toBeNull();
        await expect(count).toHaveTextContent(/^\+\d+$/);
        await expectTrailingOnFirstRow(box);
        await userEvent.click(within(canvasElement).getByRole('combobox', { name: 'Many sites' }));
        await waitFor(() => expect(tagsIn(box)).toHaveLength(longTags.length));
        await expect(box.querySelector('.plus-tag-group__overflow')).toBeNull();
        await expect(box.getBoundingClientRect().height).toBeGreaterThan(40);
    },
};

export const Searchable = {
    render: () => <div style={field}><Select label="Site" options={sampleOptions} placeholder="Type to search" /></div>,
};

/** A single pick is marked with a check by default; `marker="radio"` draws a radio before the label. Several picks always use checkboxes. */
export const Marker = {
    render: () => (
        <div style={{ ...grid, pointerEvents: 'auto' }}>
            <Select label="Check" options={sampleOptions} defaultValue="lincoln" />
            <Select label="Radio" marker="radio" options={sampleOptions} defaultValue="lincoln" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const picked = async (name) => {
            await userEvent.click(canvas.getByRole('combobox', { name }));
            const body = within(canvasElement.ownerDocument.body);
            const option = await waitFor(() => {
                const found = body.getAllByRole('option').find((row) => row.getAttribute('aria-selected') === 'true');
                expect(found).toBeTruthy();
                return found;
            });
            const marks = {
                radio: option.querySelector('.plus-option-row-check--radio'),
                check: option.querySelector('.plus-option-row-selected-mark'),
            };
            await userEvent.keyboard('{Escape}');
            return marks;
        };
        const check = await picked('Check');
        await expect(check.check).not.toBeNull();
        await expect(check.radio).toBeNull();
        const radio = await picked('Radio');
        await expect(radio.radio).not.toBeNull();
        await expect(radio.radio).toHaveClass('is-checked');
        await expect(radio.check).toBeNull();
    },
};

/** A short list in a form opts out: the field is a plain trigger that opens the list. */
export const NotSearchable = {
    render: () => <div style={field}><Select label="Status" isSearchable={false} options={statusOptions} placeholder="Any status" /></div>,
};

export const Creatable = {
    render: () => <div style={field}><Select label="Sites" isMulti isCreatable options={sampleOptions} placeholder="Type to search or create" /></div>,
};

export const SpacingDefault = {
    render: () => <div style={field}><Select label="Site" spacing="default" options={sampleOptions} placeholder="Select a site" /></div>,
};

export const SpacingCompact = {
    render: () => <div style={field}><Select label="Site" spacing="compact" options={sampleOptions} placeholder="Select a site" /></div>,
};

/** Spacing — default (40) and compact (32). */
export const Spacing = {
    render: () => (
        <div className="sb-select-interactive-override" style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' /* token gap: 20px */ }}>
            <Select label="Default" spacing="default" options={sampleOptions} placeholder="Select a site" />
            <Select label="Compact" spacing="compact" options={sampleOptions} placeholder="Select a site" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('combobox', { name: 'Default' }).closest('.plus-field').getBoundingClientRect().height).toBe(40);
        await expect(canvas.getByRole('combobox', { name: 'Compact' }).closest('.plus-field').getBoundingClientRect().height).toBe(32);
    },
};

const schools = [
    { value: 'north', label: 'North High' },
    { value: 'south', label: 'South High' },
];
const teachers = {
    north: [{ value: 'ng', label: 'Ms. Garcia' }, { value: 'nl', label: 'Mr. Lee' }],
    south: [{ value: 'sp', label: 'Ms. Patel' }],
};

/** DependentFields — the child waits for its parent and clears when the parent changes. */
export const DependentFields = {
    render: () => {
        const [school, setSchool] = useState('');
        const [teacher, setTeacher] = useState('');
        return (
            <div className="sb-select-interactive-override" style={grid}>
                <Select label="School" options={schools} value={school} onChange={setSchool} />
                <Select
                    label="Teacher"
                    options={teachers[school] || []}
                    value={teacher}
                    onChange={setTeacher}
                    dependsOn={{ value: school, label: 'a school' }}
                />
            </div>
        );
    }
};

const tutorNames = [
    'Ari P.', 'Maya K.', 'Jordan T.', 'Elena R.', 'Marcus B.',
    'Priya S.', 'Noah W.', 'Sofia L.', 'Liam D.', 'Chloe M.',
    'Ethan H.', 'Zoe P.', 'Ava C.', 'Leo G.', 'Nora F.',
    'Owen K.', 'Hannah V.', 'Lucas M.', 'Grace T.', 'Caleb R.',
    'Ruby S.', 'Isaac B.', 'Clara N.', 'Julian P.', 'Hazel C.',
    'Miles R.', 'Stella W.', 'Theo J.', 'Iris D.', 'Eli F.',
    'Lydia R.', 'Gavin P.', 'Mila J.', 'Asher L.', 'Naomi P.',
    'Wesley H.', 'Audrey M.', 'Roman F.', 'Carmen G.', 'Darius B.',
    'Camila O.', 'Jonas K.', 'Beatrice C.', 'Simon H.', 'Tessa W.',
    'Mateo S.', 'Claire P.', 'Nathan C.', 'Eva S.', 'Adrian S.',
    'Leah G.', 'Victor W.', 'Sonia M.', 'Callum B.', 'Alice B.',
    'Jasper C.', 'Phoebe D.', 'Rowan W.', 'Dahlia S.', 'Declan H.',
    'Sienna F.', 'Felix S.', 'Corinne L.', 'Tobias N.', 'Molly W.',
    'Cyrus D.', 'Freya M.', 'Oscar B.', 'Gianna H.', 'Arthur S.',
    'Lucy F.', 'Hugo W.', 'Fiona M.', 'Devon B.', 'Talia G.',
    'Jonah L.', 'Vera S.', 'Malcolm C.', 'Kira W.', 'Elias B.',
];
const people = tutorNames.map((name, i) => ({ value: `p${i + 1}`, label: name }));

/** LongList — past 50 options, Recent and Suggested come first and typing searches the rest. */
export const LongList = {
    render: () => (
        <div className="sb-select-interactive-override" style={{ pointerEvents: 'auto', maxWidth: '400px' /* demo frame */ }}>
            <Select label="Tutor" options={people} recent={['p3']} suggested={['p8', 'p21']} />
        </div>
    )
};

/** Rows live in a portal on `document.body`, so they are looked up on the whole page. */
const page = () => within(document.body);

const studentNames = [
    'Ari P.', 'Maya K.', 'Jordan T.', 'Elena R.', 'Marcus B.',
    'Priya S.', 'Noah W.', 'Sofia L.', 'Liam D.', 'Chloe M.',
    'Ethan H.', 'Zane P.', 'Ava C.', 'Leo G.', 'Nora F.',
    'Owen K.', 'Hannah V.', 'Lucas M.', 'Grace T.', 'Caleb R.',
    'Ruby S.', 'Isaac B.', 'Clara N.', 'Julian P.', 'Hazel C.',
    'Miles R.', 'Stella W.', 'Theo J.', 'Iris D.', 'Eli F.',
    'Lydia R.', 'Gavin P.', 'Mila J.', 'Asher L.', 'Naomi P.',
    'Wesley H.', 'Audrey M.', 'Roman F.', 'Carmen G.', 'Darius B.',
    'Camila O.', 'Jonas K.', 'Beatrice C.', 'Simon H.', 'Tessa W.',
    'Mateo S.', 'Claire P.', 'Nathan C.', 'Eva S.', 'Adrian S.',
    'Leah G.', 'Victor W.', 'Sonia M.', 'Callum B.', 'Alice B.',
    'Jasper C.', 'Phoebe D.', 'Rowan W.', 'Dahlia S.', 'Declan H.',
    'Sienna F.', 'Felix S.', 'Corinne L.', 'Tobias N.', 'Molly W.',
    'Cyrus D.', 'Freya M.', 'Oscar B.', 'Gianna H.', 'Arthur S.',
    'Lucy F.', 'Hugo W.', 'Fiona M.', 'Devon B.', 'Talia G.',
    'Jonah L.', 'Vera S.', 'Malcolm C.', 'Kira W.', 'Elias B.',
    'Amara T.', 'Bennett R.', 'Camille D.', 'Desmond K.', 'Eliza N.',
    'Fabian L.', 'Gemma W.', 'Henrik P.', 'Imogen B.', 'Jude M.',
    'Keira H.', 'Landon F.', 'Margot S.', 'Nico V.', 'Ophelia G.',
    'Parker C.', 'Quinn R.', 'Rafael T.', 'Sabrina J.', 'Tristan D.',
    'Uma K.', 'Valerie N.', 'Wyatt B.', 'Xander L.', 'Yara M.',
    'Zuri H.', 'Aiden W.', 'Brielle P.', 'Carter S.', 'Delilah F.',
    'Emmett G.', 'Flora C.', 'Gideon R.', 'Harper T.', 'Isaiah N.',
    'Josie B.', 'Kieran D.', 'Lilah M.', 'Micah V.', 'Nadia W.',
];
const students = studentNames.map((name, i) => ({ value: `s${i + 1}`, label: name }));

/** A server stand-in: filters by the typed text and answers a page after a short wait. */
const loadStudents = (query, { offset, limit }) => new Promise((resolve) => {
    const matches = students.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));
    setTimeout(() => resolve({ options: matches.slice(offset, offset + limit), total: matches.length }), 20);
});

/**
 * Async — `loadOptions` pages in 50 at a time as the list opens, as you type and
 * as you scroll, and the list says how many there are. Typing is on with it.
 */
export const Async = {
    render: () => (
        <div className="sb-select-interactive-override" style={{ pointerEvents: 'auto', maxWidth: '400px' /* demo frame */ }}>
            <Select label="Student" loadOptions={loadStudents} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const field = within(canvasElement).getByRole('combobox', { name: 'Student' });
        await userEvent.click(field);
        await expect(await page().findByText('Showing 50 of 120')).toBeInTheDocument();

        const body = page().getByRole('listbox').closest('.plus-listbox-body');
        body.scrollTop = body.scrollHeight;
        fireEvent.scroll(body);
        await expect(await page().findByText('Showing 100 of 120')).toBeInTheDocument();

        await userEvent.type(field, 'Maya K.');
        await waitFor(() => expect(page().getAllByRole('option')).toHaveLength(1));
        await expect(page().getByRole('option', { name: 'Maya K.' })).toBeInTheDocument();
        await expect(page().queryByText(/^Showing/)).toBeNull();
    },
};

/** AsyncCreatable — `isCreatable` works over loaded options: what nothing matches can be created. */
export const AsyncCreatable = {
    render: () => (
        <div className="sb-select-interactive-override" style={{ pointerEvents: 'auto', maxWidth: '400px' /* demo frame */ }}>
            <Select label="Student" isCreatable loadOptions={loadStudents} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const field = within(canvasElement).getByRole('combobox', { name: 'Student' });
        await userEvent.click(field);
        await userEvent.type(field, 'Zoe Park');
        await userEvent.click(await page().findByRole('option', { name: /Create\s+Zoe Park/ }));
        await waitFor(() => expect(field).toHaveValue('Zoe Park'));
    },
};

/** Until the first page arrives, the list shows one "Loading options" row. Never skeleton rows. */
export const AsyncLoading = {
    render: () => (
        <div className="sb-select-interactive-override" style={{ pointerEvents: 'auto', maxWidth: '400px' /* demo frame */ }}>
            <Select label="Teacher" options={[]} isLoading defaultOpen />
        </div>
    ),
    play: async () => {
        // The list also announces it, so the row is found by its own class.
        await waitFor(() => expect(document.querySelector('.plus-listbox-message--loading')).toHaveTextContent('Loading options'));
    },
};

/** When a request fails, the list says "Couldn't load options" with Retry, which asks for the same page again. */
export const AsyncFailed = {
    render: () => {
        const calls = React.useRef(0);
        const loadOptions = (query, paging) => {
            calls.current += 1;
            return calls.current === 1 ? Promise.reject(new Error('offline')) : loadStudents(query, paging);
        };
        return (
            <div className="sb-select-interactive-override" style={{ pointerEvents: 'auto', maxWidth: '400px' /* demo frame */ }}>
                <Select label="Student" loadOptions={loadOptions} />
            </div>
        );
    },
    play: async ({ canvasElement }) => {
        const field = within(canvasElement).getByRole('combobox', { name: 'Student' });
        await userEvent.click(field);
        await waitFor(() => expect(document.querySelector('.plus-listbox-message--error')).toHaveTextContent("Couldn't load options"));
        await userEvent.click(page().getByRole('button', { name: 'Retry' }));
        await expect(await page().findByText('Showing 50 of 120')).toBeInTheDocument();
        await expect(document.querySelector('.plus-listbox-message--error')).toBeNull();
    },
};

/** Overview — Single-select default for docs landing. */
export const Overview = {
    render: () => (
        <div
            className="sb-select-interactive-override"
            style={{ pointerEvents: 'auto', maxWidth: '400px' /* demo frame */, width: '100%' }}
        >
            <Select aria-label="Site" options={sampleOptions} placeholder="Select a site" />
        </div>
    ),
    parameters: {
        docs: {
            source: { language: 'jsx', code: webAppSourceSnippets.formSelect }
        }
    }
};

/**
 * Interactive
 * Full playground with controls
 */
export const Interactive = {
    render: (args) => {
        const [value, setValue] = useState(args.isMulti ? [] : '');

        useEffect(() => {
            setValue(args.isMulti ? [] : '');
        }, [args.isMulti]);

        return (
            <div style={{ maxWidth: '400px' /* demo frame */ }}>
                <p style={{ margin: '0 0 var(--stack-md)', font: 'var(--body-sm)', color: 'var(--ds-text-subtle)' }}>
                    Selected: {args.isMulti
                        ? (value.length > 0 ? value.join(', ') : 'None')
                        : (value || 'None')
                    }
                </p>
                <Select
                    {...args}
                    options={sampleOptions}
                    value={value}
                    onChange={setValue}
                />
            </div>
        );
    },
    args: {
        isMulti: false,
        label: 'Site',
        placeholder: 'Select a site',
        caption: '',
        isSearchable: true,
        isCreatable: false,
        displayMode: 'tags',
        spacing: 'default',
        isInvalid: false,
        isDisabled: false,
        isReadOnly: false,
        commitOnClose: false,
        selectAll: false,
    }
};

const COLOR_OPTIONS = [
    { value: 'lincoln-middle', label: 'Lincoln Middle' },
    { value: 'north-high', label: 'North High' },
    { value: 'south-high', label: 'South High' },
];

/**
 * The placeholder is `text.subtlest` and the caret `icon.subtle`. In the list,
 * "Select all" draws the input's mark until every option is picked, then the
 * Lagoon checked mark; picked rows are neutral selection with a Lagoon mark.
 */
export const Colors = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-xl)', maxWidth: '320px' /* demo frame */ }}>
            <Select label="Site" options={COLOR_OPTIONS} placeholder="Pick a site" />
            <Select label="Sites" isMulti selectAll options={COLOR_OPTIONS} defaultValue={['lincoln-middle']} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const subject = canvas.getByRole('combobox', { name: 'Site' });
        const caret = canvasElement.querySelector('.plus-select-caret');
        await userEvent.click(canvas.getByRole('combobox', { name: 'Sites' }));
        const all = await waitFor(() => {
            const el = document.querySelector('.plus-select-all');
            if (!el) throw new Error('the list has not opened');
            return el;
        });
        const mark = all.querySelector('.plus-select-all-mark');
        const picked = document.querySelector('.plus-option-row.is-selected');
        await inEveryColorModeOf(canvasElement, async (mode, token) => {
            await expect(getComputedStyle(subject, '::placeholder').color, `${mode}: placeholder`).toBe(token('--ds-text-subtlest'));
            await expect(getComputedStyle(caret).color, `${mode}: caret`).toBe(token('--ds-icon-subtle'));
            await expect(getComputedStyle(mark).borderTopColor, `${mode}: select-all mark edge`).toBe(token('--ds-border-input'));
            await expect(getComputedStyle(mark).backgroundColor, `${mode}: select-all mark fill`).toBe(token('--ds-background-input'));
            const pickedFill = picked.classList.contains('is-highlighted') ? '--ds-background-selected-hovered' : '--ds-background-selected';
            await expect(getComputedStyle(picked).backgroundColor, `${mode}: picked row`).toBe(token(pickedFill));
            await expect(getComputedStyle(picked.querySelector('.plus-option-row-check')).backgroundColor, `${mode}: the picked row's mark`).toBe(token('--ds-background-selected-bold'));
        });
        await userEvent.click(all);
        await waitFor(() => expect(mark).toHaveClass('is-checked'));
        await inEveryColorModeOf(canvasElement, async (mode, token) => {
            await expect(getComputedStyle(mark).backgroundColor, `${mode}: checked mark fill`).toBe(token('--ds-background-selected-bold'));
            await expect(getComputedStyle(mark).borderTopColor, `${mode}: checked mark edge`).toBe(token('--ds-border-selected'));
            await expect(getComputedStyle(mark).color, `${mode}: checked mark`).toBe(token('--ds-icon-inverse'));
        });
        await userEvent.keyboard('{Escape}');
    },
};

/** One story per state, for the Examples tab. */
const controlOf = (canvasElement) => within(canvasElement).getByRole('combobox', { name: 'Site' });
const wrap = { maxWidth: '400px' /* demo frame */, minHeight: '40px' /* demo frame */ };

export const Rest = {
    render: () => <div style={wrap}><Select id="select-ex-rest" label="Site" options={sampleOptions} placeholder="Select a site" /></div>,
    play: async ({ canvasElement }) => expectRest(canvasElement, controlOf(canvasElement)),
};

export const Hovered = {
    render: () => <div style={wrap}><Select id="select-ex-hover" label="Site" options={sampleOptions} placeholder="Select a site" /></div>,
    play: async ({ canvasElement }) => expectHovered(canvasElement, controlOf(canvasElement)),
};

export const Focused = {
    render: () => <div style={wrap}><Select id="select-ex-focus" label="Site" options={sampleOptions} placeholder="Select a site" /></div>,
    play: async ({ canvasElement }) => expectFocused(canvasElement, controlOf(canvasElement)),
};

export const FieldDisabled = {
    render: () => <div style={wrap}><Select id="select-ex-disabled" label="Site" options={sampleOptions} placeholder="Select a site" isDisabled /></div>,
    play: async ({ canvasElement }) => expectDisabled(canvasElement, controlOf(canvasElement)),
};

export const FieldInvalid = {
    render: () => <div style={wrap}><Select id="select-ex-invalid" label="Site" options={sampleOptions} placeholder="Select a site" isInvalid errorMessage="Choose a site." /></div>,
    play: async ({ canvasElement }) => expectInvalid(canvasElement, controlOf(canvasElement)),
};

export const FieldReadOnly = {
    render: () => <div style={wrap}><Select id="select-ex-readonly" label="Site" options={sampleOptions} placeholder="Select a site" isReadOnly /></div>,
    play: async ({ canvasElement }) => {
        await expectReadOnly(canvasElement, controlOf(canvasElement));
        // Nothing to open: the chevron is not drawn, and a press or Enter leaves the list shut.
        await expect(canvasElement.querySelector('.plus-select-caret')).toBeNull();
        await expect(controlOf(canvasElement)).toHaveAttribute('aria-readonly', 'true');
        await userEvent.click(controlOf(canvasElement));
        await userEvent.keyboard('{Enter}');
        await expect(controlOf(canvasElement)).toHaveAttribute('aria-expanded', 'false');
    },
};

/** A read-only Select shows the option's label, never its value. */
export const FieldReadOnlyShowsLabel = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={wrap}>
            <Select id="select-ex-readonly-label" label="Site" isReadOnly value="lincoln" options={[{ value: 'lincoln', label: 'Lincoln Middle' }]} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const control = within(canvasElement).getByRole('combobox', { name: 'Site' });
        const shown = control.value ?? control.textContent;
        await expect(shown).toContain('Lincoln Middle');
        await expect(shown).not.toContain('lincoln');
    },
};

/** A read-only value is shown whole: it wraps, and is never clipped to one line. */
export const FieldReadOnlyLongValue = {
    render: () => (
        <div style={{ ...wrap, maxWidth: '200px' /* token gap: 200px */ }}>
            <Select
                id="select-ex-readonly-long"
                label="Lesson topic"
                isReadOnly
                value="long"
                options={[{ value: 'long', label: 'Two-step linear equations with variables on both sides and word problems' }]}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const text = canvasElement.querySelector('.plus-select-text');
        await expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth);
        await expect(getComputedStyle(text).textOverflow).toBe('clip');
    },
};

/** The open list has one edge, the shadow's ring: no painted border (a transparent one stays for forced colors). */
export const OpenListEdge = {
    parameters: { docs: { disable: true } },
    render: () => <div style={field}><Select label="Site" options={sampleOptions} placeholder="Select a site" /></div>,
    play: async ({ canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole('combobox', { name: 'Site' }));
        const list = await waitFor(() => {
            const el = document.querySelector('.plus-listbox');
            if (!el) throw new Error('the list has not opened');
            return el;
        });
        const style = getComputedStyle(list);
        await expect(style.borderTopColor, 'no painted border').toBe('rgba(0, 0, 0, 0)');
        await expect(style.boxShadow, 'the overlay shadow is the edge').toBe(computedShadow(canvasElement, 'var(--ds-shadow-overlay)'));
        await userEvent.keyboard('{Escape}');
    },
};

export const MotionOpenClose = {
    render: () => <Select label="Student" options={['Ana Ruiz', 'Daniel Lee']} />,
    play: selectMotionPlay(),
};
export const MotionReduced = { ...MotionOpenClose, decorators: [withReducedMotion], play: selectMotionPlay(true) };

export const MotionKeyboardOpen = {
    ...MotionOpenClose,
    play: async ({ canvasElement }) => {
        const field = within(canvasElement).getByRole('combobox');
        field.focus();
        await userEvent.keyboard('{ArrowDown}');
        const surface = await waitFor(() => {
            const element = canvasElement.ownerDocument.querySelector('.plus-listbox');
            expect(element).not.toBeNull();
            return element;
        });
        await expect(getComputedStyle(surface).animationName).toBe('none');
        await expect(surface).toBeVisible();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(surface.isConnected).toBe(false));
    },
};
