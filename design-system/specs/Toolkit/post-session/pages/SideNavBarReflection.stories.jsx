import React, { useState } from 'react';
import Button from '../../../../../packages/plus-ds/src/components/Button';

export default {
    title: 'Specs/Toolkit/Post-Session/Pages/Side Nav Bar Reflection',
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: `
# Side Nav Bar — Reflection

Vertical side navigation bar used in the post-session reflection flow. Contains navigation tabs for different reflection sections and a list of students.

## States
- **Default**: Expanded, "Student Reflection" section selected, student list visible with status icons
- **In Progress**: Similar to default but student has a spinner icon indicating work in progress
- **Pre-student Add**: "Session Information" tab is selected instead of Student Reflection
- **Collapsed**: Minimized to a single hamburger menu button

## Structure
1. **Session Information** tab
2. **Student Reflection** group header (selected state)
   - Student name tabs (with optional trailing icons: check, spinner)
   - "Add Student" tab with plus icon
3. **Session Reflection** tab
4. **Self Reflection** tab
5. **Form Feedback** tab
6. **Submit** button (disabled)

## Design Tokens
- **Container bg**: \`--color-surface-container\`
- **Container padding**: \`--size-section-pad-x-sm\` / \`--size-section-pad-y-sm\`
- **Container gap**: \`--size-section-gap-sm\`
- **Container radius**: \`--size-border-radius-4-5\` (16px)
- **Tab padding**: 10px vertical, 16px horizontal
- **Selected tab bg**: \`--color-primary-state-16\`
- **Selected tab radius**: \`--size-legacy-radius-3\` (6px)
- **Selected tab text**: \`--color-primary-text\`, body2-txt semibold
- **Enabled tab text**: \`--color-on-surface\`, body2-txt regular
- **Disabled tab text**: \`--color-on-surface\`, body2-txt regular, opacity 0.38
- **Icon color**: \`--color-on-surface-variant\`, 12px
- **Typography**: body2-txt (14px, Merriweather Sans)
                `
            }
        }
    },
};

// ─── Sub-components ──────────────────────────────────────────────

/**
 * SideBarTab
 * A single navigation tab item in the sidebar
 *
 * States:
 * - enabled: Default clickable tab
 * - selected: Currently active tab with primary highlight
 * - disabled: Greyed out, non-interactive
 * - hover: Hover state (not shown in static overview)
 *
 * Tokens:
 * - Padding: 10px 16px (spacing/small/space-150, spacing/medium/space-300)
 * - Selected bg: --color-primary-state-16
 * - Selected radius: --size-legacy-radius-3 (6px)
 * - Selected text: --color-primary-text, body2-txt font-weight-semibold
 * - Enabled text: --color-on-surface, body2-txt
 * - Disabled text: --color-on-surface, body2-txt, opacity 0.38
 * - Icon: 12px, --color-on-surface-variant
 */
const SideBarTab = ({
    text = 'Tab Title',
    state = 'enabled',
    trailingIcon = null,
    onClick,
}) => {
    const isSelected = state === 'selected';
    const isDisabled = state === 'disabled';

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 16px',
                width: '100%',
                cursor: isDisabled ? 'default' : 'pointer',
                borderRadius: isSelected ? 'var(--size-legacy-radius-3, 6px)' : undefined,
                backgroundColor: isSelected ? 'var(--color-primary-state-16)' : undefined,
            }}
            onClick={!isDisabled ? onClick : undefined}
        >
            <span
                className={isSelected ? 'body2-txt font-weight-semibold' : 'body2-txt'}
                style={{
                    flex: '1 0 0',
                    color: isSelected
                        ? 'var(--color-primary-text)'
                        : 'var(--color-on-surface)',
                    opacity: isDisabled ? 0.38 : 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {text}
            </span>
            {trailingIcon && (
                <span
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: 'var(--color-on-surface-variant)',
                    }}
                >
                    {trailingIcon}
                </span>
            )}
        </div>
    );
};

/**
 * SideNavBar
 * The full side navigation bar component
 *
 * Props:
 * - state: 'default' | 'in-progress' | 'pre-student-add' | 'collapsed'
 * - students: array of { name, trailingIcon }
 * - onTabClick: callback for tab clicks
 *
 * Tokens:
 * - Container bg: --color-surface-container
 * - Container padding: --size-section-pad-x-sm / --size-section-pad-y-sm
 * - Container gap: --size-section-gap-sm
 * - Container radius: 16px (--size-border-radius-4-5)
 * - Min width: 162px, Max width: ~219px
 */
const SideNavBar = ({
    state = 'default',
    students = [],
    onTabClick,
}) => {
    const isCollapsed = state === 'collapsed';
    const isPreStudentAdd = state === 'pre-student-add';
    const isDefault = state === 'default';
    const isInProgress = state === 'in-progress';

    if (isCollapsed) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '8px 0',
                    borderRadius: '16px',
                }}
            >
                <Button
                    style="primary"
                    fill="tonal"
                    size="medium"
                    leadingVisual="bars"
                />
            </div>
        );
    }

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 'var(--size-section-gap-sm, 8px)',
                padding: 'var(--size-section-pad-y-sm, 16px) var(--size-section-pad-x-sm, 16px)',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: '16px',
                minWidth: '162px',
                maxWidth: '219px',
                width: '219px',
            }}
        >
            {/* Tabs group */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-spacing-between-components-spacer-2, 8px)',
                    alignItems: 'flex-start',
                    width: '100%',
                }}
            >
                {/* Session Information */}
                <SideBarTab
                    text="Session Information"
                    state={isPreStudentAdd ? 'selected' : 'enabled'}
                    onClick={() => onTabClick?.('session-information')}
                />

                {/* Student Reflection Group */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        width: '100%',
                    }}
                >
                    {/* Student Reflection header */}
                    <SideBarTab
                        text="Student Reflection"
                        state={(isDefault || isInProgress) ? 'selected' : 'enabled'}
                        onClick={() => onTabClick?.('student-reflection')}
                    />

                    {/* Student list */}
                    {students.map((student, index) => (
                        <SideBarTab
                            key={index}
                            text={student.name}
                            state="enabled"
                            trailingIcon={student.trailingIcon || null}
                            onClick={() => onTabClick?.(`student-${index}`)}
                        />
                    ))}

                    {/* Add Student */}
                    <SideBarTab
                        text="Add Student"
                        state="enabled"
                        trailingIcon={
                            <i
                                className="fa-solid fa-plus"
                                style={{ color: 'var(--color-primary-text)' }}
                            />
                        }
                        onClick={() => onTabClick?.('add-student')}
                    />
                </div>

                {/* Other tabs */}
                <SideBarTab
                    text="Session Reflection"
                    state="enabled"
                    onClick={() => onTabClick?.('session-reflection')}
                />
                <SideBarTab
                    text="Self Reflection"
                    state="enabled"
                    onClick={() => onTabClick?.('self-reflection')}
                />
                <SideBarTab
                    text="Form Feedback"
                    state="enabled"
                    onClick={() => onTabClick?.('form-feedback')}
                />
            </div>

            {/* Submit Button — disabled */}
            <Button
                text="Submit"
                style="default"
                fill="filled"
                size="medium"
                disabled={true}
                block={true}
            />
        </div>
    );
};

// ─── Icon helpers ────────────────────────────────────────────────

const checkIcon = (
    <i className="fa-solid fa-circle-check" style={{ color: 'var(--color-on-surface-variant)' }} />
);

const spinnerIcon = (
    <i className="fa-solid fa-spinner" style={{ color: 'var(--color-on-surface-variant)' }} />
);

// ─── Sample Data ─────────────────────────────────────────────────

const defaultStudents = [
    { name: 'Kiera Wintervale', trailingIcon: checkIcon },
    { name: 'Baxter Ellington' },
    { name: 'Milo Thorne' },
];

const inProgressStudents = [
    { name: 'Kiera Wintervale', trailingIcon: spinnerIcon },
    { name: 'Baxter Ellington' },
    { name: 'Milo Thorne' },
];

// ─── Stories ─────────────────────────────────────────────────────

/**
 * Overview
 * Shows all four states of the Side Nav Bar side by side:
 * Default, In Progress, Pre-student Add, and Collapsed
 */
export const Overview = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)',
            padding: 'var(--size-section-gap-lg)',
            backgroundColor: 'var(--color-surface-variant)',
            minHeight: '100vh',
        }}
    >
        <div>
            <h5 className="text-muted mb-2">Side Nav Bar — Reflection</h5>
            <p className="text-muted small mb-0">
                Vertical side navigation for the post-session reflection flow. Shows all four states.
            </p>
        </div>

        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--size-section-gap-lg)',
                alignItems: 'flex-start',
            }}
        >
            {/* Default State */}
            <div className="d-flex flex-column" style={{ gap: 'var(--size-element-gap-md)' }}>
                <span className="small text-muted">Default</span>
                <SideNavBar
                    state="default"
                    students={defaultStudents}
                />
            </div>

            {/* In Progress State */}
            <div className="d-flex flex-column" style={{ gap: 'var(--size-element-gap-md)' }}>
                <span className="small text-muted">In Progress</span>
                <SideNavBar
                    state="in-progress"
                    students={inProgressStudents}
                />
            </div>

            {/* Pre-student Add State */}
            <div className="d-flex flex-column" style={{ gap: 'var(--size-element-gap-md)' }}>
                <span className="small text-muted">Pre-student Add</span>
                <SideNavBar
                    state="pre-student-add"
                    students={defaultStudents}
                />
            </div>

            {/* Collapsed State */}
            <div className="d-flex flex-column" style={{ gap: 'var(--size-element-gap-md)' }}>
                <span className="small text-muted">Collapsed</span>
                <SideNavBar state="collapsed" />
            </div>
        </div>

        {/* Individual Tab States */}
        <div className="d-flex flex-column" style={{ gap: 'var(--size-section-gap-md)' }}>
            <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>
                Tab States
            </h6>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-element-gap-sm)',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '16px',
                    padding: '16px',
                    width: '219px',
                }}
            >
                <div className="d-flex flex-column gap-1">
                    <span className="small text-muted">Selected</span>
                    <SideBarTab text="Student Reflection" state="selected" />
                </div>
                <div className="d-flex flex-column gap-1">
                    <span className="small text-muted">Enabled</span>
                    <SideBarTab text="Session Reflection" state="enabled" />
                </div>
                <div className="d-flex flex-column gap-1">
                    <span className="small text-muted">Enabled with trailing icon</span>
                    <SideBarTab
                        text="Kiera Wintervale"
                        state="enabled"
                        trailingIcon={checkIcon}
                    />
                </div>
                <div className="d-flex flex-column gap-1">
                    <span className="small text-muted">Disabled</span>
                    <SideBarTab text="Form Feedback" state="disabled" />
                </div>
            </div>
        </div>
    </div>
);

/**
 * Interactive
 * Fully interactive side nav bar with clickable tabs and state switching
 */
export const Interactive = () => {
    const [navState, setNavState] = useState('default');
    const [activeTab, setActiveTab] = useState('student-reflection');
    const [students, setStudents] = useState([
        { name: 'Kiera Wintervale', trailingIcon: checkIcon },
        { name: 'Baxter Ellington' },
        { name: 'Milo Thorne' },
    ]);

    const handleTabClick = (tabId) => {
        setActiveTab(tabId);
    };

    const handleAddStudent = () => {
        const names = ['Aria Moonstone', 'Felix Brightwood', 'Luna Starcrest', 'Orion Duskfall'];
        const nextName = names[students.length % names.length];
        setStudents(prev => [...prev, { name: nextName }]);
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-section-gap-lg)',
                padding: 'var(--size-section-gap-lg)',
                backgroundColor: 'var(--color-surface-variant)',
                minHeight: '100vh',
            }}
        >
            <div style={{ marginBottom: 'var(--size-section-gap-md)' }}>
                <h5 className="text-muted mb-2">Interactive Side Nav Bar</h5>
                <p className="text-muted small mb-0">
                    Click tabs to navigate. Use the controls below to switch between nav bar states.
                </p>
            </div>

            {/* State Controls */}
            <div
                className="d-flex flex-wrap align-items-center"
                style={{ gap: 'var(--size-element-gap-sm)' }}
            >
                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>
                    Nav State:
                </span>
                <Button
                    text="Default"
                    size="small"
                    style="primary"
                    fill={navState === 'default' ? 'filled' : 'outline'}
                    onClick={() => setNavState('default')}
                />
                <Button
                    text="In Progress"
                    size="small"
                    style="primary"
                    fill={navState === 'in-progress' ? 'filled' : 'outline'}
                    onClick={() => setNavState('in-progress')}
                />
                <Button
                    text="Pre-student Add"
                    size="small"
                    style="primary"
                    fill={navState === 'pre-student-add' ? 'filled' : 'outline'}
                    onClick={() => setNavState('pre-student-add')}
                />
                <Button
                    text="Collapsed"
                    size="small"
                    style="primary"
                    fill={navState === 'collapsed' ? 'filled' : 'outline'}
                    onClick={() => setNavState('collapsed')}
                />
            </div>

            {/* Nav Bar */}
            <div className="d-flex" style={{ gap: 'var(--size-section-gap-lg)' }}>
                <SideNavBar
                    state={navState}
                    students={navState === 'in-progress' ? inProgressStudents : students}
                    onTabClick={(tabId) => {
                        if (tabId === 'add-student') {
                            handleAddStudent();
                        } else {
                            handleTabClick(tabId);
                        }
                    }}
                />

                {/* Content area placeholder */}
                <div
                    style={{
                        flex: 1,
                        backgroundColor: 'var(--color-surface-container-lowest)',
                        borderRadius: '16px',
                        padding: 'var(--size-section-pad-y-sm) var(--size-section-pad-x-sm)',
                        minHeight: '300px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        {navState === 'collapsed'
                            ? 'Nav is collapsed — click the hamburger menu to expand'
                            : `Active tab: ${activeTab}`
                        }
                    </span>
                </div>
            </div>
        </div>
    );
};
