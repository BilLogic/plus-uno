/**
 * Training Progress Page Prototype Stories
 *
 * Prototype for tracking tutor training progress.
 */

import React from 'react';
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';
import TrainingProgressPage from './TrainingProgressPage';

export default {
  title: 'Playground/Victor/Training Progress',
  component: TrainingProgressPage,
  tags: ['autodocs'],
  decorators: [
    (Story, context) => (
      <ResponsiveFrame breakpoint={context.args.breakpoint || 'xl'}>
        <Story />
      </ResponsiveFrame>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `Prototype Training Progress Page for tracking tutor training completion.

## Features
- View training progress overview
- See tutor lesson details
- Track completion status
- View detailed lesson information

## References
- Figma node 367-146235
- TutorTrainingProgressPage component
- TutorLessonDetailsModal component`,
      },
    },
  },
  argTypes: {
    breakpoint: {
      control: { type: 'select' },
      options: ['md', 'lg', 'xl'],
      description: 'Responsive breakpoint',
      table: { category: 'Responsive' },
    },
  },
};

export const Default = {
  args: {
    breakpoint: 'xl',
  },
  render: () => <TrainingProgressPage />,
};
