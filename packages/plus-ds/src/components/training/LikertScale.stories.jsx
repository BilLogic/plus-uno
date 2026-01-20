import React, { useState } from 'react';
import LikertScale from './LikertScale';

export default {
    title: 'Specs/Training/LikertScale',
    component: LikertScale,
    tags: ['autodocs'],
    argTypes: {
        leftLabel: { control: 'text' },
        rightLabel: { control: 'text' },
        rating: { control: { type: 'select', options: ['rest', 1, 2, 3, 4, 5] } }
    }
};

export const Default = {
    args: {
        leftLabel: "Not confident",
        rightLabel: "Very confident",
        rating: "rest"
    }
};

export const Interactive = () => {
    const [rating, setRating] = useState('rest');
    return (
        <LikertScale
            leftLabel="Not at all confident"
            rightLabel="Extremely confident"
            rating={rating}
            onRatingChange={setRating}
        />
    );
};
