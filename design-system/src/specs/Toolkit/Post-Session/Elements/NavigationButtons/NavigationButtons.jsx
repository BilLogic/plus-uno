import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { Button } from '@/components';
import { useReflectionChrome } from '@/specs/Toolkit/Post-Session/reflectionChrome';

/**
 * A step's actions: Previous, Cancel, Save & Exit and Next (or Submit).
 *
 * On a reflection page they go into the page footer, end-aligned with the
 * primary last, and the step's Cancel is what Back and Close in the Page header row run.
 * On their own they sit in a row.
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
}) => {
    const { footerEl, registerCancel } = useReflectionChrome();

    useEffect(() => {
        registerCancel(onCancel);
        return () => registerCancel(null);
    }, [registerCancel, onCancel]);

    const actions = (
        <>
            {showPrevious && (
                <Button text="Previous" onClick={onPrevious} />
            )}
            <Button text="Cancel" onClick={onCancel} />
            <Button
                text="Save & Exit"
                isDisabled={!canSave}
                onClick={onSaveAndExit}
            />
            {showSubmit ? (
                <Button
                    text="Submit"
                    appearance="primary"
                    isDisabled={!canNext}
                    onClick={onSubmit}
                />
            ) : (
                <Button
                    text="Next"
                    appearance="primary"
                    isDisabled={!canNext}
                    onClick={onNext}
                />
            )}
        </>
    );

    if (footerEl) return createPortal(actions, footerEl);

    return (
        <div style={{ display: 'flex', gap: 'var(--inline-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
            {actions}
        </div>
    );
};

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
