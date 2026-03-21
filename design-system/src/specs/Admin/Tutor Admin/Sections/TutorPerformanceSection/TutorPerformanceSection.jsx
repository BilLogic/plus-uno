/**
 * TutorPerformanceSection Component
 * 
 * Section displaying tutor performance overview with two donut charts:
 * - Attendance
 * - Sign-Up Rate
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-262208
 */

import React from 'react';
import PropTypes from 'prop-types';
import TutorDataCard from '../../Cards/TutorDataCard/TutorDataCard';
import TutorChartsElement from '../../Elements/TutorChartsElement/TutorChartsElement';
import '../../Cards/TutorDataCard/TutorDataCard.scss';
import './TutorPerformanceSection.scss';

const TutorPerformanceSection = ({
    attendancePercentage = 95,
    signUpRatePercentage = 85,
    loading = false,
    className = '',
    ...props
}) => {
    return (
        <div className={`tutor-performance-section ${className}`} {...props}>
            <TutorDataCard
                title="Attendance"
                tooltip="Percentage of tutors who attended their assigned sessions"
                loading={loading}
            >
                <TutorChartsElement
                    variant="Pie"
                    donutPercentage={attendancePercentage}
                    donutSubtitle="Attended"
                    legend={[
                        { color: '#61b5cf', label: 'Attended' },
                        { color: '#85ecd5', label: 'Missed' },
                    ]}
                />
            </TutorDataCard>
            <TutorDataCard
                title="Sign-Up Rate"
                tooltip="Percentage of tutors who signed up vs those who did not"
                loading={loading}
            >
                <TutorChartsElement
                    variant="Pie"
                    donutPercentage={signUpRatePercentage}
                    donutSubtitle="Signed Up"
                    legend={[
                        { color: '#61b5cf', label: 'Signed Up' },
                        { color: '#3f484a', label: 'Not Signed Up' },
                    ]}
                />
            </TutorDataCard>
        </div>
    );
};

TutorPerformanceSection.propTypes = {
    /** Attendance percentage */
    attendancePercentage: PropTypes.number,
    /** Sign-up rate percentage */
    signUpRatePercentage: PropTypes.number,
    /** Loading state for both cards */
    loading: PropTypes.bool,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default TutorPerformanceSection;
