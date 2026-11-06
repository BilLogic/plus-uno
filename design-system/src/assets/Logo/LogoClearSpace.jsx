import React from 'react';
import Logo from './Logo';
import './LogoClearSpace.scss';

/**
 * The Logo clear-space drawing, docs only: half the logomark's height on every
 * side of the lockup, measured from the logomark's edge. Not part of the Logo's
 * props and not exported from the component barrel.
 */
const LogoClearSpace = ({ size = 64, appearance = 'colored' }) => (
    <div className="plus-logo-clear" data-testid="logo-clear-space" style={{ '--logo-mark': `${size}px` }}>
        <span className="plus-logo-clear__tag plus-logo-clear__tag--top">½</span>
        <span className="plus-logo-clear__tag plus-logo-clear__tag--left">½</span>
        <span className="plus-logo-clear__tag plus-logo-clear__tag--right">½</span>
        <span className="plus-logo-clear__tag plus-logo-clear__tag--bottom">½</span>
        <Logo appearance={appearance} size={size} wordmark data-testid="clear-space-logo" />
    </div>
);

export default LogoClearSpace;
export { LogoClearSpace };
