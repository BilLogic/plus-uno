import React from 'react';
import { Button, DropdownMenu, TextField, Popup, ButtonItem, Section, Tooltip } from '@/components';


/**
 * Live compositions for the Popups pattern page's do and don't pairs. The
 * Popup is the real Popup component held open, and the Menu is a real
 * DropdownMenu held open. The heights and flex layouts below are stage
 * geometry: they reserve room for a layer that floats outside the flow.
 */

/** Keeps the docs page's heading and list styles off the examples. */
const Plain = ({ children, height }) => (
    <div className="docs-story sb-unstyled" style={{ width: '100%', minHeight: height }}>{children}</div>
);

const row = { margin: 0, font: 'var(--body-default)' };

/** Opens a beat after mounting: the placement engine measures the trigger through a ref, attached after the first render. */
const HeldPopup = ({ title, children }) => {
    const [open, setOpen] = React.useState(false);
    React.useEffect(() => { setOpen(true); }, []);
    return (
        <div style={{ minHeight: 300 }}>
            <Popup
                triggerType="manual"
                show={open}
                placement="bottom-start"
                title={title}
                trigger={<span style={{ display: 'inline-flex' }}><Button text="Open popup" spacing="compact" /></span>}
            >
                {children}
            </Popup>
        </div>
    );
};

/** A few short rows answer the question without leaving the page. */
export const PopupShortList = () => (
    <Plain>
        <HeldPopup title="Today’s sessions">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                <p style={row}>4:30 PM · Algebra I</p>
                <p style={row}>5:30 PM · Geometry</p>
                <p style={row}>6:15 PM · Reading lab</p>
            </div>
        </HeldPopup>
    </Plain>
);

/** A form in a popup asks the person to work inside a floating box. */
export const PopupForm = () => (
    <Plain>
        <HeldPopup title="Add a note">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                <TextField label="Student" placeholder="Select a student" spacing="compact" />
                <TextField label="Note" placeholder="Write a note" spacing="compact" />
                <div><Button text="Save" appearance="primary" spacing="compact" onClick={() => {}} /></div>
            </div>
        </HeldPopup>
    </Plain>
);

/** Short labels, with a description only on the rows that need one. */
export const MenuShortLabels = () => (
    <Plain height={248}>
        <div style={{ display: 'flex', alignItems: 'flex-end', minHeight: 248 }}>
            <DropdownMenu trigger={<Button text="Actions" spacing="compact" />} placement="top-start" isOpen>
                <Section title="Group heading">
                    <ButtonItem onClick={() => {}} description="Pick a new time and notify the tutor">Reschedule</ButtonItem>
                    <ButtonItem onClick={() => {}}>Duplicate session</ButtonItem>
                    <ButtonItem onClick={() => {}} description="Students are told right away">Cancel session</ButtonItem>
                    <ButtonItem onClick={() => {}}>Export notes</ButtonItem>
                </Section>
            </DropdownMenu>
        </div>
    </Plain>
);

/** A whole sentence as the label runs past the menu and is cut off. */
export const MenuSentenceLabel = () => (
    <Plain height={248}>
        <div style={{ display: 'flex', alignItems: 'flex-end', minHeight: 248 }}>
            <DropdownMenu trigger={<Button text="Actions" spacing="compact" />} placement="top-start" isOpen>
                <Section title="Group heading">
                    <ButtonItem onClick={() => {}}>Reschedule this session to a later date and tell the tutor lead why</ButtonItem>
                    <ButtonItem onClick={() => {}}>Duplicate session</ButtonItem>
                    <ButtonItem onClick={() => {}}>Cancel session</ButtonItem>
                    <ButtonItem onClick={() => {}}>Export notes</ButtonItem>
                </Section>
            </DropdownMenu>
        </div>
    </Plain>
);

/** Opens the tooltip a beat after mounting, as `HeldPopup` does. */
const HeldTooltip = ({ text }) => {
    const [open, setOpen] = React.useState(false);
    React.useEffect(() => { setOpen(true); }, []);
    return (
        <div style={{ minHeight: 136, display: 'flex', alignItems: 'flex-end' }}>
            <Tooltip show={open} placement="top" text={text}>
                <Button text="Copy" spacing="compact" />
            </Tooltip>
        </div>
    );
};

/** A tooltip names its control in a few words. */
export const TooltipShort = () => (
    <Plain><HeldTooltip text="Copy link" /></Plain>
);

/** A tooltip that wraps into a paragraph. */
export const TooltipParagraph = () => (
    <Plain>
        <HeldTooltip text="Copies a link to this lesson plan so you can paste it into a message, an email or a shared document, then opens the sharing settings." />
    </Plain>
);
