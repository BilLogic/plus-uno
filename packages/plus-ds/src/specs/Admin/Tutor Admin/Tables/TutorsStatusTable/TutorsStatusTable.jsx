/**
 * TutorsStatusTable Component
 * 
 * A variation of the Performance Table focusing on Status (Signed-Up) and handling of missing data.
 * Matches Figma: node-id=258-262388
 */

import React from 'react';
import TutorsPerformanceTable from '../TutorsPerformanceTable/TutorsPerformanceTable';

const TutorsStatusTable = (props) => {
    return <TutorsPerformanceTable className="tutors-status-table" {...props} />;
};

TutorsStatusTable.propTypes = TutorsPerformanceTable.propTypes;

export default TutorsStatusTable;
