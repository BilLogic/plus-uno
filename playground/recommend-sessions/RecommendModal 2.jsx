import React, { useState } from 'react';
import { Modal, Button, Dropdown, Input } from '@plus-ds/components';

export default function RecommendModal({ onClose, onRecommendSuccess }) {
    const [step, setStep] = useState(1);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [reason, setReason] = useState("");

    const handleNext = () => setStep(2);
    const handleBack = () => setStep(1);
    const handleRecommendClick = () => setStep(3);

    const handleConfirm = () => {
        console.log("Recommended with reason:", reason);
        if (onRecommendSuccess) {
            onRecommendSuccess();
        } else {
            onClose();
        }
    };

    const renderCriteriaSelection = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-lg)' }}>
            <div className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                Select a student and subject to find relevant sessions they can join.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                <label className="body3-txt" style={{ fontWeight: 600 }}>Student</label>
                <Dropdown
                    buttonText={selectedStudent || "Select student..."}
                    style="secondary"
                    fill="outline"
                    items={[
                        { text: 'Student A', onClick: () => setSelectedStudent('Student A') },
                        { text: 'Student B', onClick: () => setSelectedStudent('Student B') }
                    ]}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                <label className="body3-txt" style={{ fontWeight: 600 }}>Subject</label>
                <Dropdown
                    buttonText={selectedSubject || "Select subject..."}
                    style="secondary"
                    fill="outline"
                    items={[
                        { text: 'Math', onClick: () => setSelectedSubject('Math') },
                        { text: 'English', onClick: () => setSelectedSubject('English') }
                    ]}
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--size-section-gap-md)' }}>
                <Button
                    text="Find Sessions"
                    style="primary"
                    fill="filled"
                    disabled={!selectedStudent || !selectedSubject}
                    onClick={handleNext}
                />
            </div>
        </div>
    );

    const renderResults = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
            <div className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                Here are sessions that match {selectedStudent}'s needs for {selectedSubject}.
            </div>

            <div style={{
                border: '1px solid var(--color-outline-variant, #e0e0e0)',
                borderRadius: 'var(--size-card-radius-md)',
                padding: 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <div className="h6">Lincoln High - {selectedSubject} Review</div>
                    <div className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>Tomorrow, 2:00 PM • 3 open slots</div>
                </div>
                <Button text="Recommend" style="primary" fill="outline" size="small" onClick={handleRecommendClick} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--size-section-gap-sm)' }}>
                <Button text="Back" style="secondary" fill="ghost" onClick={handleBack} />
                <Button text="Close" style="primary" fill="filled" onClick={onClose} />
            </div>
        </div>
    );

    const renderConfirm = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
            <div className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                Provide a reason for recommending <strong>Lincoln High - {selectedSubject} Review</strong> to <strong>{selectedStudent}</strong>. This will be shared with the student.
            </div>

            <Input
                label="Reason for recommendation"
                placeholder="e.g. This session covers the topics you struggled with last week..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--size-section-gap-sm)' }}>
                <Button text="Back" style="secondary" fill="ghost" onClick={() => setStep(2)} />
                <Button
                    text="Confirm Recommendation"
                    style="primary"
                    fill="filled"
                    disabled={!reason.trim()}
                    onClick={handleConfirm}
                />
            </div>
        </div>
    );

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050
        }}>
            <Modal
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span>
                            {step === 3 ? "Confirm Recommendation" : "Recommend Sessions"}
                        </span>
                    </div>
                }
                onClose={onClose}
                width={560}
                showBottomButtons={false}
            >
                {step === 3 ? renderConfirm() : step === 2 ? renderResults() : renderCriteriaSelection()}
            </Modal>
        </div>
    );
}
