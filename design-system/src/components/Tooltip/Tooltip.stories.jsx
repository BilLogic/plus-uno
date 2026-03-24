import React from 'react';
import Tooltip from '@/components/Tooltip';
import Button from '@/components/Button';

export default {
    title: 'Components/Tooltip',
    component: Tooltip,
    tags: ['!dev'],
    argTypes: {
        text: { control: 'text', description: 'Tooltip text' },
        placement: {
            control: 'select',
            options: ['top', 'bottom', 'left', 'right'],
            description: 'Tooltip placement',
        },
        size: {
            control: 'select',
            options: ['small', 'default', 'large'],
            description: 'Tooltip size',
        },
    },
};

const row = { display: 'flex', gap: '16px', padding: '50px', flexWrap: 'wrap' };

function TooltipVariantsDemos() {
    return (
        <>
            <Tooltip text="Tooltip on top" placement="top">
                <Button btnText="Top" />
            </Tooltip>
            <Tooltip text="Tooltip on bottom" placement="bottom">
                <Button btnText="Bottom" />
            </Tooltip>
            <Tooltip text="Tooltip on left" placement="left">
                <Button btnText="Left" />
            </Tooltip>
            <Tooltip text="Tooltip on right" placement="right">
                <Button btnText="Right" />
            </Tooltip>
        </>
    );
}

function TooltipSizesDemos() {
    return (
        <>
            <Tooltip text="Small tooltip" size="small" placement="top">
                <Button btnText="Small" />
            </Tooltip>
            <Tooltip text="Default tooltip" size="default" placement="top">
                <Button btnText="Default" />
            </Tooltip>
            <Tooltip text="Large tooltip" size="large" placement="top">
                <Button btnText="Large" />
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
                <Button btnText="Hover me" />
            </Tooltip>
        </div>
    ),
};
