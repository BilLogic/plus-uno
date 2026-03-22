import React, { useState } from 'react'
import Button from '@plus-ds/components/Button/index.js'

const mockTutors = [
    { id: 101, name: 'Alice Johnson', subjects: 'Math, Science', rating: '4.9', avatar: 'A' },
    { id: 102, name: 'Bob Smith', subjects: 'English, History', rating: '4.7', avatar: 'B' },
    { id: 103, name: 'Charlie Davis', subjects: 'Math, Physics', rating: '5.0', avatar: 'C' },
    { id: 104, name: 'Diana Prince', subjects: 'All subjects', rating: '4.8', avatar: 'D' },
]

export default function RecommendTutorsView({ session, onClose, onBack }) {
    const [selectedTutors, setSelectedTutors] = useState([])
    const [step, setStep] = useState('select') // 'select', 'success'

    const handleToggleTutor = (id) => {
        setSelectedTutors(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        )
    }

    const handleSend = () => {
        if (selectedTutors.length > 0) {
            setStep('success')
        }
    }

    if (step === 'success') {
        return (
            <div className="modal-body success-state">
                <div className="icon">✓</div>
                <h3>Recommendations Sent!</h3>
                <p>We've notified {selectedTutors.length} tutor(s) about this session.</p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <Button text="Back to Session" style="secondary" fill="outlined" onClick={onBack} />
                    <Button text="Close" style="primary" fill="filled" onClick={onClose} />
                </div>
            </div>
        )
    }

    return (
        <div className="modal-body recommend-tutors-view">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px' }}>Recommend to Tutors</h3>
                <p style={{ margin: 0, color: 'var(--plus-color-text-secondary)', fontSize: '14px' }}>
                    Select tutors to notify
                </p>
            </div>

            <div className="recommend-tutors-list">
                {mockTutors.map(tutor => (
                    <div
                        key={tutor.id}
                        className={`tutor-row ${selectedTutors.includes(tutor.id) ? 'selected' : ''}`}
                        onClick={() => handleToggleTutor(tutor.id)}
                    >
                        <div className="avatar">{tutor.avatar}</div>
                        <div className="tutor-info">
                            <div className="name">{tutor.name}</div>
                            <div className="metrics">{tutor.subjects} • ⭐ {tutor.rating}</div>
                        </div>
                        <input
                            type="checkbox"
                            checked={selectedTutors.includes(tutor.id)}
                            readOnly
                        />
                    </div>
                ))}
            </div>

            <div className="modal-footer" style={{ marginTop: '24px', padding: 0, border: 'none' }}>
                <Button text="Cancel" style="secondary" fill="outlined" onClick={onBack} />
                <Button
                    text={`Send Recommendations (${selectedTutors.length})`}
                    style="primary"
                    fill="filled"
                    onClick={handleSend}
                    disabled={selectedTutors.length === 0}
                />
            </div>
        </div>
    )
}
