import React from 'react';
import Jumbotron from './Jumbotron';

export default {
    title: 'Components/Jumbotron',
    component: Jumbotron,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Jumbotron component for creating large hero sections. Supports fluid sizing, various paddings, gaps, and radius options, along with title, subtitle, content, and action buttons.'
            }
        }
    },
    argTypes: {
        paddingSize: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Padding size'
        },
        gapSize: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Gap size'
        },
        radiusSize: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Border radius size'
        },
        fluid: {
            control: 'boolean',
            description: 'Fluid width (no border radius)'
        }
    }
};

const Template = (args) => <Jumbotron {...args} />;

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h5>Basic</h5>
            <Jumbotron
                title="Hello, world!"
                children="This is a simple hero unit."
            />
        </section>

        <section>
            <h5>With Actions</h5>
            <Jumbotron
                title="Marketing Hero"
                subtitle="Subtitle text goes here"
                children="This is a hero unit with call to action buttons."
                primaryButton={{ text: "Learn More", onClick: () => console.log('Primary clicked') }}
                secondaryButton={{ text: "Contact Us", onClick: () => console.log('Secondary clicked') }}
            />
        </section>

        <section>
            <h5>Sizes (Small, default, Large padding)</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <Jumbotron
                    title="Small Jumbotron"
                    paddingSize="sm"
                    children="Compact hero section."
                />
                <Jumbotron
                    title="Large Jumbotron"
                    paddingSize="lg"
                    children="Spacious hero section."
                />
            </div>
        </section>
    </div>
);

export const Interactive = Template.bind({});
Interactive.args = {
    title: 'Hello, world!',
    subtitle: 'It uses utility classes for typography and spacing.',
    children: 'This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.',
    primaryButton: { text: "Learn more", style: "primary", fill: "filled" },
    secondaryButton: { text: "Get started", style: "secondary", fill: "outline" },
    fluid: false,
    paddingSize: 'md',
    gapSize: 'md',
    radiusSize: 'md'
};
