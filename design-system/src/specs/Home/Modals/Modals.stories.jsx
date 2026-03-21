/**
 * Home - Modals
 * Modal-level components for Home.
 */
import React, { useState } from 'react';
import ReportProblemModal from './ReportProblemModal';
import LookForHelpModal from './LookForHelpModal';
import ShareIdeasModal from './ShareIdeasModal';

export default {
    title: 'Specs/Home/Modals',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Modal-level components for Home pages.

## Available Modals

| Modal | Description | Figma Node |
|-------|-------------|------------|
| ReportProblemModal | Modal for reporting problems with impact rating (flag icons) | 83-126557 |
| LookForHelpModal | Modal for asking questions with urgency rating (clock icons) | 83-126557 |
| ShareIdeasModal | Modal for sharing feature suggestions with urgency rating (lightbulb icons) | 83-126557 |

All modals share a consistent structure:
- Type selection (Problem, Question, Feedback)
- Rating system with icon-only buttons (5 levels)
- Product area dropdown
- Textarea for detailed input
- Image upload option
- Email contact information in footer`
            }
        }
    }
};

export const Overview = {
    render: () => {
        return (
            <div style={{ 
                padding: 'var(--size-section-pad-y-lg)', 
                display: 'flex', 
                flexDirection: 'column',
                gap: 'var(--size-section-gap-lg)',
                alignItems: 'center'
            }}>
                <div style={{ maxWidth: '100%', width: '100%' }}>
                    <h2 className="h2" style={{ marginBottom: 'var(--size-section-gap-md)' }}>Home Modals</h2>
                    <p className="body2-txt" style={{ marginBottom: 'var(--size-section-gap-lg)', color: 'var(--color-on-surface-variant)' }}>
                        Three feedback modals for reporting problems, asking questions, and sharing ideas. Figma Node: 83-126557
                    </p>
                </div>

                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'row', 
                    gap: 'var(--size-section-gap-md)',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    width: '100%',
                    alignItems: 'flex-start'
                }}>
                    <ReportProblemModal
                        show={true}
                        noOverlay={true}
                        onClose={() => console.log('Report Problem Modal closed')}
                        onSubmit={(data) => console.log('Problem submitted:', data)}
                    />

                    <LookForHelpModal
                        show={true}
                        noOverlay={true}
                        onClose={() => console.log('Look for Help Modal closed')}
                        onSubmit={(data) => console.log('Question submitted:', data)}
                    />

                    <ShareIdeasModal
                        show={true}
                        noOverlay={true}
                        onClose={() => console.log('Share Ideas Modal closed')}
                        onSubmit={(data) => console.log('Feedback submitted:', data)}
                    />
                </div>
            </div>
        );
    }
};
