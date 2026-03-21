/**
 * SessionModal Component
 * 
 * Modal for viewing session breakdown details with student-tutor pairings.
 * Shows a table with Student Name, Student Status, Tutor Name, Tutor Type, Time Spent.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=987-127605
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import SessionBreakdownTable from '../../Tables/SessionBreakdownTable/SessionBreakdownTable';
import '../../Tables/SessionBreakdownTable/SessionBreakdownTable.scss';
import './SessionModal.scss';

const SessionModal = ({
    show = false,
    sessionDate = '11/02/12',
    students = [],
    onHide,
    onSort,
    sortColumn = 'tutorName',
    className = '',
    ...props
}) => {
    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            size="lg"
            className={`session-modal ${className}`}
            {...props}
        >
            <div className="session-modal__container">
                {/* Header */}
                <div className="session-modal__header">
                    <h4 className="h4 session-modal__title">
                        {sessionDate} Session Breakdown
                    </h4>
                    <button
                        type="button"
                        className="session-modal__close"
                        onClick={onHide}
                        aria-label="Close"
                    >
                        <i className="fas fa-xmark" />
                    </button>
                </div>

                {/* Body */}
                <div className="session-modal__body">
                    <SessionBreakdownTable
                        students={students}
                        sortable={true}
                        sortColumn={sortColumn}
                        onSort={onSort}
                    />
                </div>
            </div>
        </Modal>
    );
};

SessionModal.propTypes = {
    /** Whether the modal is visible */
    show: PropTypes.bool,
    /** Session date for the title */
    sessionDate: PropTypes.string,
    /** Array of student breakdown objects */
    students: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        studentName: PropTypes.string,
        studentStatus: PropTypes.string,
        tutorName: PropTypes.string,
        tutorType: PropTypes.oneOf(['Lead', 'Regular']),
        timeSpent: PropTypes.number,
    })),
    /** Callback when modal is closed */
    onHide: PropTypes.func,
    /** Callback when sort changes */
    onSort: PropTypes.func,
    /** Currently sorted column key */
    sortColumn: PropTypes.string,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default SessionModal;
