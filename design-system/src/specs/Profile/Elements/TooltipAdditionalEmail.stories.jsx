/**
 * Profile - Elements - Tooltip: Additional Email
 *
 * Info icon with tooltip that explains the additional email feature.
 *
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=5719-19370&m=dev
 */
import React from 'react';
import Tooltip from '@/components/overlays-and-layering/Tooltip/Tooltip';
import { iconClass } from '../../../lib/icon';

export default {
    title: 'Specs/Profile/Elements/Tooltip Additional Email',
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Tooltip copy for the additional email field on tutor profile basic information. Token notes are in the file header comment.',
            },
        },
    },
};

const TriggerIcon = () => (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <i className={iconClass('circle-info')} style={{ fontSize: '10px', color: 'var(--color-primary)' }} />
    </span>
);

export const Overview = () => (
    <div style={{ padding: 'var(--pad-y-lg, 12px)' }}>
        <Tooltip
            text="Get notifications sent to an alternate email address"
            placement="right"
            id="tooltip-additional-email-overview"
        >
            <TriggerIcon />
        </Tooltip>
    </div>
);

export const Variants = () => (
    <div
        style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--size-section-gap-xl, 32px)',
            padding: 'var(--pad-y-lg, 12px)',
            alignItems: 'flex-start',
        }}
    >
        {['top', 'right', 'bottom', 'left'].map((placement) => (
            <Tooltip
                key={placement}
                text="Get notifications sent to an alternate email address"
                placement={placement}
                id={`tooltip-additional-email-var-${placement}`}
                show={true}
            >
                <TriggerIcon />
            </Tooltip>
        ))}
    </div>
);

export const Interactive = {
    args: {
        showTooltip: true,
        placement: 'right',
    },
    argTypes: {
        showTooltip: {
            control: 'boolean',
            description: 'Force tooltip visibility for review (uses Tooltip show prop)',
            table: { category: 'State' },
        },
        placement: {
            control: 'select',
            options: ['top', 'bottom', 'left', 'right'],
            table: { category: 'Layout' },
        },
    },
    render: (args) => (
        <div style={{ padding: 'var(--pad-y-lg, 12px)' }}>
            <Tooltip
                text="Get notifications sent to an alternate email address"
                placement={args.placement}
                id="tooltip-additional-email-interactive"
                show={args.showTooltip ? true : undefined}
            >
                <TriggerIcon />
            </Tooltip>
        </div>
    ),
};
