import React from 'react';

import Button from '@/components/actions/Button';

import googleIcon from '@/assets/images/auth-providers/google-icon.svg';
import cleverImage from '@/assets/images/auth-providers/clever-image.png';

import './AuthButtons.scss';

/**
 * SSO authentication provider buttons (Google and Clever).
 *
 * @returns {React.ReactElement}
 */
export default function LoginAuthButtons() {
    return (
        <div className="login-auth-buttons">
            <Button
                text="Continue with Google"
                style="primary"
                fill="outline"
                size="medium"
                block
                leadingVisual={<img src={googleIcon} alt="" className="login-auth-buttons__google-icon" />}
            />

            <button type="button" className="login-auth-buttons__clever" aria-label="Continue with Clever">
                <img src={cleverImage} alt="" className="login-auth-buttons__clever-image" />
            </button>
        </div>
    );
}
