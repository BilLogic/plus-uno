/**
 * Sessions Page Prototype Stories
 *
 * Prototype for sessions management interface.
 */

import React from 'react';
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';
import SessionsPage from './SessionsPage';

export default {
  title: 'Playground/Victor/Sessions',
  component: SessionsPage,
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
        component: `Prototype Sessions Page for managing tutoring sessions.

## Features
- View your sessions
- Edit session details
- Track attendance
- Create new sessions

## References
- Sessions management interface prototype`,
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
  render: () => <SessionsPage />,
};
