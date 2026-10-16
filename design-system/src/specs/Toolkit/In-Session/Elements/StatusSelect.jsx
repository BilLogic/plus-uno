import React from 'react';
import PropTypes from 'prop-types';
import { Select } from '@/components';
import './StatusSelect.scss';

/**
 * StatusSelect — a small single Select that sets a row's status, such as a
 * student's attendance or a tutor's standing. The field takes the colour role
 * of the status picked (`tone`), so a table still scans by colour.
 */
export const StatusSelect = ({ tone, className = '', ...props }) => (
    <Select
        size="small"
        className={['status-select', tone ? `status-select--${tone}` : '', className].filter(Boolean).join(' ')}
        {...props}
    />
);

StatusSelect.propTypes = {
    /** The colour role of the picked status. Without one the field is neutral. */
    tone: PropTypes.oneOf(['success', 'warning', 'danger', 'info']),
    'aria-label': PropTypes.string.isRequired,
    className: PropTypes.string,
};

export default StatusSelect;
