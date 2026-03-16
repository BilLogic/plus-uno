import React from 'react';

/**
 * Pre-Session Pages
 * 
 * Documentation and overview for Pre-Session Pages.
 */

export default {
  title: 'Specs/Toolkit/Pre-Session/Pages',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Overview and documentation for Pre-Session Pages.',
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
      <h1>Pre-Session Pages</h1>
      <p className="body1-txt">
        This section contains documentation and components for <strong>Pages</strong>{' '}
        within the <strong>Pre-Session</strong> phase.
      </p>
      <p className="body2-txt" style={{ marginTop: '1rem', color: 'var(--color-on-surface-variant)' }}>
        Add specific components and documentation here.
      </p>
    </div>
  )
};
