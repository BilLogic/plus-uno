import React from 'react';
import Rating from '@/forms/Rating';
import TextareaVer2 from '@/forms/TextareaVer2';

const RATING_LABELS = {
    0: '',
    1: 'Very challenging session',
    2: 'Below expectations',
    3: 'Met expectations',
    4: 'Good session',
    5: 'Excellent session!',
};

const SessionOverview = ({ data, onChange }) => {
    return (
        <div className="reflection-form__section-card">
            <h5 className="h5 reflection-form__section-title">
                <i className="fa-solid fa-star" style={{ marginRight: '8px', color: 'var(--color-primary)' }} />
                Session Overview
            </h5>
            <p className="body2-txt reflection-form__section-description">
                Reflect on the session as a whole. This is asked once — no need to repeat per student.
            </p>

            <div className="reflection-form__field-group">
                <Rating
                    name="session-rating"
                    label="How would you rate this session overall? *"
                    value={data.rating}
                    variant="comments"
                    showCommentsLabel={!!data.rating}
                    commentsLabel={RATING_LABELS[data.rating] || ''}
                    required
                    onChange={(val) => onChange({ rating: val })}
                />
            </div>

            <div className="reflection-form__field-group">
                <TextareaVer2
                    name="went-well"
                    label="What went well? *"
                    placeholder="Describe what worked in this session — teaching moments, student breakthroughs, effective strategies..."
                    variant="long"
                    rows={4}
                    value={data.wentWell}
                    onChange={(e) => onChange({ wentWell: e.target.value })}
                />
            </div>

            <div className="reflection-form__field-group">
                <TextareaVer2
                    name="challenges"
                    label="What was challenging?"
                    placeholder="Any obstacles, student disengagement, content difficulty, technical issues..."
                    variant="long"
                    rows={4}
                    value={data.challenges}
                    onChange={(e) => onChange({ challenges: e.target.value })}
                />
            </div>
        </div>
    );
};

export default SessionOverview;
