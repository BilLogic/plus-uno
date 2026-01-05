/**
 * Pre-Session Sections
 * 
 * Documentation and overview for Pre-Session Sections.
 */

export default {
  title: 'Specs/Toolkit/Pre-Session/Sections',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Overview and documentation for Pre-Session Sections.',
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
        <h1>Pre-Session Sections</h1>
        <p class="body1-txt">
          This section contains documentation and components for <strong>Sections</strong> 
          within the <strong>Pre-Session</strong> phase.
        </p>
        <p class="body2-txt" style="margin-top: 1rem; color: var(--color-on-surface-variant);">
          Add specific components and documentation here.
        </p>
      </div>
    `;
  }
};
