import React from 'react';
import { Sidebar } from '@/components';
import { Frame, Topbar } from '@/patterns';

/**
 * Story chrome shared by the pattern stories: a demo caption, a dashed
 * content slot, and the app frame with the PLUS Topbar and Sidebar in it.
 * Every color is a `--ds-*` token, so the chrome follows the color modes
 * with the patterns it frames.
 */

/** A demo's caption: a group name above an example, in the subtle text color. */
export const DemoLabel = ({ children }) => (
    <span
        style={{
            display: 'block',
            marginBottom: 'var(--element-stack-md)',
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
            minHeight: '96px',
            border: 'var(--size-element-border) dashed var(--ds-border-bold)',
            borderRadius: 'var(--size-element-radius-md)',
            color: 'var(--ds-text-subtle)',
        }}
        className="body1-txt"
    >
        {label}
    </div>
);

const BREADCRUMBS = [{ text: 'Home', href: '#' }, { text: 'Dashboard' }];
const USER = { name: 'John Doe', type: 'lead tutor' };

/**
 * The app frame at full height: a Topbar with `breadcrumbs` and `user`, the
 * tutor Sidebar, and `children` in the surface. `height` sizes the box the
 * frame fills (the viewport by default). Any other prop goes to Frame.
 */
export const InAppFrame = ({ breadcrumbs = BREADCRUMBS, user = USER, height = '100vh', children, ...frameProps }) => (
    <div style={{ height }}>
        <Frame
            topbar={<Topbar breadcrumbs={breadcrumbs} user={user} />}
            sidebar={<Sidebar user="tutor" activeTabId="home" />}
            {...frameProps}
        >
            {children}
        </Frame>
    </div>
);
