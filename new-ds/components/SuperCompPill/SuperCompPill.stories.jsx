import React from 'react';
import SuperCompPill from '@/components/SuperCompPill';
import { SMART_CONSTANTS } from '@/components/constants';

export default {
    title: 'Components/SuperCompPill',
    component: SuperCompPill,
    tags: ['autodocs'],
    argTypes: {
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
        },
        abbreviate: { control: 'boolean', description: 'Abbreviate text' },
    },
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_SE} />
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_MC} />
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_ADV} />
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_RELN} />
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_TT} />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_SE} abbreviate />
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_MC} abbreviate />
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_ADV} abbreviate />
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_RELN} abbreviate />
            <SuperCompPill competencyArea={SMART_CONSTANTS.CA_TT} abbreviate />
        </div>
    </div>
);

export const Interactive = {
    args: {
        competencyArea: SMART_CONSTANTS.CA_SE,
        abbreviate: false,
    },
};
