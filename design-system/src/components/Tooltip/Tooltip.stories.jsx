import React from 'react';
import Tooltip from '@/components/Tooltip';
import Button from '@/components/Button';

export default {
    title: 'Components/Tooltip',
    component: Tooltip,
    tags: ['!dev'],
    argTypes: {
        text: { control: 'text', description: 'Tooltip text', table: { category: 'Content' } },
        placement: {
            control: 'select',
            options: ['top', 'bottom', 'left', 'right'],
            description: 'Tooltip placement',
            table: { category: 'Design' },
        },
        size: {
            control: 'select',
            options: ['small', 'default', 'large'],
            description: 'Tooltip size',
            table: { category: 'Design' },
        },
        children: {
            table: { disable: true, category: 'Development' }
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        delay: {
            table: { disable: true, category: 'Development' }
        },
        delayShow: {
            table: { disable: true, category: 'Development' }
        },
        flip: {
            table: { disable: true, category: 'Development' }
        }
    },
};

const containerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    padding: '40px 20px',
    backgroundColor: 'var(--color-surface-container-lowest)',
    borderRadius: '12px',
    border: '1px solid var(--color-outline-variant)',
};

const blockStyle = {
    margin: '40px 60px',
};

function TooltipVariantsDemos() {
    return (
        <div style={containerStyle}>
            <div style={blockStyle}>
                <Tooltip text="Tooltip on top" placement="top" show={true}>
                    <Button text="Top" />
                </Tooltip>
            </div>
            <div style={blockStyle}>
                <Tooltip text="Tooltip on bottom" placement="bottom" show={true}>
                    <Button text="Bottom" />
                </Tooltip>
            </div>
            <div style={blockStyle}>
                <Tooltip text="Tooltip on left" placement="left" show={true}>
                    <Button text="Left" />
                </Tooltip>
            </div>
            <div style={blockStyle}>
                <Tooltip text="Tooltip on right" placement="right" show={true}>
                    <Button text="Right" />
                </Tooltip>
            </div>
        </div>
    );
}

function TooltipSizesDemos() {
    return (
        <div style={containerStyle}>
            <div style={blockStyle}>
                <Tooltip text="Small tooltip" size="small" placement="top" show={true}>
                    <Button text="Small" />
                </Tooltip>
            </div>
            <div style={blockStyle}>
                <Tooltip text="Default tooltip" size="default" placement="top" show={true}>
                    <Button text="Default" />
                </Tooltip>
            </div>
            <div style={blockStyle}>
                <Tooltip text="Large tooltip" size="large" placement="top" show={true}>
                    <Button text="Large" />
                </Tooltip>
            </div>
        </div>
    );
}

export const Styles = () => (
    <div style={{ marginBottom: '60px' }}>
        <TooltipVariantsDemos />
    </div>
);

export const Sizes = () => (
    <div style={{ marginBottom: '60px' }}>
        <TooltipSizesDemos />
    </div>
);

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
        <TooltipVariantsDemos />
        <TooltipSizesDemos />
    </div>
);

export const Interactive = {
    args: {
        text: 'Tooltip text',
        placement: 'top',
        size: 'default',
    },
    render: (args) => (
        <div style={{ padding: '50px' }}>
            <Tooltip {...args}>
                <Button text="Hover me" />
            </Tooltip>
        </div>
    ),
};
