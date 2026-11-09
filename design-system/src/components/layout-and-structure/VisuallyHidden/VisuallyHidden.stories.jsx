import React from 'react';
import { Button } from '@/components';
import { expect, within } from 'storybook/test';

import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import VisuallyHidden from './VisuallyHidden';
import { iconClass } from '../../../lib/icon';

/**
 * `VisuallyHidden` -- text for assistive technology that is not drawn.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser. "Hidden visually" is asserted as what a person could
 * observe: the rendered box is one pixel and clipped, so nothing paints.
 * "Present for assistive technology" is asserted through the roles and names
 * Testing Library computes from the accessibility tree, which leaves out
 * anything `display: none`, `visibility: hidden` or `aria-hidden`. Never a class.
 */

export default {
    title: 'Components/Layout and structure/Visually hidden',
    component: VisuallyHidden,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Content that screen readers announce and nobody sees: a one-pixel clipped span. '
                    + 'It takes no tokens, because it paints nothing.',
            },
        },
    },
    argTypes: {
        children: { control: 'text' },
        id: { control: false },
        role: { control: 'text' },
    },
};

/** Asserts an element draws nothing: a one-pixel box, clipped, out of the flow. */
const expectNotDrawn = async (el, name, mode) => {
    const style = getComputedStyle(el);
    const { width, height } = el.getBoundingClientRect();
    await expect(width, `${name} is 1px wide, ${mode}`).toBeLessThanOrEqual(1);
    await expect(height, `${name} is 1px tall, ${mode}`).toBeLessThanOrEqual(1);
    await expect(style.position, `${name} is out of the flow, ${mode}`).toBe('absolute');
    await expect(style.overflow, `${name} clips its content, ${mode}`).toBe('hidden');
    await expect(style.clip, `${name} is clipped to nothing, ${mode}`).toBe('rect(0px, 0px, 0px, 0px)');
};

/**
 * Asserts an element is not removed from the accessibility tree, which is what
 * separates it from `display: none` and `visibility: hidden`.
 */
const expectInTree = async (el, name) => {
    const style = getComputedStyle(el);
    await expect(style.display, `${name} is not display none`).not.toBe('none');
    await expect(style.visibility, `${name} is not visibility hidden`).toBe('visible');
    await expect(el.closest('[aria-hidden="true"], [hidden]'), `${name} is not aria-hidden`).toBeNull();
};

/* ------------------------------------------------------------------ default */

export const Overview = () => (
    <p className="plus-body-1" style={{ margin: 0 }}>
        Order total: $42.00
        <VisuallyHidden>, including shipping</VisuallyHidden>
    </p>
);

/**
 * The text is in the document and draws nothing, in every color mode, and the
 * visible text around it is unchanged.
 */
Overview.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const hidden = canvas.getByText(', including shipping');
    await inEveryColorMode((mode) => expectNotDrawn(hidden, 'the hidden text', mode));
    await expectInTree(hidden, 'the hidden text');
    await expect(hidden.tagName, 'it is a span').toBe('SPAN');
    await expect(canvas.getByText(/Order total/), 'visible text still draws').toBeVisible();
};

/* ------------------------------------------------------------ accessible name */

export const NamesAControl = () => (
    <Button iconBefore="trash">
        <VisuallyHidden>Delete session</VisuallyHidden>
    </Button>
);

/**
 * An icon-only button has no visible label; the hidden text is its name. The
 * query finds the button by that name, which only works if the text is in the
 * accessibility tree.
 */
NamesAControl.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Delete session' });
    const label = canvas.getByText('Delete session');
    await inEveryColorMode((mode) => expectNotDrawn(label, 'the label', mode));
    await expectInTree(label, 'the label');
    await expect(button.getBoundingClientRect().width, 'the button stays its own size').toBe(40);
};

/* ----------------------------------------------------------------- header cell */

export const HiddenColumnHeaders = () => (
    <table className="table" style={{ maxWidth: 420 }}>
        <thead>
            <tr>
                <th scope="col"><VisuallyHidden>Select</VisuallyHidden></th>
                <th scope="col">Student</th>
                <th scope="col"><VisuallyHidden>Actions</VisuallyHidden></th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><input type="checkbox" aria-label="Select Ada" /></td>
                <td>Ada</td>
                <td><i className={iconClass('ellipsis')} aria-hidden="true" /></td>
            </tr>
        </tbody>
    </table>
);

/**
 * Columns with no visible title still have headers: both are columnheader
 * roles with a name, so a screen reader announces them as the cells are read.
 */
HiddenColumnHeaders.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ['Select', 'Actions']) {
        const header = canvas.getByRole('columnheader', { name });
        await expect(header, `${name} column has a header`).toBeInTheDocument();
        await expectInTree(canvas.getByText(name), `${name} label`);
    }
    await inEveryColorMode((mode) => expectNotDrawn(canvas.getByText('Select'), 'the Select label', mode));
    await expect(canvas.getByRole('columnheader', { name: 'Student' }), 'the visible header is unchanged').toBeVisible();
};

/* ------------------------------------------------------------- id and role */

export const RoleAndId = () => (
    <div>
        <Button appearance="primary" aria-describedby="vh-results">Search</Button>
        <VisuallyHidden id="vh-results" role="status">12 results found</VisuallyHidden>
    </div>
);

/** `role` and `id` reach the element, so it can be a live region or a description target. */
RoleAndId.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const status = canvas.getByRole('status');
    await expect(status, 'role status is in the tree').toHaveTextContent('12 results found');
    await expect(status.id, 'id is applied').toBe('vh-results');
    await inEveryColorMode((mode) => expectNotDrawn(status, 'the status', mode));
    await expect(canvas.getByRole('button', { name: 'Search' }), 'the id describes the button')
        .toHaveAccessibleDescription('12 results found');
};

/* -------------------------------------------------------------- playground */

export const Interactive = (args) => (
    <p className="plus-body-1" style={{ margin: 0 }}>
        Visible text.
        <VisuallyHidden {...args} />
    </p>
);
Interactive.args = {
    children: ' This sentence is only announced.',
};
Interactive.argTypes = {
    children: { control: 'text' },
    role: { control: 'text' },
};
