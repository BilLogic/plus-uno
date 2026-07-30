import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/actions/Button';

/**
 * Form footer navigation for reflection steps
 * (Figma: Navigation Button + Button Group).
 *
 * @param {object} props
 * @param {boolean} [props.canSave=false] - Enables Save & Exit
 * @param {boolean} [props.canNext=false] - Enables Next / Submit
 * @param {boolean} [props.showPrevious=false]
 * @param {boolean} [props.showSubmit=false] - Swap Next for Submit reflection
 * @param {() => void} [props.onCancel]
 * @param {() => void} [props.onPrevious]
 * @param {() => void} [props.onSaveAndExit]
 * @param {() => void} [props.onNext]
 * @param {() => void} [props.onSubmit]
 */
const NavigationButtons = ({
    canSave = false,
    canNext = false,
    showPrevious = false,
    showSubmit = false,
    onCancel,
    onPrevious,
    onSaveAndExit,
    onNext,
    onSubmit,
}) => (
    <div style={{ display: 'flex', gap: 'var(--size-element-gap-sm)', flexWrap: 'wrap' }}>
        {showPrevious && (
            <Button text="Previous" style="default" fill="tonal" onClick={onPrevious} />
        )}
        <Button text="Cancel" style="default" fill="tonal" onClick={onCancel} />
        <Button
            text="Save & Exit"
            style="primary"
            fill="tonal"
            disabled={!canSave}
            onClick={onSaveAndExit}
        />
        {showSubmit ? (
            <Button
                text="Submit"
                style="primary"
                fill="filled"
                disabled={!canNext}
                onClick={onSubmit}
            />
        ) : (
            <Button
                text="Next"
                style="primary"
                fill="filled"
                disabled={!canNext}
                onClick={onNext}
            />
        )}
    </div>
);

NavigationButtons.propTypes = {
    canSave: PropTypes.bool,
    canNext: PropTypes.bool,
    showPrevious: PropTypes.bool,
    showSubmit: PropTypes.bool,
    onCancel: PropTypes.func,
    onPrevious: PropTypes.func,
    onSaveAndExit: PropTypes.func,
    onNext: PropTypes.func,
    onSubmit: PropTypes.func,
};

export default NavigationButtons;
