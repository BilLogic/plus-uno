import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Select from '@/components/forms-and-inputs/Select';

/**
 * Students multi-select (Figma Elements · Students Dropdown `20:24325`).
 * B3 label + helper; field shows secondary Badges (no border); menu = Search + checkboxes.
 *
 * @param {object} props
 * @param {{ id?: string, name: string }[]} [props.students=[]]
 * @param {string[]} [props.selectedIds=[]]
 * @param {(ids: string[]) => void} [props.onChange]
 * @param {string} [props.label='Select the students you tutored']
 * @param {string} [props.helper]
 * @param {boolean} [props.required=true]
 */
const StudentsDropdown = ({
    students = [],
    selectedIds = [],
    onChange,
    label = 'Select the students you tutored',
    helper = 'Pre-filled based on the session attendance you marked. Add or remove as needed.',
    required = true,
}) => {
    const options = useMemo(
        () => students.map((student) => ({
            value: student.id || student.name,
            label: student.name,
        })),
        [students],
    );

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-element-gap-xs)',
                width: '100%',
                maxWidth: '480px',
            }}
        >
            <label className="body3-txt font-weight-semibold m-0" style={{ color: 'var(--color-on-surface)' }}>
                {label}
                {required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
            </label>
            {helper && (
                <p className="body3-txt m-0" style={{ color: 'var(--color-on-surface-variant)' }}>
                    {helper}
                </p>
            )}
            <Select
                id="students-dropdown"
                mode="multi"
                searchable
                displayMode="badges"
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
    required: PropTypes.bool,
};

export default StudentsDropdown;
