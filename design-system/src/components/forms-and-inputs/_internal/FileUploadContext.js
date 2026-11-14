import { createContext } from 'react';

/**
 * Carries `isDisabled` and `isReadOnly` from `FileUpload` down to `FileItem`
 * rows passed in `children`, while leaving standalone `FileItem` rows
 * independent when rendered outside `FileUpload`.
 */
const FileUploadContext = createContext({
    isDisabled: false,
    isReadOnly: false,
});

export default FileUploadContext;
