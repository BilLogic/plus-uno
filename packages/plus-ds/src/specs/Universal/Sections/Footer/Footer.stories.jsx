/**
 * Footer - Universal Section
 * 
 * Page footer with version, copyright, and terms.
 * Figma Spec: node-id=111-227939
 */

import React from 'react';
import Footer from '../../../../components/Footer/Footer';

export default {
    title: 'Specs/Universal/Sections/Footer',
    component: Footer,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Page footer with version info, copyright, and terms link. No border per Figma spec.'
            }
        }
    }
};

/**
 * Overview
 * Shows footer with default content
 */
export const Overview = {
    render: () => (
        <div style={{ backgroundColor: 'var(--color-surface)', padding: '16px', borderRadius: '8px' }}>
            <Footer
                version="v5.2.0"
                copyright="Copyright © Carnegie Mellon University 2024"
                termsText="Terms of Use"
                termsUrl="#"
            />
        </div>
    )
};

/**
 * Interactive
 * Interactive playground with controls
 */
export const Interactive = {
    render: (args) => (
        <div style={{ backgroundColor: 'var(--color-surface)', padding: '16px', borderRadius: '8px' }}>
            <Footer {...args} />
        </div>
    ),
    args: {
        version: 'v5.2.0',
        copyright: 'Copyright © Carnegie Mellon University 2024',
        termsText: 'Terms of Use',
        termsUrl: '#'
    },
    argTypes: {
        version: {
            control: 'text',
            table: { category: 'Content' }
        },
        copyright: {
            control: 'text',
            table: { category: 'Content' }
        },
        termsText: {
            control: 'text',
            table: { category: 'Content' }
        },
        termsUrl: {
            control: 'text',
            table: { category: 'Content' }
        }
    }
};
