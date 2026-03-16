/**
 * Footer (Footnote) Component
 * 
 * Page footer with version, copyright, and terms link.
 * Figma Spec: node-id=111-227939
 */

import React from 'react';
import PropTypes from 'prop-types';

const Footer = ({
    version = 'v5.2.0',
    copyright = 'Copyright © Carnegie Mellon University 2026',
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
                padding: '0 0 var(--size-element-pad-y-lg) 0',
                ...style
            }}
        >
            <p
                className="body3-txt m-0"
                style={{
                    color: 'var(--color-on-surface)',
                    fontWeight: 300
                }}
            >
                {version} | {copyright} | <a
                    href={termsUrl}
                    style={{
                        color: 'var(--color-on-surface)',
                        textDecoration: 'none'
                    }}
                >{termsText}</a>
            </p>
        </footer>
    );
};

Footer.propTypes = {
    version: PropTypes.string,
    copyright: PropTypes.string,
    termsText: PropTypes.string,
    termsUrl: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default Footer;
