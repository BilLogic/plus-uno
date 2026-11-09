import React from 'react';
import { Breadcrumb, Sidebar } from '@/components';
import { Frame } from '@/patterns';

/**
 * Story chrome shared by the pattern stories: a demo caption, a dashed
 * content slot, and the two templates: the app frame with the PLUS Sidebar and
 * a breadcrumb in it, and the focused frame for one task.
 * Every color is a `--ds-*` token, so the chrome follows the color modes
 * with the patterns it frames.
 */

/** A demo's caption: a group name above an example, in the subtle text color. */
export const DemoLabel = ({ children }) => (
    <span
        style={{
            display: 'block',
            marginBottom: 'var(--stack-md)',
            font: 'var(--heading-xxsmall)',
            textTransform: 'uppercase',
            color: 'var(--ds-text-subtle)',
        }}
    >
        {children}
    </span>
);

/** A dashed placeholder for a slot, labeled. */
export const slotContent = (label) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(var(--control-lg) * 2)',
            border: 'var(--border-default) dashed var(--ds-border-bold)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--ds-text-subtle)',
        }}
        className="body-large"
    >
        {label}
    </div>
);

const BREADCRUMBS = [{ text: 'Home', href: '#' }, { text: 'Dashboard' }];
const ACCOUNT = { id: 'john-doe', name: 'John Doe', role: 'Lead' };

/**
 * The app frame at full height: the tutor Sidebar with `account` in its
 * account row, `breadcrumbs` in the Page's header row, and `children` in the
 * surface. `height` sizes the box the
 * frame fills (the viewport by default). Any other prop goes to Frame.
 */
export const InAppFrame = ({ breadcrumbs = BREADCRUMBS, account = ACCOUNT, height = '100vh', children, ...frameProps }) => (
    <div style={{ height }}>
        <Frame
            header={<Breadcrumb items={breadcrumbs} />}
            sidebar={<Sidebar user="tutor" activeTabId="home" account={account} />}
            {...frameProps}
        >
            {children}
        </Frame>
    </div>
);

/**
 * The focused template: the Frame with no sidebar, for one task. The Page's
 * header row leads with Back, carries the task's name as the page's one `h1`
 * at Heading/xsmall on one line, and ends with Close; the Frame draws each
 * button only with its handler. The content sits at reading width, and
 * `actions` sit at the foot of the Page, end-aligned in a group named by
 * `actionsLabel`, held there while the Page scrolls. Any other prop goes to
 * Frame.
 */
export const FocusedFrame = ({ title, actions, actionsLabel = 'Page actions', height = '100%', children, ...frameProps }) => (
    <div style={{ height }}>
        <Frame
            header={(
                <h1
                    style={{
                        flex: '1 1 auto',
                        minWidth: 0,
                        margin: 0,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        font: 'var(--heading-xsmall)',
                        color: 'var(--ds-text)',
                    }}
                >
                    {title}
                </h1>
            )}
            width="reading"
            {...frameProps}
        >
            {children}
            {actions ? (
                <div
                    role="group"
                    aria-label={actionsLabel}
                    style={{
                        position: 'sticky',
                        bottom: 0,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 'var(--focused-page-inline-sm)',
                        paddingBlock: 'var(--focused-page-stack-sm)',
                        backgroundColor: 'var(--ds-surface)',
                    }}
                >
                    {actions}
                </div>
            ) : null}
        </Frame>
    </div>
);
