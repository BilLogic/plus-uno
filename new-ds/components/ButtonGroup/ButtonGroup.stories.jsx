import React from 'react';
import ButtonGroup from './ButtonGroup';

export default {
    title: 'Components/ButtonGroup',
    component: ButtonGroup,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Button Group component for grouping related buttons together. Supports horizontal and vertical layouts with multiple sizes and styles. Uses element-level tokens.'
            }
        }
    },
    argTypes: {
        size: {
            control: 'select',
            options: ['small', 'default', 'large'],
            description: 'Button size'
        },
        style: {
            control: 'select',
            options: ['primary', 'secondary', 'tertiary', 'success', 'danger', 'warning'],
            description: 'Button style'
        },
        fill: {
            control: 'select',
            options: ['filled', 'outline', 'tonal', 'ghost'],
            description: 'Button fill'
        },
        alignment: {
            control: 'select',
            options: ['horizontal', 'vertical'],
            description: 'Layout alignment'
        }
    }
};

const Template = (args) => <ButtonGroup {...args} />;

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <section>
            <h5>Orientations</h5>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <ButtonGroup
                    alignment="horizontal"
                    buttons={[
                        { text: 'Left', onClick: () => console.log('Left clicked') },
                        { text: 'Right', onClick: () => console.log('Right clicked') }
                    ]}
                />
                <ButtonGroup
                    alignment="vertical"
                    buttons={[
                        { text: 'Top', onClick: () => console.log('Top clicked') },
                        { text: 'Bottom', onClick: () => console.log('Bottom clicked') }
                    ]}
                />
            </div>
        </section>

        <section>
            <h5>Sizes</h5>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <ButtonGroup
                    size="small"
                    buttons={[{ text: 'Small' }, { text: 'Group' }]}
                />
                <ButtonGroup
                    size="default"
                    buttons={[{ text: 'Default' }, { text: 'Group' }]}
                />
                <ButtonGroup
                    size="large"
                    buttons={[{ text: 'Large' }, { text: 'Group' }]}
                />
            </div>
        </section>

        <section>
            <h5>Styles</h5>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <ButtonGroup
                    style="primary"
                    buttons={[{ text: 'Primary' }, { text: 'Action' }]}
                />
                <ButtonGroup
                    style="secondary"
                    buttons={[{ text: 'Secondary' }, { text: 'Action' }]}
                />
                <ButtonGroup
                    style="success"
                    buttons={[{ text: 'Success' }, { text: 'Action' }]}
                />
                <ButtonGroup
                    style="danger"
                    buttons={[{ text: 'Danger' }, { text: 'Action' }]}
                />
            </div>
        </section>
    </div>
);

export const Interactive = Template.bind({});
Interactive.args = {
    buttons: [
        { text: 'Button 1' },
        { text: 'Button 2' },
        { text: 'Button 3' }
    ],
    size: 'default',
    style: 'primary',
    alignment: 'horizontal',
    fill: 'tonal'
};
