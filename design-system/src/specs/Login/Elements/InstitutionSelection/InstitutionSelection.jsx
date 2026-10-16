import React from 'react';

import { Select } from '@/components';

const INSTITUTION_OPTIONS = [
    'Aspen Heights Middle School',
    'Aspen Heights High School',
    'Bright Futures Academy',
    'Brookfield Middle School',
    'Cedar Valley Middle School',
    'Clearwater Middle School',
    'Eagle Ridge Intermediate School',
].map((name) => ({ value: name, label: name }));

/** What every state shares: a searchable Select with no visible label. */
const field = {
    'aria-label': 'Select your institution',
    options: INSTITUTION_OPTIONS,
    placeholder: 'Type or select your institution',
    searchable: true,
    size: 'medium',
};

/**
 * An open list floats under its field, so the row keeps the list's full
 * height clear below the field and the next state starts under the list.
 */
const openRow = { paddingBottom: 'var(--layout-max-height-listbox)' };

/**
 * Non-interactive spec strip for institution dropdown states: empty, open, typing, filled.
 *
 * @returns {React.ReactElement}
 */
export default function InstitutionSelection() {
    return (
        <div
            style={{
                padding: 'var(--size-section-pad-y-lg)',
                maxWidth: '420px',
            }}
        >
            <h6 className="h6" style={{ marginBottom: 'var(--size-section-pad-y-md)' }}>
                Institution Selection
            </h6>

            <div
                style={{
                    backgroundColor: 'var(--color-surface-container-high)',
                    padding: 'var(--size-section-pad-y-lg)',
                    borderRadius: 'var(--size-card-radius-sm)',
                    border: '1px dashed var(--color-outline-variant)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-section-gap-md)',
                }}
            >
                <div style={{ pointerEvents: 'none' }}>
                    <Select id="institution-empty" {...field} />
                </div>

                <div style={{ pointerEvents: 'none', ...openRow }}>
                    <Select id="institution-open" {...field} open />
                </div>

                <div style={{ pointerEvents: 'none', ...openRow }}>
                    <Select id="institution-typing" {...field} open defaultSearchTerm="Aspen" />
                </div>

                <div style={{ pointerEvents: 'none' }}>
                    <Select id="institution-filled" {...field} defaultValue="Aspen Heights Middle School" />
                </div>
            </div>
        </div>
    );
}
