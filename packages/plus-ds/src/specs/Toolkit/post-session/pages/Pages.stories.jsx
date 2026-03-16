import React from 'react';

/**
 * Post-Session Pages
 * 
 * Documentation and overview for Post-Session Pages.
 */

export default {
  title: 'Specs/Toolkit/Post-Session/Pages',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Overview and documentation for Post-Session Pages.',
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
      <h1>Post-Session Pages</h1>
      <p className="body1-txt">
        This section contains documentation and components for <strong>Pages</strong>{' '}
        within the <strong>Post-Session</strong> phase.
      </p>
      <p className="body2-txt" style={{ marginTop: '1rem', color: 'var(--color-on-surface-variant)' }}>
        Add specific components and documentation here.
      </p>
    </div>
  )
};
