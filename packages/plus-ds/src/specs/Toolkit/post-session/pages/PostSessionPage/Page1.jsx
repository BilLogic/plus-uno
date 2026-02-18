import React, { useState } from 'react';
import PropTypes from 'prop-types';
import SideNavBar from '../../sections/SideNavBar/SideNavBar';
import SessionInformationForm from '../../sections/SessionInformationForm/SessionInformationForm';

const Page1 = ({
    initialSessionData,
    initialStudents = [],
    initialSelectedStudents = [],
    className
}) => {
    // Page 1 specifically focuses on the "Session Information" tab
    const [activeTab, setActiveTab] = useState('session-information');
    const [sessionData, setSessionData] = useState(initialSessionData);

    // Maintain student selection state for this page view
    const [selectedStudentIds, setSelectedStudentIds] = useState(initialSelectedStudents);

    // Filter students for sidebar
    const activeStudents = initialStudents.filter(s => selectedStudentIds.includes(s.name));

    return (
        <div className={`post-session-page-1 ${className}`} style={{ display: 'flex', gap: '24px', minHeight: '600px', backgroundColor: 'var(--color-surface)', padding: '24px' }}>
            <SideNavBar
                state="default"
                students={activeStudents}
                activeTab={activeTab}
                onTabClick={setActiveTab}
            />
            <div style={{ flex: 1 }}>
                {activeTab === 'session-information' ? (
                    <SessionInformationForm
                        initialData={sessionData}
                        availableStudents={initialStudents}
                        selectedStudentIds={selectedStudentIds}
                        onStudentSelectionChange={setSelectedStudentIds}
                        onSave={(data) => {
                            setSessionData(data);
                            console.log('Session Info Saved:', data);
                            // In a real app, this would navigate to Page 2
                        }}
                    />
                ) : (
                    <div className="p-5 text-center text-muted">
                        Navigate to other pages (outside scope of Page 1 view)
                    </div>
                )}
            </div>
        </div>
    );
};

Page1.propTypes = {
    initialSessionData: PropTypes.object,
    initialStudents: PropTypes.array,
    initialSelectedStudents: PropTypes.array,
    className: PropTypes.string,
};

Page1.defaultProps = {
    initialSessionData: {},
    initialStudents: [],
    initialSelectedStudents: [],
    className: '',
};

export default Page1;
