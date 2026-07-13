import React from 'react';
import Progress from '@/components/status-and-loading/Progress';

const FormProgress = ({ value }) => {
    return (
        <Progress
            value={value}
            min={0}
            max={100}
            style="primary"
            size="small"
        />
    );
};

export default FormProgress;
