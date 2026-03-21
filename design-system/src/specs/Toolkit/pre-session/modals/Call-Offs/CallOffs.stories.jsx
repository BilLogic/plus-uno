import React from 'react';
import Modal from '../../../../../components/Modal';
import Button from '../../../../../components/Button';
import Alert from '../../../../../components/Alert';

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
