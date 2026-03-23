import React from 'react';

/**
 * In-Session Pages
 * 
 * Documentation and overview for In-Session Pages.
 */

export default {
  title: 'Specs/Toolkit/In-Session/Pages',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Overview and documentation for In-Session Pages.',
      },
    },
  },
};

/**
 * Overview
 */
export const Overview = {
  render: () => (
    <div style={{ padding: '2rem' }}>
      <h1>In-Session Pages</h1>
      <p className="body1-txt">
        This section contains documentation and components for <strong>Pages</strong>{' '}
        within the <strong>In-Session</strong> phase.
      </p>
      <p className="body2-txt" style={{ marginTop: '1rem', color: 'var(--color-on-surface-variant)' }}>
        Add specific components and documentation here.
      </p>
    </div>
  )
};
