import React from 'react';
import BadgeClaimedPill from './BadgeClaimedPill';

export default {
    title: 'Specs/Admin/Tutor Admin/Elements/BadgeClaimedPill',
    component: BadgeClaimedPill,
    parameters: {
        docs: {
            description: {
                component: `
**BadgeClaimedPill** is a status indicator component used in Tutor Admin tables to show whether a tutor has claimed their badge.

**Figma Node:** 3163:151304

**States:**
- **Yes**: Badge claimed (Green)
- **No**: Badge available but not claimed (Red)
- **N/A**: Tutor ineligible (Grey)
`
            }
        }
    },
    argTypes: {
        state: {
            control: { type: 'select' },
            options: ['yes', 'no', 'na', true, false],
            description: 'State of the badge claim based on data'
        }
    }
};

const Template = (args) => <BadgeClaimedPill {...args} />;

export const Default = Template.bind({});
Default.args = {
    state: 'yes'
};

export const Yes = Template.bind({});
Yes.args = {
    state: 'Yes'
};

export const No = Template.bind({});
No.args = {
    state: 'No'
};

export const NotApplicable = Template.bind({});
NotApplicable.args = {
    state: 'n/a'
};

export const FromBooleanTrue = Template.bind({});
FromBooleanTrue.args = {
    state: true
};

export const FromBooleanFalse = Template.bind({});
FromBooleanFalse.args = {
    state: false
};
