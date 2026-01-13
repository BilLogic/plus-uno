import React from 'react';
import SessionAvailabilitySnackbar from '../../../components/SessionAvailabilitySnackbar';

export default {
    title: 'Specs/Toolkit/Elements/Session Availability Snackbar (Tutor)',
    component: SessionAvailabilitySnackbar,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Snackbar notifications for tutor session availability confirmation. Fixed width 300px.'
            }
        }
    },
    argTypes: {
        type: {
            control: { type: 'select' },
            options: ['one-time session', 'recurring session']
        },
        available: {
            control: 'boolean'
        },
        timestamp: {
            control: 'text'
        },
        onClose: { action: 'close clicked' }
    }
};

const Template = (args) => <SessionAvailabilitySnackbar {...args} />;

export const AllVariations = () => (
    <div className="d-flex flex-column" style={{ padding: '60px', gap: '60px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <div>
            <h5 className="text-muted mb-2">Session Availability Confirmation</h5>
            <p className="text-muted small mb-0">All supported variations. Fixed width: 300px.</p>
        </div>

        <div className="d-flex flex-wrap align-items-start" style={{ gap: '60px' }}>
            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>One-time: Available</h6>
                <SessionAvailabilitySnackbar type="one-time session" available={true} timestamp="1 mins ago" />
            </div>

            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>One-time: Unavailable</h6>
                <SessionAvailabilitySnackbar type="one-time session" available={false} timestamp="1 mins ago" />
            </div>

            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>Recurring: Available</h6>
                <SessionAvailabilitySnackbar type="recurring session" available={true} timestamp="1 mins ago" />
            </div>

            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>Recurring: Unavailable</h6>
                <SessionAvailabilitySnackbar type="recurring session" available={false} timestamp="1 mins ago" />
            </div>
        </div>
    </div>
);

export const Interactive = Template.bind({});
Interactive.args = {
    type: 'one-time session',
    available: true,
    timestamp: '1 mins ago'
};
Interactive.parameters = {
    layout: 'centered'
};
