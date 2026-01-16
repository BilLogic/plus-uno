/**
 * TutorToolUsageSection Component
 * 
 * Section displaying tutor tool usage metrics with multiple chart cards:
 * - Recording Upload (Daily) - Bar Chart
 * - Reflection Completion (Weekly) - Line Chart
 * - Attendance Tracking (Weekly) - Line Chart
 * - Check-in Completion (Weekly) - Line Chart
 * 
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=1009-130962
 */

import React from 'react';
import PropTypes from 'prop-types';
import TutorDataCard from '../../Cards/TutorDataCard/TutorDataCard';
import TutorChartsElement from '../../Elements/TutorChartsElement/TutorChartsElement';
import '../../Cards/TutorDataCard/TutorDataCard.scss';
import './TutorToolUsageSection.scss';

const TutorToolUsageSection = ({
    recordingUploadData,
    reflectionCompletionData,
    attendanceTrackingData,
    checkInCompletionData,
    loading = false,
    className = '',
    ...props
}) => {
    // Default data for Recording Upload (Daily) - Bar Chart
    const defaultRecordingData = (recordingUploadData && recordingUploadData.length > 0) ? recordingUploadData : [
        { label: '10/11', values: [12, 6] },
        { label: '10/12', values: [16, 8] },
        { label: '10/13', values: [12, 5] },
        { label: '10/17', values: [12, 1] },
        { label: '10/18', values: [20, 2] },
        { label: '10/19', values: [12, 9] },
    ];

    // Default data for Reflection Completion (Weekly) - Line Chart
    const defaultReflectionData = (reflectionCompletionData && reflectionCompletionData.length > 0) ? reflectionCompletionData : [
        { label: '06/03/24', values: [5, 0] },
        { label: '06/10/24', values: [60, 20] },
        { label: '06/17/24', values: [55, 75] },
        { label: '06/24/24', values: [65, 30] },
    ];

    // Default data for Attendance Tracking (Weekly) - Line Chart
    const defaultAttendanceData = (attendanceTrackingData && attendanceTrackingData.length > 0) ? attendanceTrackingData : [
        { label: '06/03/24', values: [10, 5] },
        { label: '06/10/24', values: [55, 25] },
        { label: '06/17/24', values: [60, 70] },
        { label: '06/24/24', values: [50, 20] },
    ];

    // Default data for Check-in Completion (Weekly) - Line Chart
    const defaultCheckInData = (checkInCompletionData && checkInCompletionData.length > 0) ? checkInCompletionData : [
        { label: '06/03/24', values: [15, 10] },
        { label: '06/10/24', values: [50, 30] },
        { label: '06/17/24', values: [55, 65] },
        { label: '06/24/24', values: [45, 25] },
    ];

    return (
        <div className={`tutor-tool-usage-section ${className}`} {...props}>
            {/* Recording Upload (Daily) - Bar Chart */}
            <TutorDataCard
                title="Recording Upload (Daily)"
                tooltip="Daily recording upload statistics"
                loading={loading}
            >
                <TutorChartsElement
                    variant="Bar"
                    data={defaultRecordingData}
                    legend={[
                        { label: 'Uploaded', color: '#61b5cf' },
                        { label: 'Missing', color: '#85ecd5' }
                    ]}
                />
            </TutorDataCard>

            {/* Reflection Completion (Weekly) - Line Chart */}
            <TutorDataCard
                title="Reflection Completion (Weekly)"
                tooltip="Weekly reflection completion trends"
                loading={loading}
            >
                <TutorChartsElement
                    variant="Line"
                    data={defaultReflectionData}
                    legend={[
                        { label: 'Lead Tutors', color: '#004b6b' },
                        { label: 'Regular Tutors', color: '#85ecd5' }
                    ]}
                />
            </TutorDataCard>

            {/* Attendance Tracking (Weekly) - Line Chart */}
            <TutorDataCard
                title="Attendance Tracking (Weekly)"
                tooltip="Weekly attendance tracking trends"
                loading={loading}
            >
                <TutorChartsElement
                    variant="Line"
                    data={defaultAttendanceData}
                    legend={[
                        { label: 'Tutor Attendance', color: '#004b6b' },
                        { label: 'Student Attendance', color: '#85ecd5' }
                    ]}
                />
            </TutorDataCard>

            {/* Check-in Completion (Weekly) - Line Chart */}
            <TutorDataCard
                title="Check-in Completion (Weekly)"
                tooltip="Weekly check-in completion trends"
                loading={loading}
            >
                <TutorChartsElement
                    variant="Line"
                    data={defaultCheckInData}
                    legend={[
                        { label: 'Goal-setting schools', color: '#004b6b' },
                        { label: 'Non–goal-setting schools', color: '#85ecd5' }
                    ]}
                />
            </TutorDataCard>
        </div>
    );
};

TutorToolUsageSection.propTypes = {
    /** Recording upload data for bar chart */
    recordingUploadData: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        values: PropTypes.arrayOf(PropTypes.number)
    })),
    /** Reflection completion data for line chart */
    reflectionCompletionData: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        values: PropTypes.arrayOf(PropTypes.number)
    })),
    /** Attendance tracking data for line chart */
    attendanceTrackingData: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        values: PropTypes.arrayOf(PropTypes.number)
    })),
    /** Check-in completion data for line chart */
    checkInCompletionData: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        values: PropTypes.arrayOf(PropTypes.number)
    })),
    /** Loading state for all cards */
    loading: PropTypes.bool,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default TutorToolUsageSection;
