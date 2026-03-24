import React from 'react';
import StorybookAIAgent from './StorybookAIAgent';
import TutorTrainingProgressPage from '@/specs/Admin/Tutor Admin/Pages/TutorTrainingProgressPage/TutorTrainingProgressPage';
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';

export default {
    title: 'Playground/Ashley/PLUS UNO Inline AI Agent',
    component: StorybookAIAgent,
    parameters: {
        layout: 'fullscreen',
        viewport: { defaultViewport: 'desktop' },
        docs: {
            description: {
                component: `
# Storybook Design Productivity AI Agent — LLM API Version

A GPT-powered AI assistant embedded in Storybook. Uses a real OpenAI backend for smart navigation, component usage guidance, and screen explanation.

## Key Features
- **GPT-Powered Smart Navigation**: Type natural language like "where are the SidebarTab" or "go to modal"
- **Component Usage Guide**: AI-generated guidance on when to use each component
- **Explain This Screen**: GPT analyzes the current Storybook page
- **Floating Assistant**: Always accessible via ⌘+/

## Setup
1. Ensure the backend server is running: \`cd server && npm start\`
2. Add your OpenAI API key to \`server/.env\`
3. Open this story and click the floating sparkle icon
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
                        user={{ name: 'Ashley Xu', counter: true, counterValue: 2 }}
                        viewMode="By Tutor"
                        currentPage={1}
                        totalPages={5}
                        totalEntries={48}
                        tutors={[]}
                        onPageChange={() => { }}
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
