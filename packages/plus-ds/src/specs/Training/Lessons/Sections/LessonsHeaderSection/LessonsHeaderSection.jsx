import React from 'react';
import PropTypes from 'prop-types';
import Breadcrumb from '@/components/Breadcrumb';
import UserAvatar from '@/components/UserAvatar';
import './LessonsHeaderSection.scss';

const LessonsHeaderSection = ({ breadcrumbs = [{ text: 'Home', href: '#' }, { text: 'Training', href: '#' }, { text: 'Lessons' }], userName = 'John Doe', onUserClick }) => {
    return (
        <header className="lessons-header-section">
            <div className="lessons-header-section__breadcrumb"><Breadcrumb items={breadcrumbs} /></div>
            <div className="lessons-header-section__user"><UserAvatar name={userName} firstChar={userName.charAt(0).toUpperCase()} counter={false} onClick={onUserClick} /></div>
        </header>
    );
};

LessonsHeaderSection.propTypes = {
    breadcrumbs: PropTypes.array,
    userName: PropTypes.string,
    onUserClick: PropTypes.func,
};

export default LessonsHeaderSection;
