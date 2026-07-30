import React from 'react';
import ConfirmationPopUp from './ConfirmationPopUp';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Modals/Confirmation Pop-up',
    parameters: {
        layout: 'padded',
    },
};

/**
 * All three Figma types on one canvas — no separate subpages.
 */
export const Overview = {
    render: () => (
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '24px',
                alignItems: 'flex-start',
            }}
        >
            {['exit-without-saving', 'exit', 'reflection-submitted'].map((type) => (
                <ConfirmationPopUp
                    key={type}
                    show
                    type={type}
                    renderAs="inline"
                    onClose={() => {}}
                    onPrimary={() => {}}
                    onSecondary={() => {}}
                />
            ))}
        </div>
    ),
};
