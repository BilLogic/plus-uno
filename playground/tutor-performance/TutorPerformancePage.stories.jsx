/**
 * Tutor Performance Page Prototype Stories
 *
 * Prototype for tutor performance tracking and management.
 */

import React from 'react';
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';
import TutorPerformancePage from './TutorPerformancePage';

export default {
  title: 'Playground/Victor/Tutor Performance',
  component: TutorPerformancePage,
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
        component: `Prototype Tutor Performance Page for tracking tutor metrics.

## Features
- View tutor performance metrics
- Filter by school, tutor, and date range
- View attendance details
- View lesson details
- Performance charts and statistics

## References
- Figma node 481-163968
- AdminDateRangeFilter component
- TutorsPerformanceTable component`,
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
  render: () => <TutorPerformancePage />,
};
