import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Select } from '@/components';

/**
 * Students dropdown (Figma Elements · Students dropdown).
 * A multi-select Select labeled with the question, and the helper as its caption.
 *
 * @param {object} props
 * @param {{ id?: string, name: string }[]} [props.students]
 * @param {string[]} [props.selectedIds]
 * @param {(ids: string[]) => void} [props.onChange]
 * @param {string} [props.label]
 * @param {string} [props.helper]
 * @param {boolean} [props.isRequired=true]
 */
const StudentsDropdown = ({
    students = [],
    selectedIds = [],
    onChange,
    label = 'Select the students you tutored',
    helper = 'Pre-filled based on the session attendance you marked. Add or remove as needed.',
    isRequired = true,
}) => {
    const options = useMemo(
        () => students.map((student) => ({
            value: student.id || student.name,
            label: student.name,
        })),
        [students],
    );

    return (
        <div style={{ width: '100%', maxWidth: 'var(--col-9)' }}>
            <Select
                id="students-dropdown"
                label={label}
                isRequired={isRequired}
                caption={helper}
                isMulti
                searchable
                options={options}
                value={selectedIds}
                onChange={onChange}
                placeholder="No students selected yet"
            />
        </div>
    );
};

StudentsDropdown.propTypes = {
    students: PropTypes.array,
    selectedIds: PropTypes.arrayOf(PropTypes.string),
    onChange: PropTypes.func,
    label: PropTypes.string,
    helper: PropTypes.string,
    isRequired: PropTypes.bool,
};

export default StudentsDropdown;
