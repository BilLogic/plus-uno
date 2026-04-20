import React from 'react';
import SuperCompPill from '@/components/SuperCompPill';
import { SMART_CONSTANTS } from '@/components/constants';

export default {
    title: 'Components/SuperCompPill',
    component: SuperCompPill,
    tags: ['!dev'],
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        competencyArea: {
            control: 'select',
            options: [
                SMART_CONSTANTS.CA_SE,
                SMART_CONSTANTS.CA_MC,
                SMART_CONSTANTS.CA_ADV,
                SMART_CONSTANTS.CA_RELN,
                SMART_CONSTANTS.CA_TT,
            ],
            description: 'Competency Area',
            table: { category: 'Content' }
        },
        abbreviate: { control: 'boolean', description: 'Abbreviate text', table: { category: 'Design' } },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        }
    },
};

const row = { display: 'flex', gap: '8px', flexWrap: 'wrap' };

function SuperCompPillFullDemos() {
    return (
        <div style={row}>
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_SE} />
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_MC} />
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_ADV} />
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_RELN} />
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_TT} />
        </div>
    );
}

function SuperCompPillAbbreviatedDemos() {
    return (
        <div style={row}>
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_SE} abbreviate />
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_MC} abbreviate />
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_ADV} abbreviate />
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_RELN} abbreviate />
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_TT} abbreviate />
        </div>
    );
}

export const FullLabels = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <SuperCompPillFullDemos />
    </div>
);

export const Abbreviated = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <SuperCompPillAbbreviatedDemos />
    </div>
);

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <SuperCompPillFullDemos />
        <SuperCompPillAbbreviatedDemos />
    </div>
);

export const Interactive = {
    args: {
        competencyArea: SMART_CONSTANTS.CA_SE,
        abbreviate: false,
    },
};
