import React from 'react';
import { TutorBadge, LeadBadge, CountBadge } from './TutorBadges.jsx';

export default {
    title: 'Specs/Toolkit/In-Session/Elements/Badges/Tutor Badges',
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Tutor status badges used in session rosters to indicate "You" (current user), "Lead" (session lead), or a count of attendees.'
            }
        }
    }
};

export const SelfIndicator = () => <TutorBadge />;

export const LeadIndicator = () => <LeadBadge />;

export const CountIndicator = () => <CountBadge count={4} />;
