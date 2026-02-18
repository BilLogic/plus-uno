import React, { useState } from 'react';
import Button from '../../../../../components/Button/Button';
import StudentReflectionPart1 from './Part1';
import StudentReflectionPart2 from './Part2';
import StudentReflectionPart3 from './Part3';

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

export default {
    title: 'Specs/Toolkit/Post-Session/Pages/Student Reflection',
    component: StudentReflectionPart1,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

export const Part1 = {
    render: (args) => <BreakpointPreview Component={StudentReflectionPart1} args={args} />,
    args: {
        studentName: 'Kiera Wintervale',
        students: [
            { name: 'Kiera Wintervale', status: 'incomplete' },
            { name: 'Baxter Ellington', status: 'incomplete' },
            { name: 'Milo Thorne', status: 'incomplete' },
        ],
        activeTab: 'student-0',
    },
};

export const Part2 = {
    render: (args) => <BreakpointPreview Component={StudentReflectionPart2} args={args} />,
    args: {
        studentName: 'Kiera Wintervale',
        students: [
            { name: 'Kiera Wintervale', status: 'incomplete' },
            { name: 'Baxter Ellington', status: 'incomplete' },
            { name: 'Milo Thorne', status: 'incomplete' },
        ],
        activeTab: 'student-0',
        initialRating: 4,
    },
};

export const Part3 = {
    render: (args) => <BreakpointPreview Component={StudentReflectionPart3} args={args} />,
    args: {
        studentName: 'Milo Thorne',
        students: [
            { name: 'Kiera Wintervale', status: 'complete' },
            { name: 'Baxter Ellington', status: 'complete' },
            { name: 'Milo Thorne', status: 'incomplete' },
        ],
        activeTab: 'student-2',
        initialRating: 3,
    },
};
