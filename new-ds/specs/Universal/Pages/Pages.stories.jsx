import React from 'react';
import { PageLayout, Section } from '@/components';

export default {
    title: 'Specs/Universal/Pages',
    parameters: {
        layout: 'fullscreen',
    },
    argTypes: {
        pageWidth: {
            control: { type: 'select' },
            options: ['100%', '768px', '991px', '1200px'], // Simulate breakpoints
            description: 'Simulate viewport width to test responsiveness'
        }
    }
};

export const PageLayoutInteractive = (args) => (
    <div style={{ width: args.pageWidth || '100%', height: '100vh', borderRight: '1px dashed #ccc' }}>
        <PageLayout
            id="page-layout-interactive"
            topBarConfig={{
                brand: 'PLUS',
                items: [{ text: 'Universal' }, { text: 'Pages' }],
                components: [{ type: 'custom', content: <span>User Avatar</span> }]
            }}
            sidebarConfig={{
                user: 'tutor',
                visible: true
            }}
        >
            <Section title="Responsive Content">
                <p>Resize the container using the controls to see how sidebar reacts (breakpoints at 992px).</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                    <div style={{ height: '100px', background: '#eee', borderRadius: '8px' }}>Card 1</div>
                    <div style={{ height: '100px', background: '#eee', borderRadius: '8px' }}>Card 2</div>
                    <div style={{ height: '100px', background: '#eee', borderRadius: '8px' }}>Card 3</div>
                </div>
            </Section>
        </PageLayout>
    </div>
);
PageLayoutInteractive.args = {
    pageWidth: '100%'
};
