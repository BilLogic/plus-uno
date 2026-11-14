import React, { useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/forms-and-inputs/Button';
import useFieldId from '../useFieldId';
import Icon from '../../images-and-icons/Icon';
import FileUploadContext from '../_internal/FileUploadContext';
import './FileUpload.scss';

function collectFileItemStatuses(children, out = []) {
    React.Children.forEach(children, (child) => {
        if (!React.isValidElement(child)) return;
        if (child.type === React.Fragment) {
            collectFileItemStatuses(child.props?.children, out);
            return;
        }
        const typeName = child.type?.displayName || child.type?.name;
        if (typeName === 'FileItem' || (child.props && 'status' in child.props && 'name' in child.props)) {
            out.push(child.props.status);
        }
    });
    return out;
}

/** FileUpload: a form field that opens the platform file or folder picker, accepts drops, and displays chosen FileItem rows below the drop zone. */
const FileUpload = ({
    id,
    name,
    label,
    isRequired = false,
    description,
    acceptedFormats,
    allowFolders = false,
    isDisabled = false,
    isReadOnly = false,
    validation = 'none',
    validationMessage,
    buttonText = 'Choose a file',
    className = '',
    style,
    onChange,
    onDrop,
    onFocus,
    onBlur,
    children,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const dragDepthRef = useRef(0);
    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null);
    /** One id for the label and the file input — see `useFieldId` (#206). */
    const fieldId = useFieldId(id);
    const state = validation;

    const descriptionId = `${fieldId}-description`;
    const validationId = state !== 'none' && validationMessage
        ? `${fieldId}-validation`
        : undefined;

    const setFolderInputNode = (node) => {
        folderInputRef.current = node;
        if (node) {
            node.setAttribute('webkitdirectory', '');
            node.setAttribute('directory', '');
        }
    };

    const batchStatus = useMemo(() => {
        const statuses = collectFileItemStatuses(children);
        const uploadingCount = statuses.filter((s) => s === 'uploading').length;
        if (uploadingCount === 0) return null;
        const doneCount = statuses.filter((s) => s === 'done').length;
        const current = doneCount + uploadingCount;
        return `Uploading ${current} of ${statuses.length}`;
    }, [children]);

    const contextValue = useMemo(
        () => ({ isDisabled, isReadOnly }),
        [isDisabled, isReadOnly]
    );

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

    const handleFolderClick = (e) => {
        e.preventDefault();
        if (!isDisabled && !isReadOnly && folderInputRef.current) {
            folderInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        if (isDisabled || isReadOnly) return;
        if (onChange) {
            onChange(e);
        }
    };

    const handleDragEnter = (e) => {
        if (isDisabled || isReadOnly) return;
        e.preventDefault();
        dragDepthRef.current += 1;
        setIsDragOver(true);
    };

    const handleDragOver = (e) => {
        if (isDisabled || isReadOnly) return;
        e.preventDefault();
        if (!isDragOver) setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        if (isDisabled || isReadOnly) return;
        e.preventDefault();
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
        if (dragDepthRef.current === 0) {
            setIsDragOver(false);
        }
    };

    const handleDrop = (e) => {
        dragDepthRef.current = 0;
        setIsDragOver(false);
        if (isDisabled || isReadOnly) {
            e.preventDefault();
            return;
        }
        e.preventDefault();
        if (onDrop) {
            onDrop(e);
            return;
        }
        if (onChange && (e.dataTransfer?.files?.length || e.dataTransfer?.items?.length)) {
            onChange({
                ...e,
                dataTransfer: e.dataTransfer,
                target: { ...e.target, files: e.dataTransfer?.files ?? [] },
            });
        }
    };

    const validationIcon = state === 'invalid' ? (
        <Icon name="triangle-exclamation" />
    ) : state === 'valid' ? (
        <Icon name="circle-check" />
    ) : null;

    // Build description text
    const descriptionText = description || (acceptedFormats && acceptedFormats.length > 0
        ? `Accepted formats are ${acceptedFormats.join(', ')}`
        : null);

    // Build accept attribute for file input (.zip works as an ordinary file when listed)
    const acceptAttribute = acceptedFormats && acceptedFormats.length > 0
        ? acceptedFormats.join(',')
        : undefined;

    return (
        <FileUploadContext.Provider value={contextValue}>
            <div
                className={`plus-file-upload-wrapper ${className}`}
                style={style}
            >
                {(label || batchStatus) && (
                    <div className="plus-file-upload-label-row">
                        {label && (
                            <label htmlFor={fieldId} className={`plus-file-upload-label ${isDisabled ? 'plus-file-upload-label-disabled' : ''}`}>
                                {label}
                                {isRequired && (
                                    <span className="plus-file-upload-required" aria-label="required">*</span>
                                )}
                            </label>
                        )}
                        {batchStatus && (
                            <span className="plus-file-upload-batch-status" role="status" aria-live="polite">
                                {batchStatus}
                            </span>
                        )}
                    </div>
                )}

                {/*
                 * The frame holds the description and the picker control, like the
                 * shared field box: focus, drag-over and validation outline this whole
                 * drop zone, never the button alone. The label row sits above it; the
                 * FileItem list and the validation message sit below it.
                 */}
                <div
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={[
                        'plus-file-upload-container',
                        isDisabled ? 'plus-file-upload-disabled' : '',
                        isReadOnly ? 'plus-file-upload-readonly' : '',
                        state !== 'none' ? `plus-file-upload-${state}` : '',
                        isFocused ? 'plus-file-upload-focused' : '',
                        isDragOver ? 'plus-file-upload-drag-over' : '',
                    ].filter(Boolean).join(' ')}
                >
                    {descriptionText && (
                        <p id={descriptionId} className="plus-file-upload-description">
                            {descriptionText}
                        </p>
                    )}

                    <div className="plus-file-upload-button-container">
                        <input
                            ref={fileInputRef}
                            type="file"
                            id={fieldId}
                            name={name}
                            accept={acceptAttribute}
                            multiple={allowFolders ? true : props.multiple}
                            disabled={isDisabled}
                            onChange={handleFileChange}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            onClick={isReadOnly ? (event) => event.preventDefault() : undefined}
                            onKeyDown={isReadOnly ? (event) => { if (event.key === 'Enter' || event.key === ' ') event.preventDefault(); } : undefined}
                            className="plus-file-upload-input"
                            aria-label={typeof label === 'string' && label ? label : 'File upload'}
                            {...props}
                            aria-describedby={[
                                props['aria-describedby'],
                                descriptionText ? descriptionId : undefined,
                                validationId,
                            ].filter(Boolean).join(' ') || undefined}
                            aria-invalid={state === 'invalid' || undefined}
                            aria-readonly={isReadOnly || undefined}
                        />
                        {allowFolders && (
                            <input
                                ref={setFolderInputNode}
                                type="file"
                                multiple
                                tabIndex={-1}
                                aria-hidden="true"
                                disabled={isDisabled}
                                onChange={handleFileChange}
                                className="plus-file-upload-input"
                            />
                        )}
                        {!isReadOnly && (
                            allowFolders ? (
                                <p className="plus-file-upload-drop-line">
                                    <Button
                                        appearance="subtle"
                                        spacing="compact"
                                        className="plus-file-upload-inline-action"
                                        isDisabled={isDisabled}
                                        onClick={handleButtonClick}
                                        onFocus={handleFocus}
                                        onBlur={handleBlur}
                                    >
                                        Choose files
                                    </Button>
                                    {' or '}
                                    <Button
                                        appearance="subtle"
                                        spacing="compact"
                                        className="plus-file-upload-inline-action"
                                        isDisabled={isDisabled}
                                        onClick={handleFolderClick}
                                        onFocus={handleFocus}
                                        onBlur={handleBlur}
                                    >
                                        a folder
                                    </Button>
                                    , or drop them here
                                </p>
                            ) : (
                                <Button
                                    text={buttonText}
                                    appearance="primary"
                                    isDisabled={isDisabled}
                                    onClick={handleButtonClick}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                />
                            )
                        )}
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
        </FileUploadContext.Provider>
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
    /** Shows the `"Choose files or a folder, or drop them here"` line and enables picking or dropping a folder. */
    allowFolders: PropTypes.bool,
    /** Disables the picker controls and file input and dims the field and its FileItem rows. */
    isDisabled: PropTypes.bool,
    /** Shows the field and its files without a way to choose or remove files. */
    isReadOnly: PropTypes.bool,
    /** `none` (default) shows no state, `invalid` draws the error state and `valid` the success state. Pair `invalid` or `valid` with `validationMessage`. */
    validation: PropTypes.oneOf(['none', 'invalid', 'valid']),
    /** Message shown under the field for the `invalid` or `valid` state. Not shown when `validation` is `none`. */
    validationMessage: PropTypes.string,
    /** The label of the choose-file button when `allowFolders` is false. Defaults to `Choose a file`. */
    buttonText: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
    onChange: PropTypes.func,
    /** Called with the drop event when files or folders are dropped onto the drop zone. */
    onDrop: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    /** The uploaded-file list (`FileItem` rows), shown below the drop zone and outside the frame. */
    children: PropTypes.node,
};

export default FileUpload;
