import React from 'react';
import PropTypes from 'prop-types';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import './LessonsFiltersSection.scss';

const statusOptions = [{ value: 'all', label: 'All Lessons' }, { value: 'completed', label: 'Completed' }, { value: 'in-progress', label: 'In Progress' }, { value: 'not-started', label: 'Not Started' }];

const LessonsFiltersSection = ({ statusFilter = 'all', searchQuery = '', onStatusChange, onSearchChange }) => {
    return (
        <section className="lessons-filters-section">
            <div className="lessons-filters-section__left">
                <Form.Select className="lessons-filters-section__status-select body2-txt" value={statusFilter} onChange={(e) => onStatusChange && onStatusChange(e.target.value)}>
                    {statusOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                </Form.Select>
            </div>
            <div className="lessons-filters-section__right">
                <InputGroup className="lessons-filters-section__search">
                    <InputGroup.Text><i className="fas fa-search" /></InputGroup.Text>
                    <Form.Control type="text" placeholder="Search lessons..." value={searchQuery} onChange={(e) => onSearchChange && onSearchChange(e.target.value)} />
                </InputGroup>
            </div>
        </section>
    );
};

LessonsFiltersSection.propTypes = {
    statusFilter: PropTypes.string,
    searchQuery: PropTypes.string,
    onStatusChange: PropTypes.func,
    onSearchChange: PropTypes.func,
};

export default LessonsFiltersSection;
