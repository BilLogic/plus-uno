import React, { useState } from 'react';
import SectionMessage from '@/components/messaging/SectionMessage/SectionMessage';
import Form from 'react-bootstrap/Form';
import Toggle from '@/components/forms-and-inputs/Toggle';
import Checkbox from '@/components/forms-and-inputs/Checkbox';
import Select from '@/components/forms-and-inputs/Select';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Pre-Session/Elements/Call-Off Form/Toggle Organism',
    component: Form,
    parameters: {
        layout: 'padded',
    },
};

const CallOffFormOrganism = ({
    initialToggled = false,
    initialChecked = false,
    isInteractive = false
}) => {
    const [toggled, setToggled] = useState(initialToggled);
    const [checked, setChecked] = useState(initialChecked);

    const handleToggle = (e) => {
        if (isInteractive) {
            setToggled(e.target.checked);
            if (!e.target.checked) setChecked(false);
        }
    };

    const handleCheck = (e) => {
        if (isInteractive) {
            setChecked(e.target.checked);
        }
    };

    const isToggled = isInteractive ? toggled : initialToggled;
    const isChecked = isInteractive ? checked : initialChecked;

    return (
        <div style={{ maxWidth: '531px', fontFamily: 'var(--font-family-body)' }}>
            <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: 'var(--size-section-gap-sm)' }}>
                <div className="d-flex flex-column" style={{ gap: '2px', flex: 1, minWidth: 0 }}>
                    <strong className="d-block body3-txt font-weight-semibold" style={{ color: 'var(--ds-text)' }}>Call off entire recurring session</strong>
                    <span className="body3-txt" style={{ color: 'var(--ds-text-subtle)' }}>This will call you off from all future sessions in this recurring session</span>
                </div>
                {/*
                  * The heading to the left is the switch's visible text, but it
                  * is a `<strong>` in its own column rather than a label, so it
                  * names nothing. `Toggle` passes `aria-label` to its
                  * input, so the name goes there.
                  */}
                <Toggle
                    id={`call-off-switch-${isInteractive ? 'interactive' : (Math.random() + (isChecked ? 'c' : 'u'))}`}
                    isChecked={isToggled}
                    onChange={handleToggle}
                    aria-label="Call off entire recurring session"
                    style={{ width: 'auto' }}/>
            </div>

            {isToggled && (
                <div style={{
                    marginBottom: 'var(--size-section-gap-sm)',
                    '--size-card-gap-sm': 'var(--stack-sm)'      // Override for Figma compliance
                }}>
                    <SectionMessage
                        appearance="warning"
                        dismissible={false}
                        className="mb-0"
                    >
                        {/* Figma Node 221:171732: SectionMessage content has specific padding and gap */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--stack-sm)',
                        }}>
                            <Checkbox
                                id={`supervisor-check-${isInteractive ? 'interactive' : (Math.random() + (isChecked ? 'c' : 'u'))}`}
                                isChecked={isChecked}
                                onChange={handleCheck}
                                style={{ '--stack-sm': 'var(--stack-md)' }}
                                label={
                                    <span className="body2-txt">I have already spoken with my supervisor about dropping this recurring session <span style={{ color: 'var(--ds-text-danger)' }}>*</span></span>
                                }/>
                            <div className="body2-txt" style={{
                                color: 'var(--ds-text-danger)',
                                paddingLeft: '24px', // Approx alignment without nested checkbox padding
                                lineHeight: '1.571'
                            }}>
                                Please contact your supervisor via email/Slack before proceeding.
                            </div>
                        </div>
                    </SectionMessage>
                </div>
            )}

            {isToggled && isChecked && (
                <div style={{ marginBottom: 'var(--stack-lg)' }}>
                    <Form.Group controlId={`supervisor-select-${isInteractive ? 'interactive' : (Math.random() + (isChecked ? 'c' : 'u'))}`}>
                        {/* Figma Node 221:171733: Gap between label and input is element-gap-xs (4px) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                            <Form.Label style={{
                                fontSize: '12px',
                                fontWeight: 400, // Regular
                                fontFamily: 'var(--font-family-body)',
                                marginBottom: 0
                            }}>
                                Which supervisor did you speak with? <span style={{ color: 'var(--ds-text-danger)' }}>*</span>
                            </Form.Label>
                            <Select
                                id={`supervisor-select-${isInteractive ? 'interactive' : (Math.random() + (isChecked ? 'c' : 'u'))}`}
                                options={[
                                    { value: '1', label: 'Supervisor A' },
                                    { value: '2', label: 'Supervisor B' }
                                ]}
                                placeholder="Select a supervisor"
                                isDisabled={!isInteractive}
                                isRequired
                            />
                        </div>
                    </Form.Group>
                </div>
            )}
        </div>
    );
};

export const Overview = () => (
    <div className="d-flex flex-column" style={{ gap: 'var(--size-card-gap-lg)' }}>
        <section>
            <h6 className="h6 mb-3">Overview: States</h6>

            <div style={{ marginBottom: 'var(--size-card-pad-y-lg)' }}>
                <h6 className="text-muted mb-2" style={{ fontSize: '12px' }}>Default (Toggled OFF)</h6>
                <CallOffFormOrganism initialToggled={false} />
            </div>

            <div style={{ marginBottom: 'var(--size-card-pad-y-lg)' }}>
                <h6 className="text-muted mb-2" style={{ fontSize: '12px' }}>Toggled ON (Unchecked)</h6>
                <CallOffFormOrganism initialToggled={true} initialChecked={false} />
            </div>

            <div style={{ marginBottom: 'var(--size-card-pad-y-lg)' }}>
                <h6 className="text-muted mb-2" style={{ fontSize: '12px' }}>Checked (Dropdown Visible)</h6>
                <CallOffFormOrganism initialToggled={true} initialChecked={true} />
            </div>
        </section>
    </div>
);

export const Interactive = () => (
    <div className="border rounded" style={{ padding: 'var(--size-card-pad-y-lg)' }}>
        <h6 className="h6 mb-3">Interactive Demo</h6>
        <CallOffFormOrganism isInteractive={true} />
    </div>
);
