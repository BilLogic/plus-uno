import React from 'react';
import PropTypes from 'prop-types';
import { AppShell } from '../shell';
import { PageHeader } from '../kit';
import './Placeholder.css';

/** A screen not built yet: the shell, its title, and a line saying so. */
const Placeholder = ({ title, breadcrumbs, board }) => (
    <AppShell breadcrumbs={breadcrumbs ?? [{ text: title }]}>
        <div className="tr-placeholder">
            <PageHeader title={title} meta={`This screen is coming next. It follows the ${board} board.`} />
        </div>
    </AppShell>
);

Placeholder.propTypes = {
    title: PropTypes.string.isRequired,
    breadcrumbs: PropTypes.array,
    /** The vision board the screen will follow */
    board: PropTypes.string.isRequired,
};

export default Placeholder;
