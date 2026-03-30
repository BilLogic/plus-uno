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

const row = { display: 'flex', gap: '16px', padding: '50px', flexWrap: 'wrap' };

function TooltipVariantsDemos() {
    return (
        <>
            <Tooltip text="Tooltip on top" placement="top">
                <Button text="Top" />
            </Tooltip>
            <Tooltip text="Tooltip on bottom" placement="bottom">
                <Button text="Bottom" />
            </Tooltip>
            <Tooltip text="Tooltip on left" placement="left">
                <Button text="Left" />
            </Tooltip>
            <Tooltip text="Tooltip on right" placement="right">
                <Button text="Right" />
            </Tooltip>
        </>
    );
}

function TooltipSizesDemos() {
    return (
        <>
            <Tooltip text="Small tooltip" size="small" placement="top">
                <Button text="Small" />
            </Tooltip>
            <Tooltip text="Default tooltip" size="default" placement="top">
                <Button text="Default" />
            </Tooltip>
            <Tooltip text="Large tooltip" size="large" placement="top">
                <Button text="Large" />
            </Tooltip>
        </>
    );
}

export const Styles = () => (
    <div style={row}>
        <TooltipVariantsDemos />
    </div>
);

export const Sizes = () => (
    <div style={row}>
        <TooltipSizesDemos />
    </div>
);

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={row}>
            <TooltipVariantsDemos />
        </div>
        <div style={row}>
            <TooltipSizesDemos />
        </div>
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
