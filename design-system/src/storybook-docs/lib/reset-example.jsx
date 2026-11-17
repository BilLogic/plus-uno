import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components';

/** Neutral docs-only reset action for live pattern examples after an interactive state change. */
export const ResetExampleButton = ({ onReset }) => (
    <Button text="Reset example" appearance="subtle" spacing="compact" onClick={onReset} />
);

ResetExampleButton.propTypes = {
    onReset: PropTypes.func.isRequired,
};
