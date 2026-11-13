import React, { useEffect, useState } from 'react';

import { Avatar, Button, ButtonItem, DropdownMenu, FilterMenu, IconButton, Icon, LinkItem, Popup, PopupSelect, Section, initialsOf } from '@/components';

/**
 * The Popup template's examples: the real PLUS parts, each layer held open in a
 * stage that reserves its room. A layer mounts inside its stage (its
 * `container`), so a picture scales and clips with the stage and the page
 * around it never gains a floating box.
 */

/** The width the type pictures lay out at, in px. Docs geometry. */
export const TYPE_STAGE = 480;

/** The screen a stage reads the column steps at: the widest screen the step table lists, in px. Docs geometry. */
export const READ_SCREEN = 1280;

/** The stage's own padding, so a trigger never touches the edge of the picture. */
const STAGE_PAD = 'var(--page-pad)';

/**
 * A stand-in for the page: a bar with one trigger, at the start or the end of
 * it, over room for the layer it opens. `children` receives the mount element,
 * which is `null` until the stage has rendered once.
 *
 * @param {object} props
 * @param {number} props.height  the stage's height: docs geometry, in px
 * @param {'start'|'end'} [props.side]  which end of the bar the trigger sits at
 * @param {'start'|'end'} [props.align]  whether the bar sits at the top of the stage or the bottom, where a layer has no room below
 */
export const PopupStage = ({ height, side = 'start', align = 'start', children }) => {
    const [mount, setMount] = useState(null);
    // A held-open picture shows the open layer, not the focus ring a real open moves into it.
    useEffect(() => {
        if (!mount) return undefined;
        // A picture drawn at a scale lays out after the layer first places itself, so the layer is placed again once it has settled.
        const replace = setTimeout(() => window.dispatchEvent(new Event('resize')), 250); // docs-literal: after the picture is scaled
        const id = setTimeout(() => { if (mount.contains(document.activeElement)) document.activeElement.blur(); }, 400); // docs-literal: after the open settles
        return () => { clearTimeout(replace); clearTimeout(id); };
    }, [mount]);
    return (
        <div
            ref={setMount}
            data-popup-stage
            style={{
                position: 'relative',
                overflow: 'hidden',
                boxSizing: 'border-box',
                blockSize: height,
                padding: STAGE_PAD,
                display: 'flex',
                alignItems: align === 'end' ? 'flex-end' : 'flex-start',
                justifyContent: side === 'end' ? 'flex-end' : 'flex-start',
                '--plus-overlay-screen': `${READ_SCREEN}px`,
                background: 'var(--ds-surface)',
                border: 'var(--border-default) solid var(--ds-border)',
                borderRadius: 'var(--radius-md)',
            }}
        >
            {mount ? children(mount) : null}
        </div>
    );
};

const noop = () => {};

/** The shortest list of rows a menu holds; the verb leads each label. */
export const MenuRows = () => (
    <>
        <ButtonItem>Reschedule</ButtonItem>
        <ButtonItem>Export notes</ButtonItem>
        <ButtonItem>Duplicate session</ButtonItem>
        <ButtonItem>Cancel session</ButtonItem>
    </>
);

/** Menu: actions from a More button at the end of a bar, applied on pick. */
export const Menu = ({ mount, rows, ...props }) => (
    <DropdownMenu isOpen onOpenChange={noop} container={mount} placement="bottom-end" trigger={<IconButton icon="ellipsis" label="More" />} {...props}>
        {rows ?? <MenuRows />}
    </DropdownMenu>
);

/** Select list: one category, picked as you go. */
export const SelectList = ({ mount, ...props }) => (
    <PopupSelect
        open
        onOpenChange={noop}
        container={mount}
        label="Status"
        defaultValue="Upcoming"
        options={['Upcoming', 'Completed', 'Canceled']}
        isSearchable={false}
        placement="bottom-start"
        {...props}
    />
);

export const SIDE_BY_SIDE = [
    { id: 'status', label: 'Status', options: ['Upcoming', 'Completed', 'Canceled'] },
    { id: 'subject', label: 'Subject', options: ['Math', 'Reading', 'Science'] },
];

export const STACKED = [
    ...SIDE_BY_SIDE,
    { id: 'grade', label: 'Grade', options: ['6', '7', '8'] },
    { id: 'format', label: 'Format', options: ['Online', 'In person'] },
];

/** Filter menu: categories held until Apply, off the Filter icon at the end of the bar. */
export const FilterMenuLayer = ({ mount, categories = SIDE_BY_SIDE, defaultValue, ...props }) => (
    <FilterMenu open onOpenChange={noop} container={mount} categories={categories} defaultValue={defaultValue} {...props} />
);

/** Profile menu: who is signed in, then links and Sign out. */
export const ProfileMenu = ({ mount, ...props }) => (
    <DropdownMenu
        isOpen
        onOpenChange={noop}
        container={mount}
        placement="bottom-start"
        spacing="compact"
        trigger={<Button text="Maya · Tutor" appearance="subtle" spacing="compact" iconBefore={<Avatar initials={initialsOf('Maya Chen')} size={24} />} aria-label="Maya Chen, Tutor: account menu" />}
        {...props}
    >
        <Section title="Maya Chen · Tutor">
            <ButtonItem elemBefore={<Icon name="user" />}>Profile</ButtonItem>
            <LinkItem href="#help" elemBefore={<Icon name="circle-question" />}>Help Center</LinkItem>
            <ButtonItem elemBefore={<Icon name="arrow-right-from-bracket" />}>Sign out</ButtonItem>
        </Section>
    </DropdownMenu>
);

/** Content: a short explanation at 4-col, the cap. */
export const Content = ({ mount, width = '4-col', ...props }) => (
    <Popup
        show
        triggerType="manual"
        container={mount}
        width={width}
        placement="bottom-start"
        title="Session notes"
        trigger={<Button text="Notes" spacing="compact" />}
        {...props}
    >
        Notes stay with the session. The tutor sees them first, and parents never see them.
    </Popup>
);
