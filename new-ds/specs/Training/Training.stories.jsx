import React from 'react';
import { LessonsSpec } from './Lessons/LessonsSpec';
import { OnboardingSpec } from './Onboarding/OnboardingSpec';
import { SpecOverview } from '../SpecOverview';

export default {
    title: 'Specs/Training',
    parameters: {
        layout: 'fullscreen',
    },
};

export const Overview = () => (
    <SpecOverview
        title="Training"
        description="Training hub for tutors, including lessons and onboarding modules."
        categories={[
            {
                title: 'Sections',
                items: [
                    'Lessons Dashboard',
                    'Onboarding Experience'
                ]
            }
        ]}
    />
);

export const LessonsPage = () => <LessonsSpec />;
export const OnboardingPage = () => <OnboardingSpec />;
