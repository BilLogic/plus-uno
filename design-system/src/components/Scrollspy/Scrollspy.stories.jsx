import React from 'react';
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
        brand: {
            control: 'text',
            description: 'Navigation label',
            table: { category: 'Content' }
        },
        sectionCount: {
            control: { type: 'range', min: 3, max: 5, step: 1 },
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
        <p key={i} className="body1-txt" style={{ marginTop: '16px' }}>
            Additional content paragraph {i + 1}. This content ensures the section is tall enough for scrollspy to detect scroll position changes. Keep scrolling to see the active nav item update automatically.
        </p>
    ));
}

function ScrollspyLayoutDemo({ brand = 'Navbar', offset = 10, sectionCount = 3 }) {
    const allSections = [
        { id: 'fat', title: '@fat' },
        { id: 'mdo', title: '@mdo' },
        { id: 'one', title: 'one' },
        { id: 'two', title: 'two' },
        { id: 'three', title: 'three' }
    ];
    const sections = allSections.slice(0, sectionCount);
    const items = sections.map(section => ({
        text: section.title,
        href: `#${section.id}`,
        isDropdown: false
    }));

    return (
        <div style={{
            backgroundColor: 'var(--color-surface)',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            maxWidth: '648px',
            maxHeight: '600px',
            border: '1px solid var(--color-outline-variant)'
        }}>
            <Scrollspy
                id="scrollspy-nav-docs"
                brand={brand}
                items={items}
                contentId="scrollspy-content-docs"
                offset={offset}
            />
            <ScrollspyContent
                id="scrollspy-content-docs"
                height="500px"
            >
                {sections.map((section, index) => (
                    <section key={section.id} id={section.id} className="plus-scrollspy-section">
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

export const Overview = () => <ScrollspyLayoutDemo />;

export const Interactive = (args) => <ScrollspyLayoutDemo {...args} />;
Interactive.args = {
    brand: 'Navbar',
    sectionCount: 3,
    offset: 10
};
