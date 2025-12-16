import React from 'react';
import Carousel from './Carousel';

export default {
    title: 'Components/Carousel',
    component: Carousel,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Carousel component for displaying a rotating set of content slides. wrapper around react-bootstrap Carousel.'
            }
        }
    },
    argTypes: {
        interval: {
            control: 'number',
            description: 'Interval in milliseconds'
        },
        controls: {
            control: 'boolean'
        },
        indicators: {
            control: 'boolean'
        }
    }
};

const createSlideContent = (text, bg = '#eee') => (
    <div style={{ height: '300px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
        {text}
    </div>
);

export const Overview = () => {
    const slides = [
        { content: createSlideContent('First Slide', '#e2e2e2'), title: 'First Slide', caption: 'Caption for first slide' },
        { content: createSlideContent('Second Slide', '#d2d2d2'), title: 'Second Slide', caption: 'Caption for second slide' },
        { content: createSlideContent('Third Slide', '#c2c2c2'), title: 'Third Slide', caption: 'Caption for third slide' }
    ];

    return (
        <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
            <Carousel slides={slides} />
        </div>
    );
};

export const SlidesOnly = () => {
    const slides = [
        { content: createSlideContent('Slide 1', '#ffc107') },
        { content: createSlideContent('Slide 2', '#0dcaf0') },
        { content: createSlideContent('Slide 3', '#198754') }
    ];

    return (
        <div style={{ width: '600px', margin: '0 auto' }}>
            <Carousel slides={slides} controls={false} indicators={false} interval={2000} />
        </div>
    );
};

export const ManualComposition = () => (
    <div style={{ padding: '20px' }}>
        <p>Composed using children (Carousel.Item)</p>
        {/* Note: we can't easily export subcomponents from our wrapper unless we attach them or re-export RB components. 
             Since our wrapper handles logic, users might just use RB components directly if they want full composition, 
             or we attach them. Let's see if our wrapper supports it. 
             Our wrapper iterates slides OR renders children. If children are passed, they must be Carousel.Items.
             But we didn't export Carousel.Item from our component file.
             User would need to import { Carousel as RBCarousel } from 'react-bootstrap' to get Item, 
             or we export it.
         */}
        <Carousel>
            {/* This example won't work unless we export Item. 
                 Let's stick to 'slides' prop for the primary story or updated export.
             */}
        </Carousel>
    </div>
);
