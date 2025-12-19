import React, { useState } from 'react';
import { Button, Card } from '../../../components';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LessonProgressBar from '@/components/training/LessonProgressBar';
import LikertScale from '@/components/training/LikertScale';

const LessonInnerPage = () => {
    const [page, setPage] = useState(1);

    const progressBars = [1, 0, 0, 0, 0, 0, 0, 0, 0]; // Simplified for demo

    return (
        <DashboardLayout>
            <div className="d-flex flex-column gap-4 h-100">
                {/* Progress Bar */}
                <LessonProgressBar progressBars={progressBars} />

                {/* Alert */}
                <div className="alert alert-info d-flex align-items-center gap-2" role="alert">
                    <i className="fas fa-info-circle"></i>
                    <div>
                        <strong>For Supervisors:</strong> This lesson includes AI-powered features.
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white p-4 rounded border shadow-sm d-flex flex-column gap-4" style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
                    {page === 1 && (
                        <>
                            <div className="text-center">
                                <h2 className="h4 fw-bold">Giving Effective Praise</h2>
                                <div className="text-muted d-flex align-items-center justify-content-center gap-2">
                                    <i className="far fa-clock"></i>
                                    <span>Estimate Time: 15 Minutes</span>
                                </div>
                            </div>

                            <div className="text-center p-4 bg-light rounded">
                                Image Placeholder
                            </div>

                            <div>
                                <p>Praising students for working hard and putting forth effort is a great way to increase student motivation. When the learning gets tough, giving effective praise is a powerful strategy to encourage students to keep going.</p>
                                <p>Upon completion you will be able to:</p>
                                <ul>
                                    <li>Explain how to increase student motivation by giving praise</li>
                                    <li>Identify features of effective praise</li>
                                    <li>Apply strategies by responding to students through praise</li>
                                </ul>
                            </div>

                            <LikertScale
                                question="How confident are you in your knowledge of this topic?"
                                leftLabel="Not at all confident"
                                rightLabel="Extremely confident"
                            />

                            <LikertScale
                                question="How would you describe your tutoring experience and skills?"
                                leftLabel="Beginner Tutor"
                                rightLabel="Expert Tutor"
                            />
                        </>
                    )}

                    {/* Navigation */}
                    <div className="d-flex justify-content-end mt-4">
                        <Button style="primary" fill="filled" text="Next" onClick={() => setPage(p => p + 1)} />
                    </div>
                </div>

                {/* Footnote */}
                <div className="text-center text-muted small mt-auto">
                    v5.2.0 | Copyright © Carnegie Mellon University 2024 | Terms of Use
                </div>
            </div>
        </DashboardLayout>
    );
};

export default LessonInnerPage;
