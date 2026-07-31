import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import FormRating from '@/specs/Toolkit/Post-Session/Elements/FormRating/FormRating';
import FreeResponseQuestion from '@/specs/Toolkit/Post-Session/Sections/FreeResponseQuestion/FreeResponseQuestion';
import NavigationButtons from '@/specs/Toolkit/Post-Session/Elements/NavigationButtons/NavigationButtons';
import LastUpdated from '@/specs/Toolkit/Post-Session/Elements/LastUpdated/LastUpdated';
import { PRIVACY_WARNING, isReflectionDraftDirty } from '@/specs/Toolkit/Post-Session/reflectionCopy';

/**
 * Form Feedback section body (Form Design §5).
 *
 * @param {object} props
 * @param {object} [props.initialData]
 * @param {(data: object) => void} [props.onDraftChange] - Keeps parent/Flow in sync for SideNav Submit
 * @param {(data: object, dirty: boolean) => void} [props.onCancel]
 * @param {(data: object) => void} [props.onSaveAndExit]
 * @param {() => void} [props.onPrevious]
 * @param {(data: object) => void} [props.onSubmit]
 * @param {string} [props.lastUpdated]
 */
const FormFeedbackForm = ({
    initialData = {},
    onDraftChange,
    onCancel,
    onSaveAndExit,
    onPrevious,
    onSubmit,
    lastUpdated,
}) => {
    const [rating, setRating] = useState(initialData.rating || 0);
    const [experience, setExperience] = useState(initialData.experience || '');
    const [comments, setComments] = useState(initialData.comments || '');

    const cancelBaseline = useMemo(() => ({
        rating: initialData.rating || 0,
        experience: initialData.experience || '',
        comments: initialData.comments || '',
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount baseline for dirty Cancel
    }), []);

    /**
     * @returns {{ rating: number, experience: string, comments: string }}
     */
    const snapshot = () => ({ rating, experience, comments });

    useEffect(() => {
        onDraftChange?.(snapshot());
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sync draft fields only
    }, [rating, experience, comments]);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-section-gap-md)',
                flex: '1 0 0',
                minWidth: 0,
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-xs)' }}>
                <h4 className="h4 m-0" style={{ color: 'var(--color-on-surface)' }}>Form Feedback</h4>
                <LastUpdated text={typeof lastUpdated === 'string' ? lastUpdated : undefined} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                    <p className="body1-txt font-weight-semibold m-0" style={{ color: 'var(--color-on-surface)' }}>
                        On a scale from 1–5, how intuitive did you find the reflection form?
                        <span style={{ color: 'var(--color-danger)' }}> *</span>
                    </p>
                    <FormRating
                        id="form-feedback-rating"
                        value={rating}
                        onChange={setRating}
                    />
                </div>

                <FreeResponseQuestion
                    id="form-feedback-experience"
                    label="How was your reflection experience?"
                    caption="Were there any questions within the form that you found unclear or unnecessary?"
                    value={experience}
                    onChange={(event) => setExperience(event.target.value)}
                />

                <FreeResponseQuestion
                    id="form-feedback-comments"
                    label="Any additional comments or concerns?"
                    warning={PRIVACY_WARNING}
                    value={comments}
                    onChange={(event) => setComments(event.target.value)}
                />
            </div>

            <NavigationButtons
                showPrevious
                showSubmit
                canSave={rating >= 1}
                canNext={rating >= 1}
                onPrevious={onPrevious}
                onCancel={() => {
                    const data = snapshot();
                    onCancel?.(data, isReflectionDraftDirty(data, cancelBaseline));
                }}
                onSaveAndExit={() => onSaveAndExit?.(snapshot())}
                onSubmit={() => onSubmit?.(snapshot())}
            />
        </div>
    );
};

FormFeedbackForm.propTypes = {
    initialData: PropTypes.object,
    onDraftChange: PropTypes.func,
    onCancel: PropTypes.func,
    onSaveAndExit: PropTypes.func,
    onPrevious: PropTypes.func,
    onSubmit: PropTypes.func,
    lastUpdated: PropTypes.string,
};

export default FormFeedbackForm;
