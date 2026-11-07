import React from 'react';
import PropTypes from 'prop-types';
import './Footer.scss';

/**
 * Footer (Footnote) Component
 * 
 * Per Figma spec: node-id=111-227939
 * Simple footer with version, copyright, and terms - no border/stroke
 */
const Footer = ({
    version = 'v5.2.0',
    copyright = 'Copyright © Carnegie Mellon University 2024',
    termsText = 'Terms of Use',
    termsUrl = '#',
    className = '',
    style,
}) => {
    return (
        <footer
            className={`plus-footer ${className}`}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                width: '100%',
                padding: '0 0 var(--pad-y-lg) 0',
                ...style
            }}
        >
            <p
                className="m-0"
                style={{
                    font: 'var(--body-small)',
                    color: 'var(--ds-text)'
                }}
            >
                {version} | {copyright} | <a
                    href={termsUrl}
                    className="plus-footer-link"
                >{termsText}</a>
            </p>
        </footer>
    );
};

Footer.propTypes = {
    /** The product version, shown first. */
    version: PropTypes.string,
    /** The copyright line, shown after the version. */
    copyright: PropTypes.string,
    /** The label of the terms link. */
    termsText: PropTypes.string,
    /** The `href` of the terms link. */
    termsUrl: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default Footer;
