import React from 'react';

import Input from '@/components/forms-and-inputs/Input';
import OptionList from '@/components/forms-and-inputs/OptionList';

const INSTITUTION_OPTIONS = [
    'Aspen Heights Middle School',
    'Aspen Heights High School',
    'Bright Futures Academy',
    'Brookfield Middle School',
    'Cedar Valley Middle School',
    'Clearwater Middle School',
    'Eagle Ridge Intermediate School',
];

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
                    <Input
                        id="institution-empty"
                        name="institution-empty"
                        label="Select your institution"
                        showLabel={false}
                        placeholder="Type or select your institution"
                        trailingVisual="dropdown"
                        size="medium"
                        style={{ backgroundColor: 'var(--color-surface)' }}
                    />
                </div>

                <div style={{ pointerEvents: 'none' }}>
                    <Input
                        id="institution-open"
                        name="institution-open"
                        label="Select your institution"
                        showLabel={false}
                        placeholder="Type or select your institution"
                        trailingVisual={<i className="fa-solid fa-caret-up" aria-hidden="true" />}
                        size="medium"
                        style={{ backgroundColor: 'var(--color-surface)' }}
                    />
                    <div
                        style={{
                            marginTop: 'var(--size-element-gap-xs)',
                            backgroundColor: 'var(--color-surface-container)',
                            borderRadius: 'var(--size-modal-radius-sm)',
                            border: '1px solid var(--color-outline-variant)',
                            boxShadow: 'var(--elevation-light-2)',
                            maxHeight: '200px',
                            overflowY: 'auto',
                        }}
                    >
                        <OptionList
                            id="institution-open-options"
                            flush
                            options={INSTITUTION_OPTIONS}
                            defaultValue={null}
                        />
                    </div>
                </div>

                <div style={{ pointerEvents: 'none' }}>
                    <Input
                        id="institution-typing"
                        name="institution-typing"
                        label="Select your institution"
                        showLabel={false}
                        value="Aspen"
                        placeholder="Type or select your institution"
                        trailingVisual={<i className="fa-solid fa-caret-up" aria-hidden="true" />}
                        size="medium"
                        style={{ backgroundColor: 'var(--color-surface)' }}
                        readOnly
                    />
                    <div
                        style={{
                            marginTop: 'var(--size-element-gap-xs)',
                            backgroundColor: 'var(--color-surface-container)',
                            borderRadius: 'var(--size-modal-radius-sm)',
                            border: '1px solid var(--color-outline-variant)',
                            boxShadow: 'var(--elevation-light-2)',
                            maxHeight: '120px',
                            overflowY: 'auto',
                        }}
                    >
                        <OptionList
                            id="institution-typing-options"
                            flush
                            options={[
                                'Aspen Heights Middle School',
                                'Aspen Heights High School',
                            ]}
                            defaultValue={null}
                        />
                    </div>
                </div>

                <div style={{ pointerEvents: 'none' }}>
                    <Input
                        id="institution-filled"
                        name="institution-filled"
                        label="Select your institution"
                        showLabel={false}
                        value="Aspen Heights Middle School"
                        placeholder="Type or select your institution"
                        trailingVisual="dropdown"
                        size="medium"
                        style={{ backgroundColor: 'var(--color-surface)' }}
                        readOnly
                    />
                </div>
            </div>
        </div>
    );
}
