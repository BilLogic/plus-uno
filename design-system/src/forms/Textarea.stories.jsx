import React, { useState } from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Textarea from './Textarea';

export default {
    title: 'Forms/Textarea',
    component: Textarea,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component:
                    'Textarea ver 2 provides two variants: Long Form (boxed) and Short Form (underlined), implementing the updated Figma designs.',
            },
        },
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        label: {
            control: 'text',
            description: 'Field label',
            table: { category: 'Content' },
        },
        placeholder: {
            control: 'text',
            description: 'Placeholder text',
            table: { category: 'Content' },
        },
        rows: {
            control: 'number',
            description: 'Visible text rows',
            table: { category: 'Layout' },
        },
        size: {
            control: 'radio',
            options: ['small', 'medium', 'large'],
            description: 'Size variant',
            table: { category: 'Design' },
        },
        variant: {
            control: 'radio',
            options: ['long', 'short'],
            description: 'The visual style of the textarea',
            table: { category: 'Design' },
        },
        state: {
            control: 'select',
            options: ['default', 'focus', 'success', 'error', 'readonly', 'disabled'],
            description: 'The visual state of the component',
            table: { category: 'Behavior' },
        },
        value: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        defaultValue: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        onChange: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        name: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },},
};

export const Overview = () => (
    <div style={{ maxWidth: '600px' }}>
        <Textarea id="textarea-overview" label="Label" placeholder="Enter text..." variant="long" rows={3} />
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'html', code: webAppSourceSnippets.formTextarea }
    }
};

export const Styles = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px' }}>
        <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
            Long (boxed) vs short (underlined) at default state.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">LONG FORM</span>
                <Textarea placeholder="Enter text..." variant="long" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SHORT FORM</span>
                <Textarea placeholder="Enter text..." variant="short" />
            </div>
        </div>
    </div>
);

export const Sizes = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px' }}>
        <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
            Size variants: small, medium, large.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block">LONG FORM</span>
                <div>
                    <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-2">SMALL</span>
                    <Textarea placeholder="Enter text..." variant="long" size="small" />
                </div>
                <div>
                    <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-2">MEDIUM</span>
                    <Textarea placeholder="Enter text..." variant="long" size="medium" />
                </div>
                <div>
                    <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-2">LARGE</span>
                    <Textarea placeholder="Enter text..." variant="long" size="large" />
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block">SHORT FORM</span>
                <div>
                    <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-2">SMALL</span>
                    <Textarea placeholder="Enter text..." variant="short" size="small" />
                </div>
                <div>
                    <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-2">MEDIUM</span>
                    <Textarea placeholder="Enter text..." variant="short" size="medium" />
                </div>
                <div>
                    <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-2">LARGE</span>
                    <Textarea placeholder="Enter text..." variant="short" size="large" />
                </div>
            </div>
        </div>
    </div>
);

export const InteractionStatesLong = () => (
    <div style={{ maxWidth: '1000px' }}>
        <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-4">LONG FORM</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DEFAULT</span>
                <Textarea placeholder="Enter text..." variant="long" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">FOCUS (STATIC)</span>
                <Textarea placeholder="Enter text..." variant="long" state="focus" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">FILLED</span>
                <Textarea defaultValue="Some content here" variant="long" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">VALID</span>
                <Textarea defaultValue="Looks good" variant="long" state="success" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">ERROR</span>
                <Textarea defaultValue="Invalid content" variant="long" state="error" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DISABLED</span>
                <Textarea defaultValue="Disabled content" variant="long" disabled />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">READ ONLY</span>
                <Textarea defaultValue="Read only content" variant="long" readOnly />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">READ ONLY (PLACEHOLDER)</span>
                <Textarea placeholder="Read only placeholder" variant="long" readOnly />
            </div>
        </div>
    </div>
);

export const InteractionStatesShort = () => (
    <div style={{ maxWidth: '1000px' }}>
        <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-4">SHORT FORM</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DEFAULT</span>
                <Textarea placeholder="Enter text..." variant="short" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">FOCUS (STATIC)</span>
                <Textarea placeholder="Enter text..." variant="short" state="focus" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">FILLED</span>
                <Textarea defaultValue="Short content" variant="short" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">VALID</span>
                <Textarea defaultValue="Looks good" variant="short" state="success" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">ERROR</span>
                <Textarea defaultValue="Invalid short content" variant="short" state="error" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DISABLED</span>
                <Textarea defaultValue="Disabled short content" variant="short" disabled />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">READ ONLY</span>
                <Textarea defaultValue="Read only short content" variant="short" readOnly />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">READ ONLY (PLACEHOLDER)</span>
                <Textarea placeholder="Read only placeholder" variant="short" readOnly />
            </div>
        </div>
    </div>
);

export const Interactive = (args) => {
    const [value, setValue] = useState(args.value || '');

    return (
        <div style={{ maxWidth: '600px', padding: '20px' }}>
            <Textarea {...args} value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
    );
};

Interactive.args = {
    label: 'Interactive Label',
    placeholder: 'Type something...',
    variant: 'long',
    size: 'medium',
    rows: 3,
    state: 'default',
};
