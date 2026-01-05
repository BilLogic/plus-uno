/**
 * In-Session Sections
 * 
 * Documentation and overview for In-Session Sections.
 */

export default {
  title: 'Specs/Toolkit/In-Session/Sections',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Overview and documentation for In-Session Sections.',
      },
    },
  },
};

/**
 * Overview
 */
export const Overview = {
  render: () => {
    return `
      <div style="padding: 2rem;">
        <h1>In-Session Sections</h1>
        <p class="body1-txt">
          This section contains documentation and components for <strong>Sections</strong> 
          within the <strong>In-Session</strong> phase.
        </p>
        <p class="body2-txt" style="margin-top: 1rem; color: var(--color-on-surface-variant);">
          Add specific components and documentation here.
        </p>
      </div>
    `;
  }
};
