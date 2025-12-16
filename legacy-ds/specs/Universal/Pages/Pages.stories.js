/**
 * Universal Pages - Page Layout
 * 
 * Standard page layout template using Sidebar, TopBar, and Footer.
 */

import { createPageLayout } from './PageLayout.js';
import { createPageWidthWrapper, pageWidthArgTypes, pageWidthArgs } from '../../utils/pageWidthControl.js';

export default {
    title: 'Specs/Universal/Pages',
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen', // Fullscreen to test layout properly
        docs: {
            description: {
                component: 'Standard page layout component that composes Sidebar, TopBar, Content, and Footer. Handles responsive sidebar visibility.',
            },
        },
        backgrounds: {
            default: 'surface',
            values: [
                { name: 'surface', value: '#fdf8fd' }, // var(--color-surface) light theme approximation
                { name: 'surface-dark', value: '#191c1e' }, // var(--color-surface) dark theme approximation
            ],
        },
    },
};

/**
 * Page Layout - Interactive
 * Resize the viewport to test responsive sidebar behavior (< 992px).
 */
export const PageLayoutInteractive = {
    render: (args) => {
        // Create dummy content
        const content = document.createElement('div');
        content.innerHTML = `
      <h1 class="h2-txt">Page Title</h1>
      <p class="body1-txt" style="margin-top: 16px;">
        This is a sample page content area. The layout automatically handles the positioning of the Sidebar, TopBar, and Footer.
      </p>
      <div style="margin-top: 32px; display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px;">
        ${Array(6).fill(0).map((_, i) => `
          <div style="background: var(--color-surface-container); padding: 24px; border-radius: 8px; border: 1px solid var(--color-outline-variant);">
            <h3 class="h4-txt">Card ${i + 1}</h3>
            <p class="body2-txt" style="margin-top: 8px;">Sample card content to demonstrate layout scrolling and responsiveness.</p>
          </div>
        `).join('')}
      </div>
      <p class="body1-txt" style="margin-top: 32px;">
        Use the "Page Width" control to simulate different device sizes and test responsiveness.
      </p>
    `;

        // Map breakpoint names to approximate pixel widths for simulation
        const widthMap = {
            'auto': 768,
            'md': 768,
            'lg': 992,
            'xl': 1200,
            'xxl': 1400
        };
        const simulateWidth = widthMap[args.pageWidth] || 768;

        const page = createPageLayout({
            content: content,
            simulateWidth: simulateWidth,
            sidebarConfig: {
                user: args.userType,
                visible: true
            },
            topBarConfig: {
                userName: args.userName,
                breadcrumbItems: [{ text: 'Universal' }, { text: 'Pages' }, { text: 'Layout' }]
            },
            footerConfig: {
                version: 'v1.0.0'
            }
        });

        return createPageWidthWrapper(page, args.pageWidth);
    },
    args: {
        userType: 'tutor',
        userName: 'Jane Doe',
        ...pageWidthArgs,
        pageWidth: 'md' // Default to Medium (collapsed state)
    },
    argTypes: {
        userType: {
            name: 'User Type (Sidebar)',
            control: { type: 'select' },
            options: ['tutor', 'supervisor']
        },
        userName: {
            name: 'User Name',
            control: 'text'
        },
        ...pageWidthArgTypes
    }
};
