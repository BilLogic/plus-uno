import React from 'react';
import PropTypes from 'prop-types';

import { Link } from '@/components';

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
                backgroundColor: 'var(--ds-surface)',
                padding: 'var(--size-section-pad-y-md)',
            }}
        >
            <footer style={{ paddingBottom: 'var(--pad-y-lg)' }}>
                <p className="m-0" style={{ font: 'var(--body-small)', color: 'var(--ds-text)' }}>
                    {version} | {copyright} | <Link href={termsUrl}>{termsText}</Link>
                </p>
            </footer>
        </div>
    );
}

LoginFooter.propTypes = {
    version: PropTypes.string,
    copyright: PropTypes.string,
    termsText: PropTypes.string,
    termsUrl: PropTypes.string,
};
