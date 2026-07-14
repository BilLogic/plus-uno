import React from 'react';
import PropTypes from 'prop-types';

import Footer from '@/components/_internal/Footer';

/**
 * Login page footer with version, copyright, and terms link.
 *
 * @param {object} props
 * @param {string} [props.version='v5.2.0'] - App version string.
 * @param {string} [props.copyright] - Copyright line.
 * @param {string} [props.termsText='Terms of Use'] - Terms link label.
 * @param {string} [props.termsUrl='#'] - Terms link href.
 * @returns {React.ReactElement}
 */
export default function LoginFooter({
    version = 'v5.2.0',
    copyright = 'Copyright © Carnegie Mellon University 2024',
    termsText = 'Terms of Use',
    termsUrl = '#',
}) {
    return (
        <div
            style={{
                backgroundColor: 'var(--color-surface-container)',
                padding: 'var(--size-section-pad-y-md)',
            }}
        >
            <Footer
                version={version}
                copyright={copyright}
                termsText={termsText}
                termsUrl={termsUrl}
            />
        </div>
    );
}

LoginFooter.propTypes = {
    version: PropTypes.string,
    copyright: PropTypes.string,
    termsText: PropTypes.string,
    termsUrl: PropTypes.string,
};
