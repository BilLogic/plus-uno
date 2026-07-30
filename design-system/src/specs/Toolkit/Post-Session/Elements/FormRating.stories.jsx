import React, { useState } from 'react';
import Rating from '@/components/forms-and-inputs/Rating';
import { FORM_RATING_COMMENTS } from '@/specs/Toolkit/Post-Session/reflectionCopy';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Elements/Form Rating',
    parameters: {
        layout: 'padded',
    },
};

/**
 * Form Rating
 * Uses the shared Rating form component and renders each rating state
 * with matching form feedback comments.
 */
export const FormRating = {
    args: { value: 0 },
    argTypes: { value: { control: { type: 'range', min: 0, max: 5, step: 1 } } },
    /** Renders a controllable Form Rating field. */
    render: function FormRatingPlayground(args) {
        const [value, setValue] = useState(args.value);
        return (
            <Rating
                id="form-rating"
                value={value}
                onChange={setValue}
                icon="thumbs-up"
                variant="comments"
                showCommentsLabel={value > 0}
                commentsLabel={FORM_RATING_COMMENTS[value]}
            />
        );
    },
};
