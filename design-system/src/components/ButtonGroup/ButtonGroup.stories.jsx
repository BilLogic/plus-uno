import React from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import ButtonGroup from './ButtonGroup';
import Button from '@/components/Button/Button';

export default {
    title: 'Components/ButtonGroup',
    component: ButtonGroup,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: 'Button Group component for grouping related buttons together. Supports horizontal and vertical layouts with multiple sizes and styles. Uses tonal fill as the default per the design system specification.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        // DESIGN
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Size of buttons in the group',
            table: { category: 'Design' }
        },
        fill: {
            control: 'select',
            options: ['filled', 'tonal', 'outline', 'ghost'],
            description: 'Fill variant for buttons',
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
                    <span className="plus-body-3" style={{ color: 'var(--color-neutral-text)' }}>Small</span>
                    <ButtonGroup
                        size="small"
                        buttons={[{ text: 'Left' }, { text: 'Right' }]}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                    <span className="plus-body-3" style={{ color: 'var(--color-neutral-text)' }}>Medium (Default)</span>
                    <ButtonGroup
                        size="medium"
                        buttons={[{ text: 'Left' }, { text: 'Right' }]}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                    <span className="plus-body-3" style={{ color: 'var(--color-neutral-text)' }}>Large</span>
                    <ButtonGroup
                        size="large"
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
                    <span className="plus-body-3" style={{ color: 'var(--color-neutral-text)' }}>Horizontal</span>
                    <ButtonGroup
                        buttons={[{ text: 'Left' }, { text: 'Center' }, { text: 'Right' }]}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span className="plus-body-3" style={{ color: 'var(--color-neutral-text)' }}>Vertical</span>
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
                    <span className="plus-body-3" style={{ color: 'var(--color-neutral-text)', minWidth: '80px' }}>2 Buttons</span>
                    <ButtonGroup buttons={[{ text: 'Left' }, { text: 'Right' }]} />
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span className="plus-body-3" style={{ color: 'var(--color-neutral-text)', minWidth: '80px' }}>3 Buttons</span>
                    <ButtonGroup buttons={[{ text: 'Left' }, { text: 'Center' }, { text: 'Right' }]} />
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span className="plus-body-3" style={{ color: 'var(--color-neutral-text)', minWidth: '80px' }}>4 Buttons</span>
                    <ButtonGroup buttons={[{ text: 'One' }, { text: 'Two' }, { text: 'Three' }, { text: 'Four' }]} />
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span className="plus-body-3" style={{ color: 'var(--color-neutral-text)', minWidth: '80px' }}>5 Buttons</span>
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
                        style="secondary"
                        fill="outline"
                        buttons={[
                            { leadingVisual: 'chevron-left' },
                            { text: '1' },
                            { text: '2', active: true },
                            { text: '3' },
                            { trailingVisual: 'chevron-right' }
                        ]}
                    />
                    <span className="plus-body-2" style={{ color: 'var(--color-neutral-text)' }}>Pagination Controls</span>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <ButtonGroup
                        style="tertiary"
                        fill="ghost"
                        buttons={[
                            { leadingVisual: 'bold' },
                            { leadingVisual: 'italic' },
                            { leadingVisual: 'underline' }
                        ]}
                    />
                    <span className="plus-body-2" style={{ color: 'var(--color-neutral-text)' }}>Text Formatting Toolbar</span>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <ButtonGroup
                        style="primary"
                        buttons={[
                            { text: 'Day', active: true },
                            { text: 'Week' },
                            { text: 'Month' }
                        ]}
                    />
                    <span className="plus-body-2" style={{ color: 'var(--color-neutral-text)' }}>Toggle Selection</span>
                </div>
            </div>
        </section>
    );
}

function ButtonGroupChildrenDemos() {
    return (
        <section>
            <ButtonGroup style="secondary" fill="tonal">
                <Button text="Custom" leadingVisual="star" />
                <Button text="Button" />
                <Button text="Children" trailingVisual="arrow-right" />
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
    size: 'medium',
    style: 'primary',
    fill: 'tonal',
    vertical: false,
    buttonCount: 3
};

const buttonGroupPlaygroundArgs = {
    size: 'medium',
    style: 'secondary',
    fill: 'tonal',
    vertical: false,
    buttonCount: 4
};

export const Overview = {
    render: renderButtonGroupPlayground,
    args: { ...buttonGroupOverviewArgs },
    parameters: {
        docs: {
            source: { language: 'html', code: webAppSourceSnippets.buttonGroup }
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
