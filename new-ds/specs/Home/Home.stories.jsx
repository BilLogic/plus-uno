import React from 'react';
import { HomeSpec } from './HomeSpec';
import { SpecOverview } from '../SpecOverview';

export default {
    title: 'Specs/Home',
    component: HomeSpec,
    parameters: {
        layout: 'fullscreen',
    },
};

export const Overview = () => (
    <SpecOverview
        title="Home Organism"
        description="The Home organism combines multiple components to create complete home page and dashboard experiences. It is organized into the following categories:"
        categories={[
            { name: 'Elements', description: 'Individual form elements and UI components (resource type icons, dropdowns, badges, buttons)' },
            { name: 'Cards', description: 'Card components (overview cards, resource cards, metrics cards, data visualization, recommended lessons, training progress)' },
            { name: 'Tables', description: 'Table components' },
            { name: 'Modals', description: 'Modal dialogs (user feedback modal)' },
            { name: 'Sections', description: 'Section-level components (homepage jumbotron, bottom div)' },
            { name: 'Pages', description: 'Complete page-level components (skills overview, skills home page)' },
        ]}
    />
);

export const HomePage = () => <HomeSpec />;
