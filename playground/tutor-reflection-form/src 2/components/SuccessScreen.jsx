import React from 'react';
import Button from '@/components/Button';

const SuccessScreen = () => {
    return (
        <div className="reflection-form__section-card">
            <div className="success-screen">
                <div className="success-screen__icon">
                    <i className="fa-solid fa-check" />
                </div>

                <h3 className="h3" style={{ color: 'var(--color-on-surface)' }}>
                    Reflection Submitted!
                </h3>

                <p className="body1-txt" style={{ color: 'var(--color-on-surface-variant)', maxWidth: '440px' }}>
                    Thank you for completing your post-session reflection. Your insights help improve
                    the tutoring experience for students and fellow tutors.
                </p>

                <div style={{ display: 'flex', gap: 'var(--size-element-gap-sm, 8px)', marginTop: 'var(--size-element-gap-md, 16px)' }}>
                    <Button
                        text="Return to Dashboard"
                        style="primary"
                        fill="filled"
                        size="medium"
                        leadingVisual="house"
                        onClick={() => window.location.reload()}
                    />
                    <Button
                        text="View Summary"
                        style="default"
                        fill="outline"
                        size="medium"
                        leadingVisual="file-lines"
                    />
                </div>
            </div>
        </div>
    );
};

export default SuccessScreen;
