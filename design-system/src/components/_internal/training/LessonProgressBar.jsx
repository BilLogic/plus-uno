import React from 'react';

const LessonProgressBar = ({ progressBars }) => {
    // progressBars: Array of numbers (width in px or percentage)
    // 0 means empty, >0 means filled

    return (
        <div className="d-flex gap-2 w-100 px-3">
            {progressBars.map((width, index) => (
                <div key={index} className="flex-grow-1 d-flex flex-column align-items-center">
                    <div className="w-100 bg-light rounded overflow-hidden" style={{ height: '6px' }}>
                        <div
                            className="h-100 bg-primary"
                            style={{ width: width > 0 ? '100%' : '0%' }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default LessonProgressBar;
