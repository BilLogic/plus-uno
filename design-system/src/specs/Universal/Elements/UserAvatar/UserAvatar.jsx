/**
 * UserAvatar Component
 *
 * The Specs User Avatar on the design system's UserAvatar (`@/components`):
 * user initial, name, and the "Lead" role indicator for a lead tutor or a
 * notification counter for everyone else. Pass `size="md"` for the 32 topbar.
 * Figma Spec: node-id=111-227876
 */

import React from 'react';
import { UserAvatar as BaseUserAvatar } from '@/components';

const UserAvatar = ({ counter = true, type = 'regular tutor', ...props }) => (
    <BaseUserAvatar {...props} type={type} counter={type === 'lead tutor' ? false : counter} />
);

UserAvatar.propTypes = BaseUserAvatar.propTypes;

export default UserAvatar;
