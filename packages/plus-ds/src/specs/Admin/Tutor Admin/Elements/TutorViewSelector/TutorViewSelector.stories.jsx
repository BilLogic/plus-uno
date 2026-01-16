/**
 * TutorViewSelector Story
 * 
 * Demonstrates the view selector component for switching between Tutor, Lesson, and Group views.
 */

import React from 'react';
import TutorViewSelector from './TutorViewSelector';
import './TutorViewSelector.scss';

export default {
    title: 'Specs/Admin/Tutor Admin/Elements/TutorViewSelector',
    component: TutorViewSelector,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `View toggle component for switching between By Tutor, By Lesson, and By Group views.
                
Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=433-370355

## Usage
Used in Tutor Admin pages to switch between different data views.`
            }
        }
    },
    argTypes: {
        activeView: {
            control: 'select',
            options: ['tutor', 'lesson', 'group'],
            description: 'Currently active view'
        }
    }
};

export const Default = {
    args: {
        activeView: 'tutor'
    }
};

export const ByLesson = {
    args: {
        activeView: 'lesson'
    }
};

export const ByGroup = {
    args: {
        activeView: 'group'
    }
};

export const Interactive = {
    render: () => {
        const [activeView, setActiveView] = React.useState('tutor');
        return (
            <div style={{ padding: '24px', backgroundColor: 'var(--color-surface)' }}>
                <TutorViewSelector activeView={activeView} onViewChange={setActiveView} />
                <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'white', borderRadius: '8px' }}>
                    <p className="body2-txt">Current view: <strong>{activeView}</strong></p>
                </div>
            </div>
        );
    }
};
