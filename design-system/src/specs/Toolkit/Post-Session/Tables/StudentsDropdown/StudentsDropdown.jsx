import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Badge from '@/components/status-and-loading/Badge';
import Checkbox from '@/components/forms-and-inputs/Checkbox';
import Input from '@/components/forms-and-inputs/Input';

/**
 * Students multi-select (Figma Tables · Students Dropdown `20:24325`).
 * Field shows dismissible name tags; menu has Search + checkbox list.
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
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const rootRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        /**
         * @param {MouseEvent} event
         */
        const onDocClick = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [open]);

    const selectedStudents = useMemo(
        () => students.filter((student) => selectedIds.includes(student.id || student.name)),
        [students, selectedIds],
    );

    const filteredStudents = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return students;
        return students.filter((student) => student.name.toLowerCase().includes(q));
    }, [students, query]);

    /**
     * @param {string} id
     */
    const toggleId = (id) => {
        const next = selectedIds.includes(id)
            ? selectedIds.filter((value) => value !== id)
            : [...selectedIds, id];
        onChange?.(next);
    };

    /**
     * @param {string} id
     */
    const removeId = (id) => {
        onChange?.(selectedIds.filter((value) => value !== id));
    };

    return (
        <div
            ref={rootRef}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-element-gap-xs)',
                width: '100%',
                position: 'relative',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-xs)' }}>
                <label className="body3-txt font-weight-semibold m-0" style={{ color: 'var(--color-on-surface)' }}>
                    {label}
                    {required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
                </label>
                {helper && (
                    <p className="body3-txt m-0" style={{ color: 'var(--color-on-surface-variant)' }}>
                        {helper}
                    </p>
                )}
            </div>

            <button
                type="button"
                aria-expanded={open}
                aria-haspopup="listbox"
                onClick={() => setOpen((value) => !value)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--size-element-gap-sm)',
                    width: '100%',
                    minHeight: '40px',
                    padding: 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)',
                    backgroundColor: 'var(--color-surface)',
                    border: '0.8px solid var(--color-outline-variant)',
                    borderRadius: 'var(--size-element-radius-sm, 2px)',
                    cursor: 'pointer',
                    textAlign: 'left',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 'var(--size-element-gap-xs)',
                        flex: 1,
                        minWidth: 0,
                    }}
                >
                    {selectedStudents.length === 0 ? (
                        <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                            No students selected yet
                        </span>
                    ) : (
                        selectedStudents.map((student) => {
                            const id = student.id || student.name;
                            return (
                                <Badge
                                    key={id}
                                    text={student.name}
                                    style="secondary"
                                    size="b3"
                                    dismissible
                                    onDismiss={() => removeId(id)}
                                />
                            );
                        })
                    )}
                </div>
                <i
                    className={`fa-solid ${open ? 'fa-caret-up' : 'fa-caret-down'}`}
                    style={{ color: 'var(--color-on-surface-variant)', fontSize: '12px' }}
                    aria-hidden="true"
                />
            </button>

            {open && (
                <div
                    role="listbox"
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 20,
                        marginTop: '4px',
                        backgroundColor: 'var(--color-surface-container)',
                        border: '1px solid var(--color-outline-variant)',
                        borderRadius: 'var(--size-element-radius-md)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 2px 6px 2px rgba(0,0,0,0.15)',
                        overflow: 'hidden',
                    }}
                >
                    <div style={{ padding: 'var(--size-element-pad-y-sm) var(--size-element-pad-x-sm)' }}>
                        <Input
                            id="students-dropdown-search"
                            type="search"
                            placeholder="Search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            size="small"
                        />
                    </div>
                    <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                        {filteredStudents.map((student) => {
                            const id = student.id || student.name;
                            const checked = selectedIds.includes(id);
                            return (
                                <div
                                    key={id}
                                    role="option"
                                    aria-selected={checked}
                                    onClick={() => toggleId(id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--size-element-gap-md)',
                                        padding: 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)',
                                        cursor: 'pointer',
                                        backgroundColor: checked
                                            ? 'var(--color-primary-state-08)'
                                            : 'transparent',
                                    }}
                                >
                                    <div onClick={(event) => event.stopPropagation()}>
                                        <Checkbox
                                            id={`students-dd-${id}`}
                                            name={`students-dd-${id}`}
                                            label={student.name}
                                            checked={checked}
                                            onChange={() => toggleId(id)}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
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
