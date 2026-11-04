import React from 'react';
import PropTypes from 'prop-types';

/**
 * Displays the tutor's session notes for a student.
 *
 * @param {object} props
 * @param {'empty'|'filled'} [props.state='empty']
 * @param {string} [props.notes]
 */
const SessionNotes = ({ state = 'empty', notes = '' }) => (
    <div
        style={{
            backgroundColor: 'var(--ds-background-neutral)',
            border: `1px solid ${state === 'filled' ? 'var(--ds-border-bold)' : 'var(--ds-border)'}`,
            padding: 'var(--pad-y-md) var(--pad-x-sm)',
            width: '100%',
            maxWidth: 'var(--col-8)',
        }}
    >
        {state === 'filled' ? (
            <>
                <p className="body2-txt font-weight-semibold m-0" style={{ color: 'var(--ds-text)' }}>
                    Your Notes from the session:
                </p>
                <p className="body2-txt m-0" style={{ color: 'var(--ds-text)' }}>{notes}</p>
            </>
        ) : (
            <p className="body2-txt m-0" style={{ color: 'var(--ds-text-subtle)' }}>
                You didn’t leave notes for this student in this session.
            </p>
        )}
    </div>
);

SessionNotes.propTypes = {
    state: PropTypes.oneOf(['empty', 'filled']),
    notes: PropTypes.string,
};

export default SessionNotes;
