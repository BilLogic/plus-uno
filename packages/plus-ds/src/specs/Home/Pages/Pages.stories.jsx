/**
 * Home Specs - Pages
 * 
 * Complete page-level components for home/dashboard.
 * 
 * Components:
 * - TutorHomePageSkillsOverview: Tutor home page with Skills Overview tab active
 * - TutorHomePageSkillsProgress: Tutor home page with Skills Progress tab active
 * - TutorHomePageSkillsOverviewDifferentLayout: Alternative layout with Training Progress section
 * 
 * Figma Nodes: 563-206909, 563-192630
 */

import React from 'react';
import TutorHomePageSkillsOverview from './TutorHomePageSkillsOverview';
import TutorHomePageSkillsProgress from './TutorHomePageSkillsProgress';
import TutorHomePageSkillsOverviewDifferentLayout from './TutorHomePageSkillsOverviewDifferentLayout';

export default {
    title: 'Specs/Home/Pages',
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: `Complete page-level components for tutor home dashboard.

## Available Pages

| Page | Description | Figma Node |
|------|-------------|------------|
| TutorHomePageSkillsOverview | Tutor home page with Skills Overview tab active and circular progress impact card | 563-206909 (left) |
| TutorHomePageSkillsProgress | Tutor home page with Skills Progress tab active and rating metrics impact card | 563-206909 (right) |
| TutorHomePageSkillsOverviewDifferentLayout | Alternative layout with Training Progress radar chart and stacked metric cards | 563-192630 |

Both pages include:
- Top navigation with user badge and "My Badge" section
- Primary CTA section (HomepageJumbotron) with sign-up/session/reflection tabs
- Skills visualization card (radar chart or line graph)
- Your Impact card (circular progress or rating metrics)
- Personalized Recommendations carousel section`,
            },
        },
    },
};

/**
 * TutorHomePageSkillsOverview
 * Tutor home page with Skills Overview tab active and circular progress impact card.
 */
export const SkillsOverview = () => {
    const skillsOverviewData = {
        categories: [
            'Teaching Math',
            'Communicating Clearly',
            'Motivating Students',
            'Staying Positive',
            'Managing Time',
            'Fostering Participation'
        ],
        yourPerformance: [60, 55, 80, 90, 70, 85],
        averagePerformance: [70, 70, 65, 75, 60, 70]
    };

    return (
        <TutorHomePageSkillsOverview
            tutorName="John Doe"
            userBadge="Lead"
            skillsOverviewData={skillsOverviewData}
        />
    );
};

/**
 * TutorHomePageSkillsProgress
 * Tutor home page with Skills Progress tab active and rating metrics impact card.
 */
export const SkillsProgress = () => {
    const skillsOverviewData = {
        categories: [
            'Teaching Math',
            'Communicating Clearly',
            'Motivating Students',
            'Staying Positive',
            'Managing Time',
            'Fostering Participation'
        ],
        yourPerformance: [60, 55, 80, 90, 70, 85],
        averagePerformance: [70, 70, 65, 75, 60, 70]
    };

    const skillsProgressData = {
        sessionRanges: ['64-68', '74-78', '84-88', '94-98', '104-108'],
        averageScores: [30, 55, 12, 25, 65]
    };

    return (
        <TutorHomePageSkillsProgress
            tutorName="John Doe"
            userBadge="Lead"
            skillsOverviewData={skillsOverviewData}
            skillsProgressData={skillsProgressData}
        />
    );
};

/**
 * TutorHomePageSkillsOverviewDifferentLayout
 * Alternative layout with Training Progress section showing radar chart and stacked metric cards.
 */
export const SkillsOverviewDifferentLayout = () => {
    const trainingProgressData = {
        categories: [
            'Social Emotional Learning',
            'Mastering Content',
            'Advocacy',
            'Relationships',
            'Technology Tools'
        ],
        completionPercentages: [25, 50, 80, 55, 90]
    };

    return (
        <TutorHomePageSkillsOverviewDifferentLayout
            tutorName="John Doe"
            userBadge="Lead"
            trainingProgressData={trainingProgressData}
        />
    );
};
