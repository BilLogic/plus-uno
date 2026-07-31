import React, { useState } from 'react';
import FormRating from './FormRating';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Elements/Form Rating',
    parameters: {
        layout: 'padded',
    },
};

/**
 * Form Rating
 * Uses the Form Rating Element (Foundations Rating + form comment copy).
 */
export const Overview = {
    args: { value: 0 },
    argTypes: { value: { control: { type: 'range', min: 0, max: 5, step: 1 } } },
    /** Renders a controllable Form Rating field. */
    render: function FormRatingPlayground(args) {
        const [value, setValue] = useState(args.value);
        return <FormRating id="form-rating" value={value} onChange={setValue} />;
    },
};
