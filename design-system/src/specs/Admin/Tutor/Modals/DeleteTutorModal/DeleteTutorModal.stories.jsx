/**
 * DeleteTutorModal Stories
 */

import React, { useState, useEffect } from 'react';
import DeleteTutorModal from './DeleteTutorModal';

export default {
    title: 'Specs/Admin/Tutor/Modals/Delete Tutor Modal',
    tags: ['!dev', '!autodocs'],
    component: DeleteTutorModal,
    parameters: {
        docs: {
            description: {
                component: `Confirmation modal for deleting a tutor. Matches Figma Node 258-262383.`
            }
        }
    },
    argTypes: {
        show: {
            control: 'boolean',
            description: 'Whether the modal is visible',
            table: { category: 'State' },
        },
    }
};

export const Default = {
    args: {
        show: false,
        onDelete: () => console.log('Delete tutor'),
    },
    render: (args) => {
        const [show, setShow] = useState(args.show);
        useEffect(() => {
            setShow(args.show);
        }, [args.show]);
        return (
            <>
                <button onClick={() => setShow(true)}>Open Delete Tutor Modal</button>
                <DeleteTutorModal
                    {...args}
                    show={show}
                    onHide={() => setShow(false)}
                />
            </>
        );
    }
};
