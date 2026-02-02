import { TutorBadge, LeadBadge, CountBadge } from './TutorBadges.jsx';

export default {
    title: 'Specs/Toolkit/Pre-session/Elements/Badges/Tutor Badges',
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Tutor status badges used to indicate "You" (current user) and "Lead" (session lead).'
            }
        }
    }
};

export const SelfIndicator = () => <TutorBadge />;

export const LeadIndicator = () => <LeadBadge />;

export const CountIndicator = () => <CountBadge count={4} />;
