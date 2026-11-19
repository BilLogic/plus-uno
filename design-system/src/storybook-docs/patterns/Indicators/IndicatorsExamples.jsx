import React from 'react';
import { ChangeTag, StatusTag } from '@/components';

/**
 * The Indicators page's do and don't examples, as PLUS parts only. Show code
 * prints each one from this file.
 */

export const DangerOnMissed = () => <StatusTag appearance="danger">Missed</StatusTag>;

export const SuccessOnMissed = () => <StatusTag appearance="success">Missed</StatusTag>;

export const RiseIsBad = () => <ChangeTag value={3} goodDirection="down" comparison="vs last week" />;

export const RiseIsGood = () => <ChangeTag value={3} goodDirection="up" comparison="vs last week" />;
