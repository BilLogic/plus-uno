import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components';

/**
 * LinkButton: the design system's Button drawn over a router Link, for an
 * action that goes somewhere ("Open session", "All students"). It keeps the
 * link role, which Button's polymorphic `as` would otherwise turn into a
 * button. Takes Button's props plus `to`.
 */
const LinkButton = (props) => <Button as={Link} role="link" {...props} />;

export default LinkButton;
