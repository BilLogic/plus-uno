import React from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import ButtonGroup from './ButtonGroup';
import Button from '@/components/forms-and-inputs/Button/Button';

export default {
    title: 'Components/Forms and inputs/Button group',
    component: ButtonGroup,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-11-03', kind: 'changed', summary: 'Follows Button: `appearance` and `spacing` (default 32, compact 24) set every button in the group.' },
        ],
        docs: {
            description: {
                component: 'Button Group component for grouping related buttons together. Supports horizontal and vertical layouts, with the appearance and spacing of Button.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        // DESIGN
        appearance: {
            control: 'select',
            options: ['default', 'primary', 'subtle', 'warning', 'danger', 'discovery'],
            description: 'Appearance of every button in the group',
            table: { category: 'Design' }
        },
        spacing: {
            control: 'select',
            options: ['default', 'compact'],
            description: 'Spacing of every button in the group: default 32, compact 24',
            table: { category: 'Design' }
        },
        vertical: {
            control: 'boolean',
            description: 'Stack buttons vertically',
            table: { category: 'Design' }
        },

        // CONTENT
        buttonCount: {
            control: { type: 'range', min: 2, max: 5, step: 1 },
            description: 'Number of buttons in the group',
            table: { category: 'Content' }
        },

        // DEVELOPMENT
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        ariaLabel: {
            table: { disable: true, category: 'Development' }
        },
        buttons: {
            table: { disable: true, category: 'Development' }
        },}
};

const bgCol = { display: 'flex', flexDirection: 'column', gap: '48px' };

function ButtonGroupSizesDemos() {
    return (
        <section>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                    <span className="plus-body-3" style={{ color: 'var(--color-on-surface)' }}>Compact</span>
                    <ButtonGroup
                        spacing="compact"
                        buttons={[{ text: 'Left' }, { text: 'Right' }]}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                    <span className="plus-body-3" style={{ color: 'var(--color-on-surface)' }}>Default</span>
                    <ButtonGroup
                        buttons={[{ text: 'Left' }, { text: 'Right' }]}
                    />
                </div>
            </div>
        </section>
    );
}

function ButtonGroupLayoutDemos() {
    return (
        <section>
            <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span className="plus-body-3" style={{ color: 'var(--color-on-surface)' }}>Horizontal</span>
                    <ButtonGroup
                        buttons={[{ text: 'Left' }, { text: 'Center' }, { text: 'Right' }]}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span className="plus-body-3" style={{ color: 'var(--color-on-surface)' }}>Vertical</span>
                    <ButtonGroup
                        vertical
                        buttons={[{ text: 'Top' }, { text: 'Middle' }, { text: 'Bottom' }]}
                    />
                </div>
            </div>
        </section>
    );
}

function ButtonGroupCountsDemos() {
    return (
        <section>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span className="plus-body-3" style={{ color: 'var(--color-on-surface)', minWidth: '80px' }}>2 Buttons</span>
                    <ButtonGroup buttons={[{ text: 'Left' }, { text: 'Right' }]} />
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span className="plus-body-3" style={{ color: 'var(--color-on-surface)', minWidth: '80px' }}>3 Buttons</span>
                    <ButtonGroup buttons={[{ text: 'Left' }, { text: 'Center' }, { text: 'Right' }]} />
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span className="plus-body-3" style={{ color: 'var(--color-on-surface)', minWidth: '80px' }}>4 Buttons</span>
                    <ButtonGroup buttons={[{ text: 'One' }, { text: 'Two' }, { text: 'Three' }, { text: 'Four' }]} />
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span className="plus-body-3" style={{ color: 'var(--color-on-surface)', minWidth: '80px' }}>5 Buttons</span>
                    <ButtonGroup buttons={[{ text: 'One' }, { text: 'Two' }, { text: 'Three' }, { text: 'Four' }, { text: 'Five' }]} />
                </div>
            </div>
        </section>
    );
}

function ButtonGroupUseCasesDemos() {
    return (
        <section>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <ButtonGroup
                        buttons={[
                            { leadingVisual: 'chevron-left', props: { 'aria-label': 'Previous page' } },
                            { text: '1' },
                            { text: '2', active: true },
                            { text: '3' },
                            { trailingVisual: 'chevron-right', props: { 'aria-label': 'Next page' } }
                        ]}
                    />
                    <span className="plus-body-2" style={{ color: 'var(--color-on-surface)' }}>Pagination Controls</span>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <ButtonGroup
                        appearance="subtle"
                        buttons={[
                            { leadingVisual: 'bold', props: { 'aria-label': 'Bold' } },
                            { leadingVisual: 'italic', props: { 'aria-label': 'Italic' } },
                            { leadingVisual: 'underline', props: { 'aria-label': 'Underline' } }
                        ]}
                    />
                    <span className="plus-body-2" style={{ color: 'var(--color-on-surface)' }}>Text Formatting Toolbar</span>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <ButtonGroup
                        buttons={[
                            { text: 'Day', active: true },
                            { text: 'Week' },
                            { text: 'Month' }
                        ]}
                    />
                    <span className="plus-body-2" style={{ color: 'var(--color-on-surface)' }}>Toggle Selection</span>
                </div>
            </div>
        </section>
    );
}

function ButtonGroupChildrenDemos() {
    return (
        <section>
            <ButtonGroup>
                <Button appearance="primary" text="Custom" iconBefore="star" />
                <Button appearance="primary" text="Button" />
                <Button appearance="primary" text="Children" iconAfter="arrow-right" />
            </ButtonGroup>
        </section>
    );
}

export const Sizes = () => (
    <div style={bgCol}>
        <ButtonGroupSizesDemos />
    </div>
);

export const Layout = () => (
    <div style={bgCol}>
        <ButtonGroupLayoutDemos />
    </div>
);

export const Counts = () => (
    <div style={bgCol}>
        <ButtonGroupCountsDemos />
    </div>
);

export const Patterns = () => (
    <div style={bgCol}>
        <ButtonGroupUseCasesDemos />
    </div>
);

export const Children = () => (
    <div style={bgCol}>
        <ButtonGroupChildrenDemos />
    </div>
);

function renderButtonGroupPlayground(args) {
    const buttonLabels = ['Left', 'Center', 'Right', 'Fourth', 'Fifth'];
    const buttons = Array.from({ length: args.buttonCount || 3 }, (_, i) => ({
        text: buttonLabels[i] || `Button ${i + 1}`
    }));

    return (
        <ButtonGroup
            {...args}
            buttons={buttons}
        />
    );
}

const buttonGroupOverviewArgs = {
    appearance: 'default',
    vertical: false,
    buttonCount: 3
};

const buttonGroupPlaygroundArgs = {
    appearance: 'default',
    vertical: false,
    buttonCount: 4
};

export const Overview = {
    render: renderButtonGroupPlayground,
    args: { ...buttonGroupOverviewArgs },
    parameters: {
        docs: {
            source: { language: 'jsx', code: webAppSourceSnippets.buttonGroup }
        }
    }
};

/**
 * Interactive Playground
 * Customize the button group attributes in real-time.
 */
export const Interactive = {
    render: renderButtonGroupPlayground,
    args: { ...buttonGroupPlaygroundArgs }
};
