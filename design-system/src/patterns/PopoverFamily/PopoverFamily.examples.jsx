import React from 'react';
import { Button, Dropdown, Input, Popover } from '@/components';

/**
 * Live compositions for the Popover family page's do and don't pairs. The
 * Popup is the real Popover component held open, and the Menu is a real
 * Dropdown held open. The heights and flex layouts below are stage geometry:
 * they reserve room for a layer that floats outside the flow.
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
            <Popover
                triggerType="manual"
                show={open}
                placement="bottom-start"
                title={title}
                trigger={<span style={{ display: 'inline-flex' }}><Button text="Open popup" style="secondary" fill="outline" size="small" /></span>}
            >
                {children}
            </Popover>
        </div>
    );
};

/** A few short rows answer the question without leaving the page. */
export const PopupShortList = () => (
    <Plain>
        <HeldPopup title="Today’s sessions">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-sm)' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-md)' }}>
                <Input label="Student" placeholder="Select a student" size="small" />
                <Input label="Note" placeholder="Write a note" size="small" />
                <div><Button text="Save" style="primary" fill="filled" size="small" onClick={() => {}} /></div>
            </div>
        </HeldPopup>
    </Plain>
);

/** Short labels, with a description only on the rows that need one. */
export const MenuShortLabels = () => (
    <Plain height={248}>
        <div style={{ display: 'flex', alignItems: 'flex-end', minHeight: 248 }}>
            <Dropdown
                buttonText="Actions"
                direction="dropup"
                isOpen
                items={[
                    { text: 'Group heading', header: true },
                    { text: 'Reschedule', description: 'Pick a new time and notify the tutor' },
                    { text: 'Duplicate session' },
                    { text: 'Cancel session', description: 'Students are told right away' },
                    { text: 'Export notes' },
                ]}
            />
        </div>
    </Plain>
);

/** A whole sentence as the label wraps and crowds the row. */
export const MenuSentenceLabel = () => (
    <Plain height={248}>
        <div style={{ display: 'flex', alignItems: 'flex-end', minHeight: 248 }}>
            <Dropdown
                buttonText="Actions"
                direction="dropup"
                isOpen
                items={[
                    { text: 'Group heading', header: true },
                    { text: 'Reschedule this session to a later date and tell the tutor lead why' },
                    { text: 'Duplicate session' },
                    { text: 'Cancel session' },
                    { text: 'Export notes' },
                ]}
            />
        </div>
    </Plain>
);
