import React from 'react';
import Scrollspy, { ScrollspyContent } from './Scrollspy';

export default {
    title: 'Components/Scrollspy',
    component: Scrollspy,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Scrollspy component for automatically updating navigation based on scroll position.'
            }
        }
    }
};

export const Overview = () => {
    const items = [
        { text: '@fat', href: '#fat', isDropdown: false },
        { text: '@mdo', href: '#mdo', isDropdown: false },
        { text: 'Dropdown', href: '#one', isDropdown: true }
    ];

    const generateContent = (count) => {
        return Array(count).fill(0).map((_, i) => (
            <p key={i} className="body1-txt" style={{ marginTop: '16px' }}>
                Additional content paragraph {i + 1}. This content ensures the section is tall enough for scrollspy to detect scroll position changes. Keep scrolling to see the active nav item update automatically.
            </p>
        ));
    };

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
                id="scrollspy-nav-overview"
                brand="Navbar"
                items={items}
                contentId="scrollspy-content-overview"
                offset={10}
            />

            <ScrollspyContent
                id="scrollspy-content-overview"
                height="500px"
            >
                <section id="fat" className="plus-scrollspy-section">
                    <h4 className="h4">@fat</h4>
                    <p className="body1-txt">Placeholder content for the scrollspy example. You got the finest architecture. Passport stamps, she's cosmopolitan.</p>
                    {generateContent(5)}
                </section>

                <section id="mdo" className="plus-scrollspy-section">
                    <h4 className="h4">@mdo</h4>
                    <p className="body1-txt">Placeholder content for the scrollspy example. 'Cause she's the muse and the artist.</p>
                    {generateContent(5)}
                </section>

                <section id="one" className="plus-scrollspy-section">
                    <h4 className="h4">one</h4>
                    <p className="body1-txt">Placeholder content for the scrollspy example. Takes you miles high, so high.</p>
                    {generateContent(5)}
                </section>
            </ScrollspyContent>
        </div>
    );
};

export const Interactive = () => {
    // Same as overview but can be played with controls if needed, 
    // simply duplicating for now as the component relies on specific DOM structure
    return <Overview />;
};
