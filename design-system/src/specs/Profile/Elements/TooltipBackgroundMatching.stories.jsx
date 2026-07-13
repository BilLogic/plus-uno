/**
 * Profile - Elements - Tooltip: Background & Matching
 *
 * Info icon with tooltip that explains how to request corrections.
 *
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=5719-19492&m=dev
 */
import React from 'react';
import Tooltip from '@/components/overlays/Tooltip/Tooltip';

export default {
    title: 'Specs/Profile/Elements/Tooltip Background Matching',
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Tooltip copy for the Background & Matching section on tutor profile. Token notes are in the file header comment.',
            },
        },
    },
};

const TooltipContent = () => (
    <span>
        Is some information incorrect? Contact{' '}
        <a href="mailto:help@tutors.plus" style={{ color: 'inherit', textDecoration: 'underline' }}>
            help@tutors.plus
        </a>{' '}
        to request a correction.
    </span>
);

const TriggerIcon = () => (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <i className="fa-solid fa-circle-info" style={{ fontSize: '10px', color: 'var(--color-primary)' }} />
    </span>
);

export const Overview = () => (
    <div style={{ padding: 'var(--size-element-pad-y-lg, 12px)' }}>
        <Tooltip text={<TooltipContent />} placement="right" size="small" id="tooltip-bg-matching-overview">
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
            padding: 'var(--size-element-pad-y-lg, 12px)',
            alignItems: 'flex-start',
        }}
    >
        {['top', 'right', 'bottom', 'left'].map((placement) => (
            <Tooltip
                key={placement}
                text={<TooltipContent />}
                placement={placement}
                size="small"
                id={`tooltip-bg-matching-var-${placement}`}
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
        <div style={{ padding: 'var(--size-element-pad-y-lg, 12px)' }}>
            <Tooltip
                text={<TooltipContent />}
                placement={args.placement}
                size="small"
                id="tooltip-bg-matching-interactive"
                show={args.showTooltip ? true : undefined}
            >
                <TriggerIcon />
            </Tooltip>
        </div>
    ),
};
