import React from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Popup from './Popup';
import Button from '@/components/forms-and-inputs/Button/Button';

export default {
    title: 'Components/Overlays and layering/Popup',
    component: Popup,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'A small panel of secondary content anchored to a trigger, built on Base UI.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        triggerLabel: {
            control: 'text',
            description: 'Button label used as the popup trigger',
            table: { category: 'Content' }
        },
        title: {
            control: 'text',
            description: 'Popup title',
            table: { category: 'Content' }
        },
        placement: {
            control: 'select',
            options: ['top', 'bottom', 'left', 'right'],
            description: 'Popup placement',
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

function PopupLayoutDemos() {
    return (
        <section style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Popup
                trigger={<Button text="Popup on Top" />}
                placement="top"
                title="Popup Title"
            >
                And here's some amazing content. It's very engaging. Right?
            </Popup>
            <Popup
                trigger={<Button text="Popup on Bottom" />}
                placement="bottom"
                title="Popup Title"
            >
                And here's some amazing content. It's very engaging. Right?
            </Popup>
            <Popup
                trigger={<Button text="Popup on Left" />}
                placement="left"
                title="Popup Title"
            >
                And here's some amazing content. It's very engaging. Right?
            </Popup>
            <Popup
                trigger={<Button text="Popup on Right" />}
                placement="right"
                title="Popup Title"
            >
                And here's some amazing content. It's very engaging. Right?
            </Popup>
        </section>
    );
}

function PopupContentDemo() {
    return (
        <section>
            <span className="text-[12px] uppercase tracking-wider text-[color:var(--ds-text-subtle)] font-semibold block mb-3">NO TITLE</span>
            <Popup
                trigger={<Button text="Content Only" appearance="primary" />}
                placement="right"
            >
                This popup has no title, only body content.
            </Popup>
        </section>
    );
}

function PopupInteractionStatesDemos() {
    return (
        <section>
            <span className="text-[12px] uppercase tracking-wider text-[color:var(--ds-text-subtle)] font-semibold block mb-3">TRIGGER TYPES</span>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Popup
                    trigger={<Button text="Click (Default)" appearance="primary" />}
                    triggerType="click"
                >
                    Clicked to toggle.
                </Popup>
                <Popup
                    trigger={<Button text="Hover" appearance="primary" />}
                    triggerType="hover"
                >
                    Hovered to show.
                </Popup>
                <Popup
                    trigger={<Button text="Focus" appearance="primary" />}
                    triggerType="focus"
                >
                    Focus to show (tab to this button).
                </Popup>
            </div>
        </section>
    );
}

export const Layout = () => (
    <div style={col}>
        <PopupLayoutDemos />
    </div>
);

export const Content = () => (
    <div style={col}>
        <PopupContentDemo />
    </div>
);

export const InteractionStates = () => (
    <div style={col}>
        <PopupInteractionStatesDemos />
    </div>
);

export const Overview = () => (
    <div className="plus-popup-overview-static">
        <Button type="button" text="Toggle popup" appearance="primary" />
        <div className="plus-popup">
            <div className="plus-popup-title">Popup title</div>
            <div className="plus-popup-body">
                Body content appears below the title. This overview is non-interactive; use Interactive for
                click/hover behavior.
            </div>
        </div>
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.popup }
    }
};

export const Interactive = {
    args: {
        triggerLabel: 'Interactive Trigger',
        title: 'Interactive Popup',
        children: 'Change my placement or title in the controls.',
        placement: 'top',
        triggerType: 'click'
    },
    render: (args) => {
        const { triggerLabel, ...popupProps } = args;
        return (
            <div style={{ padding: '48px', display: 'flex', justifyContent: 'center' }}>
                <Popup
                    {...popupProps}
                    trigger={<Button text={triggerLabel} appearance="primary" />}
                />
            </div>
        );
    }
};
