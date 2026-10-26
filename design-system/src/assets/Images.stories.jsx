import React from 'react';
import googleIconSrc from './images/auth-providers/google-icon.svg';
import cleverImageSrc from './images/auth-providers/clever-image.png';

export default {
    title: 'Foundations/Imagery',
    tags: ['!dev', '!autodocs'],
};

/** The two sign-in provider marks the product ships. */
export const AuthProviders = () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <img src={googleIconSrc} alt="Google" height={40} />
        <img src={cleverImageSrc} alt="Clever" height={40} />
    </div>
);
