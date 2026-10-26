import React from 'react';
import { Popover as RBPopover } from 'react-bootstrap';
import { Button, Dropdown, Input } from '@/components';

/**
 * Live compositions for the Popover family page's do and don't pairs. The
 * Popup is drawn in place with the Popup's own classes, so it needs no
 * trigger; the Menu is a real Dropdown held open.
 */

/** Keeps the docs page's heading and list styles off the examples. */
const Plain = ({ children, height }) => (
    <div className="docs-story sb-unstyled" style={{ width: '100%', minHeight: height }}>{children}</div>
);

const row = { margin: 0, font: 'var(--body-default)' };

const popup = (title, body) => (
    <div className="plus-popover-overview-static" style={{ padding: 0, justifyContent: 'flex-start' }}>
        <RBPopover className="plus-popover" placement="bottom">
            <RBPopover.Header className="plus-popover-title">{title}</RBPopover.Header>
            <RBPopover.Body className="plus-popover-body">{body}</RBPopover.Body>
        </RBPopover>
    </div>
);

/** A few short rows answer the question without leaving the page. */
export const PopupShortList = () => (
    <Plain>
        {popup('Today’s sessions', (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-sm)' }}>
                <p style={row}>4:30 PM · Algebra I</p>
                <p style={row}>5:30 PM · Geometry</p>
                <p style={row}>6:15 PM · Reading lab</p>
            </div>
        ))}
    </Plain>
);

/** A form in a popup asks the person to work inside a floating box. */
export const PopupForm = () => (
    <Plain>
        {popup('Add a note', (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-md)' }}>
                <Input label="Student" placeholder="Select a student" size="small" />
                <Input label="Note" placeholder="Write a note" size="small" />
                <div><Button text="Save" style="primary" fill="filled" size="small" onClick={() => {}} /></div>
            </div>
        ))}
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
