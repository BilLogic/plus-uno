import React from 'react';
import StorybookAIAgent from './StorybookAIAgent';
import TutorTrainingProgressPage from '../../../packages/plus-ds/src/specs/Admin/Tutor Admin/Pages/TutorTrainingProgressPage/TutorTrainingProgressPage';
import ResponsiveFrame from '../../../packages/plus-ds/src/specs/Universal/ResponsiveFrame';

export default {
    title: 'Playground/Ashley/Storybook AI Agent',
    component: StorybookAIAgent,
    parameters: {
        layout: 'fullscreen',
        viewport: { defaultViewport: 'desktop' },
        docs: {
            description: {
                component: `
# Storybook Design Productivity AI Agent

A high-fidelity prototype of an AI assistant embedded in Storybook to help designers navigate, understand, and use the design system.

## Key Features
- **Floating Assistant**: Always accessible via ⌘+/
- **Context Awareness**: Detects the current page (Tutor Training Progress)
- **Quick Actions**: "Analyze Page", "Find Component", "Explain Skills"
- **Interactive Chat**: Simulates intelligent responses relevant to the context

## Usage
1. Open this story
2. Press **⌘ + /** or click the floating sparkle icon
3. Try the quick actions or type "Analyze page"
        `,
            },
        },
    },
    argTypes: {
        breakpoint: {
            control: { type: 'select' },
            options: ['md', 'lg', 'xl'],
            description: 'Responsive breakpoint (same as Tutor Admin Training page)',
            table: { category: 'Responsive' },
        },
    },
    decorators: [
        (Story, context) => {
            const breakpoint = context.args?.breakpoint ?? 'xl';
            return (
                <ResponsiveFrame breakpoint={breakpoint}>
                    <Story />
                </ResponsiveFrame>
            );
        },
    ],
};

export const Demo = {
    args: {
        breakpoint: 'xl',
    },
    render: (args) => {
        return (
            <>
                {/* Page fills ResponsiveFrame inner; sidebar shows via sidebarExpanded and breakpoint width */}
                <div style={{ position: 'relative', width: '100%', minHeight: '100%', background: '#F5F6F8' }}>
                    <TutorTrainingProgressPage
                        activeTab="trainingProgress"
                        viewMode="By Tutor"
                        currentPage={1}
                        totalPages={5}
                        totalEntries={48}
                        tutors={[]}
                        onPageChange={() => {}}
                        sidebarExpanded={true}
                    />
                </div>

                {/* The AI Agent overlays the page */}
                <StorybookAIAgent pageContext="Tutor Training Progress Page" />
            </>
        );
    },
};

export const Standalone = {
    args: {
        pageContext: "Generic Context"
    },
    render: (args) => (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0' }}>
            <p>Press ⌘+/ to open the agent</p>
            <StorybookAIAgent {...args} />
        </div>
    )
};
