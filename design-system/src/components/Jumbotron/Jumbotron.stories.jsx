import React from 'react';
import Jumbotron from './Jumbotron';

export default {
    title: 'Components/Jumbotron',
    component: Jumbotron,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: 'Jumbotron component for creating large hero sections. Supports fluid sizing, various paddings, gaps, and radius options, along with title, subtitle, content, and action buttons.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        title: {
            control: 'text',
            description: 'Headline text',
            table: { category: 'Content' }
        },
        subtitle: {
            control: 'text',
            description: 'Supporting subtitle',
            table: { category: 'Content' }
        },
        actionPreset: {
            control: 'select',
            options: ['none', 'primary', 'both'],
            description: 'Curated action-button combination',
            table: { category: 'Content' }
        },
        paddingSize: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Padding size',
            table: { category: 'Design' }
        },
        gapSize: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Gap size',
            table: { category: 'Design' }
        },
        radiusSize: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Border radius size',
            table: { category: 'Design' }
        },
        fluid: {
            control: 'boolean',
            description: 'Fluid width (no border radius)',
            table: { category: 'Layout' }
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        primaryButton: {
            table: { disable: true, category: 'Development' }
        },
        secondaryButton: {
            table: { disable: true, category: 'Development' }
        }
    }
};

const Template = (args) => <Jumbotron {...args} />;

const col = { display: 'flex', flexDirection: 'column', gap: '48px' };

function JumbotronBasicDemo() {
    return (
        <section>
            <h5>Basic</h5>
            <Jumbotron
                title="Hello, world!"
                children="This is a simple hero unit."
            />
        </section>
    );
}

function JumbotronActionsDemo() {
    return (
        <section>
            <h5>With Actions</h5>
            <Jumbotron
                title="Marketing Hero"
                subtitle="Subtitle text goes here"
                children="This is a hero unit with call to action buttons."
                primaryButton={{ text: 'Learn More', onClick: () => console.log('Primary clicked') }}
                secondaryButton={{ text: 'Contact Us', onClick: () => console.log('Secondary clicked') }}
            />
        </section>
    );
}

function JumbotronSizesDemo() {
    return (
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
    );
}

export const Basic = () => (
    <div style={col}>
        <JumbotronBasicDemo />
    </div>
);

export const WithActions = () => (
    <div style={col}>
        <JumbotronActionsDemo />
    </div>
);

export const Sizes = () => (
    <div style={col}>
        <JumbotronSizesDemo />
    </div>
);

export const Overview = () => (
    <div style={col}>
        <JumbotronBasicDemo />
        <JumbotronActionsDemo />
        <JumbotronSizesDemo />
    </div>
);

export const Interactive = Template.bind({});
Interactive.args = {
    actionPreset: 'both',
    title: 'Hello, world!',
    subtitle: 'It uses utility classes for typography and spacing.',
    children: 'This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.',
    fluid: false,
    paddingSize: 'md',
    gapSize: 'md',
    radiusSize: 'md'
};
Interactive.render = (args) => (
    <Jumbotron
        title={args.title}
        subtitle={args.subtitle}
        fluid={args.fluid}
        paddingSize={args.paddingSize}
        gapSize={args.gapSize}
        radiusSize={args.radiusSize}
        primaryButton={args.actionPreset === 'none' ? null : { text: 'Learn more', style: 'primary', fill: 'filled' }}
        secondaryButton={args.actionPreset === 'both' ? { text: 'Get started', style: 'secondary', fill: 'outline' } : null}
    >
        {args.children}
    </Jumbotron>
);
