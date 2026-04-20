import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../../../components/Button/Button';
import SessionReflectionPart1 from './Part1';
import SessionReflectionPart2 from './Part2';
import SessionReflectionPart3 from './Part3';
import SessionReflectionPart4 from './Part4';

const breakpointWidths = {
    md: 768,
    lg: 1024,
    xl: 1440,
};

const BreakpointPreview = ({ Component, args }) => {
    const [breakpoint, setBreakpoint] = useState('xl');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--size-element-gap-md)',
                    padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
                    backgroundColor: 'var(--color-surface-container-low)',
                    borderRadius: 'var(--size-card-radius-sm)',
                    flexWrap: 'wrap',
                }}
            >
                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>
                    Breakpoint:
                </span>
                {Object.entries(breakpointWidths).map(([bp, width]) => (
                    <Button
                        key={bp}
                        text={`${bp.toUpperCase()} (${width}px)`}
                        size="small"
                        style="primary"
                        fill={breakpoint === bp ? 'filled' : 'outline'}
                        onClick={() => setBreakpoint(bp)}
                    />
                ))}
                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', marginLeft: 'auto' }}>
                    Current: <strong>{breakpointWidths[breakpoint]}px</strong>
                </span>
            </div>

            <div
                style={{
                    width: `${breakpointWidths[breakpoint]}px`,
                    height: '1024px',
                    margin: '0 auto',
                    border: '2px dashed var(--color-outline-variant)',
                    borderRadius: 'var(--size-card-radius-sm)',
                    overflow: 'hidden',
                    transition: 'width 0.3s ease',
                }}
            >
                <Component {...args} />
            </div>
        </div>
    );
};

BreakpointPreview.propTypes = {
    Component: PropTypes.elementType.isRequired,
    args: PropTypes.object,
};

BreakpointPreview.defaultProps = {
    args: {},
};

export default {
    title: 'Specs/Toolkit/Post-Session/Pages/Session Reflection',
    component: SessionReflectionPart1,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

export const Part1 = {
    render: (args) => <BreakpointPreview Component={SessionReflectionPart1} args={args} />,
    args: {
        students: [
            { name: 'Kiera Wintervale', status: 'complete' },
            { name: 'Baxter Ellington', status: 'complete' },
            { name: 'Milo Thorne', status: 'incomplete' },
        ],
        activeTab: 'session-reflection',
        initialRating: 0,
    },
};

export const Part2 = {
    render: (args) => <BreakpointPreview Component={SessionReflectionPart2} args={args} />,
    args: {
        students: [
            { name: 'Kiera Wintervale', status: 'complete' },
            { name: 'Baxter Ellington', status: 'complete' },
            { name: 'Milo Thorne', status: 'incomplete' },
        ],
        activeTab: 'session-reflection',
        initialRating: 3,
        initialSelectedAreas: ['technical-difficulties'],
        initialSupportText: '',
    },
};

export const Part3 = {
    render: (args) => <BreakpointPreview Component={SessionReflectionPart3} args={args} />,
    args: {
        students: [
            { name: 'Kiera Wintervale', status: 'complete' },
            { name: 'Baxter Ellington', status: 'complete' },
            { name: 'Milo Thorne', status: 'incomplete' },
        ],
        activeTab: 'session-reflection',
        initialRating: 3,
        initialSelectedAreas: ['technical-difficulties'],
        initialSelectedTechDifficulties: ['whiteboard-feature'],
        initialSupportText: '',
    },
};

export const Part4 = {
    render: (args) => <BreakpointPreview Component={SessionReflectionPart4} args={args} />,
    args: {
        students: [
            { name: 'Kiera Wintervale', status: 'complete' },
            { name: 'Baxter Ellington', status: 'complete' },
            { name: 'Milo Thorne', status: 'incomplete' },
        ],
        activeTab: 'session-reflection',
        initialRating: 5,
        initialSelectedAreas: ['time-management'],
        initialSelectedTechDifficulties: ['breakout-rooms'],
        initialSupportText: '',
    },
};
