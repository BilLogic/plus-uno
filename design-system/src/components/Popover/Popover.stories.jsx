import React from 'react';
import { Popover as RBPopover } from 'react-bootstrap';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Popover from './Popover';
import Button from '@/components/Button/Button';

export default {
    title: 'Components/Popover',
    component: Popover,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: 'Popover component for displaying additional information. Built using react-bootstrap OverlayTrigger and Popover.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        triggerLabel: {
            control: 'text',
            description: 'Button label used as the popover trigger',
            table: { category: 'Content' }
        },
        title: {
            control: 'text',
            description: 'Popover title',
            table: { category: 'Content' }
        },
        placement: {
            control: 'select',
            options: ['top', 'bottom', 'left', 'right'],
            description: 'Popover placement',
            table: { category: 'Layout' }
        },
        triggerType: {
            control: 'select',
            options: ['click', 'hover', 'focus', ['hover', 'focus']],
            description: 'Trigger behavior',
            table: { category: 'Behavior' }
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        trigger: {
            table: { disable: true, category: 'Development' }
        }
    }
};

const col = { display: 'flex', flexDirection: 'column', gap: '64px', padding: '48px', alignItems: 'center' };

function PopoverLayoutDemos() {
    return (
        <section style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Popover
                trigger={<Button text="Popover on Top" style="secondary" />}
                placement="top"
                title="Popover Title"
            >
                And here's some amazing content. It's very engaging. Right?
            </Popover>
            <Popover
                trigger={<Button text="Popover on Bottom" style="secondary" />}
                placement="bottom"
                title="Popover Title"
            >
                And here's some amazing content. It's very engaging. Right?
            </Popover>
            <Popover
                trigger={<Button text="Popover on Left" style="secondary" />}
                placement="left"
                title="Popover Title"
            >
                And here's some amazing content. It's very engaging. Right?
            </Popover>
            <Popover
                trigger={<Button text="Popover on Right" style="secondary" />}
                placement="right"
                title="Popover Title"
            >
                And here's some amazing content. It's very engaging. Right?
            </Popover>
        </section>
    );
}

function PopoverContentDemo() {
    return (
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">NO TITLE</span>
            <Popover
                trigger={<Button text="Content Only" style="primary" />}
                placement="right"
            >
                This popover has no title, only body content.
            </Popover>
        </section>
    );
}

function PopoverInteractionStatesDemos() {
    return (
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">TRIGGER TYPES</span>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Popover
                    trigger={<Button text="Click (Default)" style="info" />}
                    triggerType="click"
                >
                    Clicked to toggle.
                </Popover>
                <Popover
                    trigger={<Button text="Hover" style="info" />}
                    triggerType="hover"
                >
                    Hovered to show.
                </Popover>
                <Popover
                    trigger={<Button text="Focus" style="info" />}
                    triggerType="focus"
                >
                    Focus to show (tab to this button).
                </Popover>
            </div>
        </section>
    );
}

export const Layout = () => (
    <div style={col}>
        <PopoverLayoutDemos />
    </div>
);

export const Content = () => (
    <div style={col}>
        <PopoverContentDemo />
    </div>
);

export const InteractionStates = () => (
    <div style={col}>
        <PopoverInteractionStatesDemos />
    </div>
);

export const Overview = () => (
    <div className="plus-popover-overview-static">
        <Button type="button" text="Toggle popover" style="primary" />
        <RBPopover className="plus-popover" placement="right">
            <RBPopover.Header className="plus-popover-title">Popover title</RBPopover.Header>
            <RBPopover.Body className="plus-popover-body">
                Body content appears below the title. This overview is non-interactive; use Interactive for
                click/hover behavior.
            </RBPopover.Body>
        </RBPopover>
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'html', code: webAppSourceSnippets.popover }
    }
};

export const Interactive = {
    args: {
        triggerLabel: 'Interactive Trigger',
        title: 'Interactive Popover',
        children: 'Change my placement or title in the controls.',
        placement: 'top',
        triggerType: 'click'
    },
    render: (args) => {
        const { triggerLabel, ...popoverProps } = args;
        return (
            <div style={{ padding: '48px', display: 'flex', justifyContent: 'center' }}>
                <Popover
                    {...popoverProps}
                    trigger={<Button text={triggerLabel} style="primary" />}
                />
            </div>
        );
    }
};
