import React from 'react';
import PropTypes from 'prop-types';

const Footer = ({
    version = 'v1.0.0',
    copyright = 'Copyright © Carnegie Mellon University 2024',
    termsText = 'Terms of Use',
    termsUrl = '#',
    className = '',
    style,
}) => {
    return (
        <footer
            className={`plus-footer d-flex justify-content-between align-items-center py-2 mt-auto w-100 border-top border-outline-variant ${className}`}
            style={{
                ...style
            }}
        >
            <div className="d-flex gap-3 align-items-center">
                <span className="body3-txt text-muted">{version}</span>
                <span className="body3-txt text-muted">|</span>
                <span className="body3-txt text-muted">{copyright}</span>
            </div>
            <div>
                <a href={termsUrl} className="body3-txt text-primary text-decoration-none">{termsText}</a>
            </div>
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
