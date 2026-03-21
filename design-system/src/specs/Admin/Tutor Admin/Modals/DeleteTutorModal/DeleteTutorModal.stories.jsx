/**
 * DeleteTutorModal Stories
 */

import DeleteTutorModal from './DeleteTutorModal';

export default {
    title: 'Specs/Admin/Tutor Admin/Modals/DeleteTutorModal',
    component: DeleteTutorModal,
    parameters: {
        docs: {
            description: {
                component: `Confirmation modal for deleting a tutor. Matches Figma Node 258-262383.`
            }
        }
    }
};

export const Default = {
    args: {
        show: true,
        onHide: () => console.log('Hide modal'),
        onDelete: () => console.log('Delete tutor'),
    }
};
