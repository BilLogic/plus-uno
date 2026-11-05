import React, { useState } from 'react';
import { Form, Table, ButtonGroup, ToggleButton } from 'react-bootstrap';
import { Button, StatusTag } from '@/components';
import DashboardLayout from '@/components/_internal/layout/DashboardLayout';

const LessonsOverviewPage = () => {
    const [viewMode, setViewMode] = useState('list');

    const lessons = [
        { title: 'Lesson Title', area: 'Social-Emotional', status: 'In Progress', duration: '12mins', ai: true },
        { title: 'Lesson Title', area: 'Social-Emotional', status: 'In Progress', duration: '12mins', ai: false },
        { title: 'Lesson Title', area: 'Social-Emotional', status: 'In Progress', duration: '12mins', ai: true },
        { title: 'Lesson Title', area: 'Social-Emotional', status: 'In Progress', duration: '12mins', ai: false },
        { title: 'Lesson Title', area: 'Social-Emotional', status: 'In Progress', duration: '12mins', ai: false },
        { title: 'Lesson Title', area: 'Social-Emotional', status: 'In Progress', duration: '12mins', ai: true },
        { title: 'Lesson Title', area: 'Social-Emotional', status: 'In Progress', duration: '12mins', ai: false },
    ];

    return (
        <DashboardLayout>
            <div className="d-flex flex-column gap-4 h-100">
                {/* Filter Bar */}
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div className="d-flex gap-2">
                        <Form.Select className="form-select-sm" style={{ width: 'auto' }}>
                            <option>All Statuses</option>
                            <option>In Progress</option>
                            <option>Completed</option>
                        </Form.Select>
                    </div>
                    <div className="d-flex gap-2 align-items-center">
                        <Button spacing="compact" text="Expand All" />
                        <Form.Select className="form-select-sm" style={{ width: 'auto' }}>
                            <option>Sort by Name</option>
                        </Form.Select>
                        <ButtonGroup spacing="compact">
                            <ToggleButton
                                id="list-btn"
                                type="radio"
                                variant={viewMode === 'list' ? 'primary' : 'outline-primary'}
                                name="view"
                                value="list"
                                checked={viewMode === 'list'}
                                onChange={(e) => setViewMode(e.currentTarget.value)}
                            >
                                <i className="fas fa-list"></i>
                            </ToggleButton>
                            <ToggleButton
                                id="grid-btn"
                                type="radio"
                                variant={viewMode === 'grid' ? 'primary' : 'outline-primary'}
                                name="view"
                                value="grid"
                                checked={viewMode === 'grid'}
                                onChange={(e) => setViewMode(e.currentTarget.value)}
                            >
                                <i className="fas fa-th-large"></i>
                            </ToggleButton>
                        </ButtonGroup>
                    </div>
                </div>

                {/* Lesson List */}
                <div className="flex-grow-1 overflow-auto bg-white rounded border">
                    <Table hover className="m-0">
                        <thead className="bg-light sticky-top">
                            <tr>
                                <th className="py-3 px-4 border-bottom">Lesson Title</th>
                                <th className="py-3 px-4 border-bottom">Competency Area</th>
                                <th className="py-3 px-4 border-bottom">Status</th>
                                <th className="py-3 px-4 border-bottom">Duration</th>
                                <th className="py-3 px-4 border-bottom">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lessons.map((lesson, i) => (
                                <tr key={i}>
                                    <td className="py-3 px-4">
                                        <div className="d-flex align-items-center gap-2">
                                            {lesson.title}
                                            {lesson.ai && <StatusTag appearance="discovery">AI</StatusTag>}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4"><StatusTag>{lesson.area}</StatusTag></td>
                                    <td className="py-3 px-4"><StatusTag appearance="warning">{lesson.status}</StatusTag></td>
                                    <td className="py-3 px-4">{lesson.duration}</td>
                                    <td className="py-3 px-4"><Button appearance="subtle" spacing="compact" text="Start" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>

                {/* Footnote */}
                <div className="d-flex justify-content-between align-items-center text-muted small">
                    <div>v5.2.0 | Copyright © Carnegie Mellon University 2024 | Terms of Use</div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default LessonsOverviewPage;
