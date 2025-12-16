import React, { useState } from 'react';
import Collapse from './Collapse';
import Card from '@/components/Card/Card';
import Button from '@/components/Button/Button';
import Divider from '@/components/Divider/Divider';

export default {
    title: 'Components/Collapse',
    component: Collapse,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Collapse component for showing and hiding content. Supports controlled and uncontrolled modes, custom triggers, and icons.'
            }
        }
    }
};

const Template = (args) => <Collapse {...args} />;

export const Overview = () => {
    // Controlled state for "Multiple targets" example
    const [open1, setOpen1] = useState(false);
    const [open2, setOpen2] = useState(false);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '600px' }}>
            {/* Default */}
            <section>
                <h5>Default (Uncontrolled)</h5>
                <Collapse
                    id="default-example"
                    trigger="Toggle Content"
                    triggerClass="btn btn-primary"
                    defaultOpen={false}
                >
                    <Card
                        body="Some placeholder content for the collapse component. This panel is hidden by default but revealed when the user activates the relevant trigger."
                        className="mt-2"
                        showBorder
                    />
                </Collapse>
            </section>

            {/* Multiple Targets (Controlled) */}
            <section>
                <h5>Controlled / Multiple Targets</h5>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <Button onClick={() => setOpen1(!open1)} text="Toggle First" />
                    <Button onClick={() => setOpen2(!open2)} text="Toggle Second" />
                    <Button onClick={() => { setOpen1(!open1); setOpen2(!open2); }} text="Toggle Both" />
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                        <div className={`collapse ${open1 ? 'show' : ''}`}>
                            <Card
                                body="First content block."
                                showBorder
                            />
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div className={`collapse ${open2 ? 'show' : ''}`}>
                            <Card
                                body="Second content block."
                                showBorder
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Accordion Example (Manual Implementation using Collapse) */}
            <section>
                <h5>Accordion Pattern</h5>
                <div style={{ border: '1px solid var(--color-outline-variant)', borderRadius: '4px' }}>
                    <Collapse
                        trigger="Accordion Item #1"
                        triggerClass="d-flex align-items-center w-100 p-3 bg-light border-0 text-primary text-left"
                        className="border-bottom"
                        icon="chevron-down"
                        iconPosition="right"
                    >
                        <div className="p-3">
                            Some quick example text to build on the card title and make up the bulk of the card's content.
                        </div>
                    </Collapse>
                    <Collapse
                        trigger="Accordion Item #2"
                        triggerClass="d-flex align-items-center w-100 p-3 bg-light border-0 text-primary text-left"
                        icon="chevron-down"
                        iconPosition="right"
                    >
                        <div className="p-3">
                            Some quick example text to build on the card title and make up the bulk of the card's content.
                        </div>
                    </Collapse>
                </div>
            </section>
        </div>
    );
};


export const Interactive = Template.bind({});
Interactive.args = {
    trigger: 'Toggle Collapse',
    children: <Card body="Collapsible content goes here." showBorder />,
    triggerClass: 'btn btn-primary',
    defaultOpen: false,
    icon: 'caret-down'
};
