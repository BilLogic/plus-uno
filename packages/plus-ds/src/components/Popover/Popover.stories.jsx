import React from 'react';
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
        placement: {
            control: 'select',
            options: ['top', 'bottom', 'left', 'right'],
            description: 'Popover placement'
        },
        triggerType: {
            control: 'select',
            options: ['click', 'hover', 'focus', ['hover', 'focus']],
            description: 'Trigger behavior'
        }
    }
};

const Template = (args) => <Popover {...args} />;

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
            <h5>No title</h5>
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
            <h5>Trigger types</h5>
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
    <div style={col}>
        <PopoverLayoutDemos />
        <PopoverContentDemo />
        <PopoverInteractionStatesDemos />
    </div>
);

export const Interactive = Template.bind({});
Interactive.args = {
    trigger: <Button text="Interactive Trigger" />,
    title: 'Interactive Popover',
    children: 'Change my placement or title in the controls.',
    placement: 'top',
    triggerType: 'click'
};
