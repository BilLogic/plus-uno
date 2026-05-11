import React from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Progress from '@/components/Progress';

export default {
    title: 'Components/Progress',
    component: Progress,
    tags: ['!dev'],
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        value: { control: { type: 'range', min: 0, max: 100 }, description: 'Progress value', table: { category: 'Content' } },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Progress bar size',
            table: { category: 'Design' }
        },
        striped: { control: 'boolean', description: 'Striped effect', table: { category: 'Behavior' } },
        animated: { control: 'boolean', description: 'Animated stripes', table: { category: 'Behavior' } },
        showLabel: { control: 'boolean', description: 'Show percentage label', table: { category: 'Behavior' } },
        min: {
            table: { disable: true, category: 'Development' }
        },
        max: {
            table: { disable: true, category: 'Development' }
        },
        label: {
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        }
    },
};

const col = { display: 'flex', flexDirection: 'column', gap: '16px' };

function ProgressVariantsDemos() {
    return (
        <>
            <Progress value={25} />
            <Progress value={50} style="success" />
            <Progress value={75} style="info" />
        </>
    );
}

function ProgressEffectsDemos() {
    return (
        <>
            <Progress value={75} striped />
            <Progress value={100} style="warning" striped animated />
        </>
    );
}

function ProgressSizesDemos() {
    return (
        <>
            <Progress value={60} size="small" />
            <Progress value={60} size="medium" />
            <Progress value={60} size="large" />
        </>
    );
}

export const Styles = () => (
    <div style={col}>
        <ProgressVariantsDemos />
    </div>
);

export const Effects = () => (
    <div style={col}>
        <ProgressEffectsDemos />
    </div>
);

export const Sizes = () => (
    <div style={col}>
        <ProgressSizesDemos />
    </div>
);

export const Overview = () => (
    <div style={{ width: '100%', minWidth: '200px', maxWidth: '100%' }}>
        <Progress value={50} style="primary" size="medium" showLabel />
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'html', code: webAppSourceSnippets.progress }
    }
};

export const Interactive = {
    args: {
        value: 50,
        style: 'primary',
        size: 'medium',
        striped: false,
        animated: false,
        showLabel: true,
    },
};
