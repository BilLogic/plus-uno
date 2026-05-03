import React from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Scrollspy, { ScrollspyContent } from './Scrollspy';

export default {
    title: 'Components/Scrollspy',
    component: Scrollspy,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: 'Scrollspy component for automatically updating navigation based on scroll position.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        brand: {
            control: 'text',
            description: 'Navigation label',
            table: { category: 'Content' }
        },
        sectionCount: {
            control: { type: 'range', min: 1, max: 5, step: 1 },
            description: 'Number of sections in the demo content',
            table: { category: 'Content' }
        },
        offset: {
            control: { type: 'range', min: 0, max: 40, step: 5 },
            description: 'Scroll offset used for active-section detection',
            table: { category: 'Behavior' }
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        items: {
            table: { disable: true, category: 'Development' }
        },
        contentId: {
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        }
    }
};

function generateContent(count) {
    return Array(count).fill(0).map((_, i) => (
        <p key={i} className="body1-txt" style={{ marginTop: 'var(--size-spacing-medium-space-300)' }}>
            Additional content paragraph {i + 1}. This content ensures the section is tall enough for scrollspy to detect scroll position changes. Keep scrolling to see the active nav item update automatically.
        </p>
    ));
}

function sectionElId(idPrefix, id) {
    return `${idPrefix}-${id}`;
}

function buildNavItems(sections, idPrefix) {
    const byId = Object.fromEntries(sections.map((s) => [s.id, s]));
    const core = [
        { id: 'fat', label: '@fat' },
        { id: 'mdo', label: '@mdo' }
    ].filter((c) => byId[c.id]);

    const afterMdo = sections.filter((s) => !['fat', 'mdo'].includes(s.id));

    if (afterMdo.length === 0) {
        return core.map((c) => ({
            text: c.label,
            href: `#${sectionElId(idPrefix, c.id)}`
        }));
    }

    return [
        ...core.map((c) => ({
            text: c.label,
            href: `#${sectionElId(idPrefix, c.id)}`
        })),
        {
            text: 'Dropdown',
            isDropdown: true,
            dropdownItems: afterMdo.map((s) => ({
                text: s.title,
                href: `#${sectionElId(idPrefix, s.id)}`
            }))
        }
    ];
}

function ScrollspyLayoutDemo({ brand = 'Navbar', offset = 10, sectionCount = 5, idPrefix = 'scrollspy-layout' }) {
    const allSections = [
        { id: 'fat', title: '@fat' },
        { id: 'mdo', title: '@mdo' },
        { id: 'one', title: 'one' },
        { id: 'two', title: 'two' },
        { id: 'three', title: 'three' }
    ];
    const sections = allSections.slice(0, sectionCount);
    const items = buildNavItems(sections, idPrefix);
    const contentId = `${idPrefix}-content`;
    const navId = `${idPrefix}-nav`;

    return (
        <div
            className="plus-scrollspy-shell"
            style={{ maxHeight: '600px' }}
        >
            <Scrollspy
                id={navId}
                brand={brand}
                items={items}
                contentId={contentId}
                offset={offset}
            />
            <ScrollspyContent
                id={contentId}
                height="500px"
            >
                {sections.map((section, index) => (
                    <section key={section.id} id={sectionElId(idPrefix, section.id)} className="plus-scrollspy-section">
                        <h4 className="h4">{section.title}</h4>
                        <p className="body1-txt">
                            Placeholder content for section {index + 1}. Scroll through the content area to
                            see the active nav item update automatically.
                        </p>
                        {generateContent(5)}
                    </section>
                ))}
            </ScrollspyContent>
        </div>
    );
}

export const Layout = () => <ScrollspyLayoutDemo />;

export const Overview = () => <ScrollspyLayoutDemo sectionCount={1} idPrefix="scrollspy-docs-overview" />;
Overview.parameters = {
    docs: {
        source: { language: 'html', code: webAppSourceSnippets.scrollspy }
    }
};

export const Interactive = (args) => (
    <ScrollspyLayoutDemo {...args} idPrefix="scrollspy-docs-interactive" />
);
Interactive.args = {
    brand: 'Navbar',
    sectionCount: 5,
    offset: 10
};
