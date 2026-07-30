import React, { useState } from 'react';
import Button from '@/components/actions/Button';
import SaveAndExitModal from './SaveAndExitModal';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Modals/Save And Exit',
    parameters: {
        layout: 'padded',
    },
};

/**
 * Confirmation modal shown when leaving a reflection mid-flow.
 */
export const Default = () => {
    const [show, setShow] = useState(true);

    return (
        <div style={{ minHeight: '320px' }}>
            {!show && (
                <Button
                    text="Open Save & Exit"
                    style="primary"
                    fill="filled"
                    onClick={() => setShow(true)}
                />
            )}
            <SaveAndExitModal
                show={show}
                onClose={() => setShow(false)}
                onExitWithoutSaving={() => setShow(false)}
                onSaveAndExit={() => setShow(false)}
            />
        </div>
    );
};
