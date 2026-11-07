import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/forms-and-inputs/Button';
import useFieldId from '../useFieldId';
import './FileUpload.scss';
import { iconClass } from '../../../lib/icon';

const FileUpload = ({
    id,
    name,
    label,
    isRequired = false,
    description,
    acceptedFormats,
    isDisabled = false,
    isReadOnly = false,
    validation = 'none',
    validationMessage,
    buttonText = 'Choose a file',
    className = '',
    style,
    onChange,
    onFocus,
    onBlur,
    children,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const fileInputRef = useRef(null);
    /** One id for the label and the file input — see `useFieldId` (#206). */
    const fieldId = useFieldId(id);
    const state = validation;

    /*
     * #327 — see `Input.jsx`. This component has TWO things worth pointing at:
     * the format rules, which are standing help, and the validation message,
     * which is a result. Both, in reading order, so "PDF, up to 10 MB" is heard
     * before "that file was too large" rather than instead of it.
     */
    const descriptionId = `${fieldId}-description`;
    const validationId = state !== 'none' && validationMessage
        ? `${fieldId}-validation`
        : undefined;

    const handleFocus = (e) => {
        setIsFocused(true);
        if (onFocus) onFocus(e);
    };

    const handleBlur = (e) => {
        setIsFocused(false);
        if (onBlur) onBlur(e);
    };

    const handleButtonClick = (e) => {
        e.preventDefault();
        if (!isDisabled && !isReadOnly && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        if (isDisabled || isReadOnly) return;
        if (onChange) {
            onChange(e);
        }
    };

    const validationIcon = state === 'invalid' ? (
        <i className={iconClass('triangle-exclamation')} aria-hidden="true" />
    ) : state === 'valid' ? (
        <i className={iconClass('circle-check')} aria-hidden="true" />
    ) : null;

    // Build description text
    const descriptionText = description || (acceptedFormats && acceptedFormats.length > 0
        ? `Accepted formats are ${acceptedFormats.join(', ')}`
        : null);

    // Build accept attribute for file input
    const acceptAttribute = acceptedFormats && acceptedFormats.length > 0
        ? acceptedFormats.join(',')
        : undefined;

    return (
        <div
            className={`plus-file-upload-wrapper ${className}`}
            style={style}
        >
            {label && (
                <label htmlFor={fieldId} className={`plus-file-upload-label ${isDisabled ? 'plus-file-upload-label-disabled' : ''}`}>
                    {label}
                    {isRequired && (
                        <span className="plus-file-upload-required" aria-label="required">*</span>
                    )}
                </label>
            )}

            {/*
             * The frame holds the description and the button, like the shared
             * field box: focus and validation outline this whole field, never
             * the button alone. The label sits above it; the file list and the
             * validation message sit below it.
             */}
            <div
                className={`plus-file-upload-container ${isDisabled ? 'plus-file-upload-disabled' : ''} ${isReadOnly ? 'plus-file-upload-readonly' : ''} ${state !== 'none' ? `plus-file-upload-${state}` : ''} ${isFocused ? 'plus-file-upload-focused' : ''}`}
            >

                {descriptionText && (
                    <p id={descriptionId} className="plus-file-upload-description">
                        {descriptionText}
                    </p>
                )}

                <div className="plus-file-upload-button-container">
                    {/*
                     * Read-only shows the field and its files with nothing to
                     * choose: the input stays for the label and its description,
                     * and the button goes, since a file input has no native
                     * read-only state.
                     */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        id={fieldId}
                        name={name}
                        accept={acceptAttribute}
                        disabled={isDisabled}
                        onChange={handleFileChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        className="plus-file-upload-input"
                        aria-label={label || 'File upload'}
                        {...props}
                        aria-describedby={[
                            props['aria-describedby'],
                            descriptionText ? descriptionId : undefined,
                            validationId,
                        ].filter(Boolean).join(' ') || undefined}
                        aria-invalid={state === 'invalid' || undefined}
                        aria-readonly={isReadOnly || undefined}
                        tabIndex={isReadOnly ? -1 : props.tabIndex}
                    />
                    {!isReadOnly && (<Button
                        text={buttonText}
                        appearance="primary"
                        isDisabled={isDisabled}
                        onClick={handleButtonClick}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                    />)}
                </div>
            </div>

            {children && (
                <div className="plus-file-upload-files">
                    {children}
                </div>
            )}

            {state !== 'none' && validationMessage && (
                <div
                    id={validationId}
                    className={`plus-file-upload-validation plus-file-upload-validation-${state}`}
                >
                    {validationIcon}
                    <span className="plus-file-upload-validation-message">{validationMessage}</span>
                </div>
            )}
        </div>
    );
};

FileUpload.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    /** The visible label above the field. Without one, the file input is named "File upload". */
    label: PropTypes.node,
    /** Shows an asterisk on the label. */
    isRequired: PropTypes.bool,
    /** Help text inside the field, such as size limits. When omitted, it is built from `acceptedFormats`. */
    description: PropTypes.string,
    acceptedFormats: PropTypes.arrayOf(PropTypes.string),
    /** Disables the button and file input and dims the field. */
    isDisabled: PropTypes.bool,
    /** Shows the field and its files without a way to choose a file. */
    isReadOnly: PropTypes.bool,
    /** `none` (default) shows no state, `invalid` draws the error state and `valid` the success state. Pair `invalid` or `valid` with `validationMessage`. */
    validation: PropTypes.oneOf(['none', 'invalid', 'valid']),
    /** Message shown under the field for the `invalid` or `valid` state. Not shown when `validation` is `none`. */
    validationMessage: PropTypes.string,
    /** The label of the choose-file button. Defaults to `Choose a file`. */
    buttonText: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    /** The uploaded-file list, shown below the button and outside the frame. */
    children: PropTypes.node
};

export default FileUpload;


