import React, { useState } from 'react';
import Alert from '../../../../../packages/plus-ds/src/components/Alert/Alert';
import Form from 'react-bootstrap/Form';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Call-Off Form (Toggle Organism)',
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
        <div style={{ maxWidth: '600px', fontFamily: '"Merriweather Sans", sans-serif' }}>
            <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: 'var(--size-element-pad-x-lg)', gap: 'var(--size-element-gap-sm)' }}>
                <div>
                    <strong className="d-block" style={{ fontSize: '14px', fontWeight: 600 }}>Call off entire recurring session</strong>
                    <span className="text-muted" style={{ fontSize: '12px' }}>This will call you off from all future sessions in this recurring session</span>
                </div>
                <Form.Check
                    type="switch"
                    id={`call-off-switch-${isInteractive ? 'interactive' : (Math.random() + (isChecked ? 'c' : 'u'))}`}
                    checked={isToggled}
                    onChange={handleToggle}
                    readOnly={!isInteractive}
                />
            </div>

            {isToggled && (
                <div style={{ marginBottom: 'var(--size-element-pad-x-lg)' }}>
                    <Alert style="warning" dismissable={false} className="mb-0">
                        <Form.Check
                            type="checkbox"
                            id={`supervisor-check-${isInteractive ? 'interactive' : (Math.random() + (isChecked ? 'c' : 'u'))}`}
                            checked={isChecked}
                            onChange={handleCheck}
                            readOnly={!isInteractive}
                            label={
                                <div>
                                    <span style={{ fontSize: '12px', fontWeight: 600 }}>I have already spoken with my supervisor about dropping this recurring session</span>
                                    <span className="text-danger ml-1">*</span>
                                    <div className="text-danger mt-1" style={{ fontSize: '12px' }}>
                                        Please contact your supervisor via email/Slack before proceeding.
                                    </div>
                                </div>
                            }
                        />
                    </Alert>
                </div>
            )}

            {isToggled && isChecked && (
                <div style={{ marginBottom: 'var(--size-element-pad-x-lg)' }}>
                    <Form.Group controlId={`supervisor-select-${isInteractive ? 'interactive' : (Math.random() + (isChecked ? 'c' : 'u'))}`}>
                        <Form.Label style={{ fontSize: '12px', fontWeight: 600 }}>
                            Which supervisor did you speak with? <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select aria-label="Select supervisor" style={{ fontSize: '14px' }}>
                            <option>Select a supervisor</option>
                            <option value="1">Supervisor A</option>
                            <option value="2">Supervisor B</option>
                        </Form.Select>
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
