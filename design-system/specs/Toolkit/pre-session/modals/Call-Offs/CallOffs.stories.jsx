import React from 'react';
import Modal from '../../../../../../packages/plus-ds/src/components/Modal';
import Button from '../../../../../../packages/plus-ds/src/components/Button';
import Alert from '../../../../../../packages/plus-ds/src/components/Alert';

// Import the reusable ConfirmationAlert component
import { ConfirmationAlert } from '../../cards/CallOffAlerts.stories';
// Import CTA button components from Tutor View
import {
    BackButton,
    SubmitRequestButton,
    CloseButton
} from '../../elements/CTATutorViewButtons.stories';

export default {
    title: 'Specs/Toolkit/Pre-Session/Modals/Call-Offs',
    component: Modal,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};
