import React from 'react';
import { Breadcrumb, Sidebar } from '@/components';
import { Frame } from '@/templates';
import { typeStyle } from './type-style.js';

/**
 * Story chrome shared by the template stories: a demo caption, a dashed
 * content slot, and the app frame with the PLUS Sidebar and a breadcrumb in it.
 * Every color is a `--ds-*` token, so the chrome follows the color modes
 * with the templates it frames.
 */

/** A demo's caption: a group name above an example, in the subtle text color. */
export const DemoLabel = ({ children }) => (
    <span
        style={{
            display: 'block',
            marginBottom: 'var(--stack-md)',
            ...typeStyle('heading-xxs'),
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
            border: 'var(--border-width-default) dashed var(--ds-border-bold)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--ds-text-subtle)',
        }}
        className="body-lg"
    >
        {label}
    </div>
);

export const RECORD_CRUMBS = [{ text: 'Students', href: '#' }];
const ACCOUNT = { id: 'john-doe', name: 'John Doe', role: 'Lead' };

/**
 * The app frame at full height: the tutor Sidebar with `account` in its
 * account row and `activeTabId` selected, optional `breadcrumbs` in the Page's header row, and `children` in the
 * surface. `height` sizes the box the
 * frame fills (the viewport by default). Any other prop goes to Frame.
 */
export const InAppFrame = ({ breadcrumbs = null, account = ACCOUNT, activeTabId = 'home', height = '100vh', children, ...frameProps }) => (
    <div style={{ height }}>
        <Frame
            header={breadcrumbs ? <Breadcrumb items={breadcrumbs} /> : undefined}
            sidebar={<Sidebar user="tutor" activeTabId={activeTabId} account={account} />}
            {...frameProps}
        >
            {children}
        </Frame>
    </div>
);
