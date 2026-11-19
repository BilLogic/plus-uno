import React from 'react';
import { Banner, Flag, FlagGroup } from '@/components';

/**
 * The Notifications page's do and don't examples, as PLUS parts only. Show code
 * prints each one from this file; the page padding that holds them lives in
 * `NotificationsCases.jsx`.
 */

export const FlagDo = () => (
    <FlagGroup>
        <Flag icon="circle-check" title="Session logged" autohide={false} show>Maya's supervisor will see it Friday.</Flag>
    </FlagGroup>
);

export const FlagDont = () => (
    <FlagGroup>
        <Flag title="Move this session to 4:30 PM?" autohide={false} show actions={[{ text: 'Move', onClick: () => {} }, { text: 'Keep', onClick: () => {} }]} />
    </FlagGroup>
);

export const BannerDo = () => (
    <Banner appearance="danger">We lost the connection. Your work is kept on this device.</Banner>
);

export const BannerDont = () => (
    <>
        <Banner appearance="warning">Tutoring sessions move to the new calendar on Friday.</Banner>
        <Banner appearance="danger">We lost the connection. Your work is kept on this device.</Banner>
    </>
);
