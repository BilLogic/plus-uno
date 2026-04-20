import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../../../components/Button/Button';
import Checkbox from '../../../../../forms/Checkbox';
import Textarea from '../../../../../forms/Textarea';
import { PageLayout } from '../../../../../specs/Universal/Pages';
import SideNavBar from '../../sections/SideNavBar/SideNavBar';
import { SessionRatingField } from '../../elements/SessionRating.stories';

const sessionRatingCommentsByValue = {
    1: 'Lots of room for improvement.',
    2: 'Not so well, adjustments are needed.',
    3: "Okay, could've gone better.",
    4: 'Good, with some room for improvement.',
    5: 'Excellent session!',
};

const improvementAreas = [
    { id: 'time-management', label: 'Time management.' },
    { id: 'technical-difficulties', label: 'Technical difficulties.' },
    { id: 'session-organization', label: 'Organization of session.' },
    { id: 'student-communication', label: 'Communication with students.' },
    { id: 'lead-tutor-communication', label: 'Communication with lead tutors.' },
    { id: 'team-admin-communication', label: 'Communication with tutoring team admin.' },
    { id: 'other', label: 'Other:' },
];

const technicalDifficulties = [
    { id: 'unmuting', label: 'Students having difficulties unmuting.' },
    { id: 'share-screen', label: 'Students unable or unwilling to share screen.' },
    { id: 'breakout-rooms', label: 'Issues with breakout rooms.' },
    { id: 'whiteboard-feature', label: 'Issues with whiteboard feature.' },
    { id: 'other', label: 'Other:' },
];

const SessionReflectionPart3 = ({
    students,
    activeTab: initialActiveTab,
    initialRating,
    initialSelectedAreas,
    initialSelectedTechDifficulties,
    initialSupportText,
}) => {
    const [activeTab, setActiveTab] = useState(initialActiveTab);
    const [sessionRating, setSessionRating] = useState(initialRating);
    const [selectedAreas, setSelectedAreas] = useState(initialSelectedAreas);
    const [selectedTechDifficulties, setSelectedTechDifficulties] = useState(initialSelectedTechDifficulties);
    const [otherAreaText, setOtherAreaText] = useState('');
    const [otherTechDifficultyText, setOtherTechDifficultyText] = useState('');
    const [supportText, setSupportText] = useState(initialSupportText);

    const handleAreaToggle = (areaId) => {
        setSelectedAreas((prev) =>
            prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId]
        );
    };

    const handleTechDifficultyToggle = (difficultyId) => {
        setSelectedTechDifficulties((prev) =>
            prev.includes(difficultyId) ? prev.filter((id) => id !== difficultyId) : [...prev, difficultyId]
        );
    };

    const isOtherAreaSelected = selectedAreas.includes('other');
    const isOtherTechDifficultySelected = selectedTechDifficulties.includes('other');
    const isNextDisabled = selectedAreas.length === 0 || selectedTechDifficulties.length === 0;

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <PageLayout
                topBarConfig={{
                    breadcrumbs: [
                        { text: 'Toolkit', href: '#' },
                        { text: 'Sessions', href: '#' },
                        { text: 'Reflection Form' },
                    ],
                    user: { name: 'John Doe', type: 'lead tutor' },
                }}
                sidebarConfig={{
                    user: 'tutor',
                    activeTab: 'sessions',
                }}
                id="session-reflection-part-3"
            >
                <div
                    style={{
                        display: 'flex',
                        gap: 'var(--size-surface-gap-md)',
                        width: '100%',
                        minHeight: '100%',
                    }}
                >
                    <SideNavBar
                        state="default"
                        students={students}
                        activeTab={activeTab}
                        onTabClick={setActiveTab}
                    />

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--size-section-gap-md)',
                            flex: '1 0 0',
                        }}
                    >
                        <h4 className="h4 m-0" style={{ color: 'var(--color-on-surface)' }}>
                            Session Evaluation: How did the session go?
                        </h4>

                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--size-element-gap-lg)',
                            }}
                        >
                            <p className="h6 m-0" style={{ color: 'var(--color-on-surface)' }}>
                                How was the overall session?
                                <span style={{ color: 'var(--color-danger)' }}> *</span>
                            </p>

                            <SessionRatingField
                                id="session-reflection-part-3-rating"
                                value={sessionRating}
                                onChange={setSessionRating}
                                commentsLabel={sessionRatingCommentsByValue[sessionRating] || null}
                            />
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--size-element-gap-md)',
                            }}
                        >
                            <p className="h6 m-0" style={{ color: 'var(--color-on-surface)' }}>
                                Select one or more areas that could improve session performance
                                <span style={{ color: 'var(--color-danger)' }}> *</span>
                            </p>

                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--size-element-gap-sm)',
                                }}
                            >
                                {improvementAreas.map((area) => {
                                    if (area.id === 'other') {
                                        return (
                                            <div
                                                key={area.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 'var(--size-element-gap-sm)',
                                                    width: '100%',
                                                }}
                                            >
                                                <Checkbox
                                                    id={`session-reflection-part-3-area-${area.id}`}
                                                    name={`session-reflection-part-3-area-${area.id}`}
                                                    label={null}
                                                    checked={isOtherAreaSelected}
                                                    onChange={() => handleAreaToggle(area.id)}
                                                    style={{ width: 'auto' }}
                                                />
                                                <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                                                    {area.label}
                                                </span>
                                                <div style={{ flex: '1 0 0', minWidth: 0 }}>
                                                    <Textarea
                                                        id="session-reflection-part-3-other-area-input"
                                                        name="session-reflection-part-3-other-area-input"
                                                        variant="short"
                                                        rows={1}
                                                        value={otherAreaText}
                                                        onChange={(e) => setOtherAreaText(e.target.value)}
                                                        placeholder="Please specify"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <Checkbox
                                            key={area.id}
                                            id={`session-reflection-part-3-area-${area.id}`}
                                            name={`session-reflection-part-3-area-${area.id}`}
                                            label={area.label}
                                            checked={selectedAreas.includes(area.id)}
                                            onChange={() => handleAreaToggle(area.id)}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--size-element-gap-md)',
                            }}
                        >
                            <p className="h6 m-0" style={{ color: 'var(--color-on-surface)' }}>
                                Which tech difficulties did you encounter?
                                <span style={{ color: 'var(--color-danger)' }}> *</span>
                            </p>

                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--size-element-gap-sm)',
                                }}
                            >
                                {technicalDifficulties.map((difficulty) => {
                                    if (difficulty.id === 'other') {
                                        return (
                                            <div
                                                key={difficulty.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 'var(--size-element-gap-sm)',
                                                    width: '100%',
                                                }}
                                            >
                                                <Checkbox
                                                    id={`session-reflection-part-3-difficulty-${difficulty.id}`}
                                                    name={`session-reflection-part-3-difficulty-${difficulty.id}`}
                                                    label={null}
                                                    checked={isOtherTechDifficultySelected}
                                                    onChange={() => handleTechDifficultyToggle(difficulty.id)}
                                                    style={{ width: 'auto' }}
                                                />
                                                <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                                                    {difficulty.label}
                                                </span>
                                                <div style={{ flex: '1 0 0', minWidth: 0 }}>
                                                    <Textarea
                                                        id="session-reflection-part-3-other-difficulty-input"
                                                        name="session-reflection-part-3-other-difficulty-input"
                                                        variant="short"
                                                        rows={1}
                                                        value={otherTechDifficultyText}
                                                        onChange={(e) => setOtherTechDifficultyText(e.target.value)}
                                                        placeholder="Please specify"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <Checkbox
                                            key={difficulty.id}
                                            id={`session-reflection-part-3-difficulty-${difficulty.id}`}
                                            name={`session-reflection-part-3-difficulty-${difficulty.id}`}
                                            label={difficulty.label}
                                            checked={selectedTechDifficulties.includes(difficulty.id)}
                                            onChange={() => handleTechDifficultyToggle(difficulty.id)}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--size-element-gap-sm)',
                            }}
                        >
                            <p className="h6 m-0" style={{ color: 'var(--color-on-surface)' }}>
                                How can we provide support to enhance performance in the selected areas?
                            </p>
                            <p className="body2-txt m-0" style={{ color: 'var(--color-on-surface)' }}>
                                Eg. I&apos;m experiencing technical difficulties in the breakout room so I need
                                instructions.
                            </p>
                            <Textarea
                                id="session-reflection-part-3-support-text"
                                name="session-reflection-part-3-support-text"
                                variant="long"
                                rows={2}
                                value={supportText}
                                onChange={(e) => setSupportText(e.target.value)}
                                placeholder="Placeholder"
                            />
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                gap: 'var(--size-element-gap-lg)',
                                alignItems: 'center',
                            }}
                        >
                            <Button text="Previous" style="primary" fill="tonal" size="medium" />
                            <Button
                                text="Next"
                                style="primary"
                                fill="tonal"
                                size="medium"
                                disabled={isNextDisabled}
                            />
                        </div>
                    </div>
                </div>
            </PageLayout>
        </div>
    );
};

SessionReflectionPart3.propTypes = {
    students: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            status: PropTypes.string,
        })
    ),
    activeTab: PropTypes.string,
    initialRating: PropTypes.number,
    initialSelectedAreas: PropTypes.arrayOf(PropTypes.string),
    initialSelectedTechDifficulties: PropTypes.arrayOf(PropTypes.string),
    initialSupportText: PropTypes.string,
};

SessionReflectionPart3.defaultProps = {
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
};

export default SessionReflectionPart3;
